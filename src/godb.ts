import GoDBTable from './table';
import { indexedDB } from './global/window';
import { GoDBConfig, GoDBSchema, GoDBTableSchema, GoDBTableDict, GetDBCallback } from './global/types';

export default class GoDB {

  name: string;
  version: number;

  idb: IDBDatabase;
  tables: GoDBTableDict;

  private _closed: boolean;
  private _connection: IDBOpenDBRequest;
  private _callbackQueue: Array<Function>;

  // defined by user:
  // TODO: DBChangeFunction
  onOpened: Function;
  onClosed: Function;

  constructor(name: string, config?: GoDBConfig) {

    // init params
    this.tables = {};
    this._callbackQueue = [];

    // save database's name
    this.name = name;

    // settings
    if (config) {

      const { schema, version } = config;

      if (version)
        this.version = version;

      // init tables
      for (let table in schema)
        this.tables[table] = new GoDBTable(this, table, schema[table]);

    }

    // open connection to the IndexedDB
    this.getDB();
  }

  table(table: string, tableSchema?: GoDBTableSchema): GoDBTable {
    if (!this.tables[table]) {
      if (this.idb && tableSchema && typeof tableSchema === 'object') {
        // TODO: create a new objectStore when database is already opened
      }
      this.tables[table] = new GoDBTable(this, table, tableSchema);
    }
    return this.tables[table];
  }

  // init the database with schema
  // TODO: when db is not empty, clear the db, then change db version to 1
  init(schema: GoDBSchema): void {
    if (!schema) return console.warn('Init failed: schema is not provided');
    if (!this.idb) return console.warn('Init failed: database is not opened yet');
  }

  close(): void {
    if (this.idb) {
      this.idb.close();
      this.idb = null;
      this._connection = null;
      this._closed = true;
      console.log(`Connection to '${this.idb.name}' is closed`);
    } else {
      console.warn('Unable to close: database is not opened');
    }
  }

  // drop a database by its name
  // TODO: make this no-static, close the database before dropping
  drop(): Promise<Event> {
    return new Promise((resolve, reject) => {

      this.close();
      const database = this.name;

      // no need to handle Exception according to MDN
      const deleteRequest = indexedDB.deleteDatabase(database);

      deleteRequest.onsuccess = (ev) => {
        console.log(`Local database '${database}' is successfully dropped!`);
        if (this.onClosed) {
          if (typeof this.onClosed === 'function')
            this.onClosed();
          else
            console.warn(`'onClosed' should be a function, not ${typeof this.onClosed}`);
        }
        resolve(ev);
      };

      deleteRequest.onerror = (ev) => {
        const { error } = ev.target as IDBOpenDBRequest;
        const { name, message } = error;
        console.warn(
          `Local database '${database}' deleting failed!\
          \n- ${name}: ${message}`
        );
        reject(`${name}: ${message}`);
      };
    });
  }

  // TODO: backup for dangerous operations, like drop() and version change events
  backup(): void {

  }

  getDBState(): string {
    if (this._closed)
      return 'closed';
    if (this.idb)
      return 'opened';
    if (this._connection)
      return 'connecting';
    return 'init';
  }

  // Require IDBTransaction `versionchange`
  createTable(table: string, schema: GoDBTableSchema): void {
    const idb = this.idb;
    if (!idb) return console.error(`Create table '${table}' failed: database is not opened`);
    if (!idb.objectStoreNames.contains(table)) {
      const objectStore = idb.createObjectStore(table, {
        keyPath: 'id',
        autoIncrement: true
      });

      console.log(`Table['${table}'] created in Database['${idb.name}']`);

      for (let index in schema) {
        if (index === 'id') continue;
        const unique = !!schema[index]['unique'];
        objectStore.createIndex(index, index, { unique })
        console.log(`Index['${index}'] created in Table['${table}'], Database['${idb.name}']`)
      }
    } else {
      // TODO: update table schema
    }
  }

  /**
   * It is necessary to get `IDBDatabase` instance (`this.idb`) before
   *  table operations like table.add(), table.get(), etc.
   *  that's why a `getDB` function was needed in this class
   *
   * There are 4 possible states when calling `getDB`:
   *
   * State `closed`: database is closed or dropped by user
   * Operation: warning user in console, not calling callback
   * Where: After invoking `this.close()` or `this.drop()`
   *
   * State `init`: no connection yet (`this.connection` is undefined)
   * Operation: open connection to the IndexedDB database
   * Where: Constructor's `this.getDB()`, only executed once
   *
   * State `connecting`: connection opened, but db is not opened yet (`this.idb` is undefined)
   * Operation: push the table operations to a queue, executing them when db is opened
   * Where: Table operations that are in the same macrotask as `new GoDB()`
   *
   * State `opened`: The database is opened
   * Operation: Invoking the callback synchronously with `this.idb`
   * Where: Table operations when the db is opened,
   *  mention that the db's opening only takes a few milliseconds,
   *  and normally most of user's table operations will happen after db's opening
   *
   * State sequence:
   * init -> connecting -> opened -> closed
   *
   * Attention: callback is async-called in state `init` and `connecting`,
   * but being sync-called in state `opened`
   */
  getDB(callback?: GetDBCallback): void {

    // State `opened`: db is opened, calling callback synchronously with IDBDatabase instance
    if (this.idb) {
      if (callback && typeof callback === 'function')
        callback(this.idb);
      return;
    }

    // State `closed`: db is closed
    if (this._closed) {
      console.warn('getDB failed: database is closed');
      return;
    }

    // State `connecting`: connection is opened, but db is not opened yet
    if (this._connection) {
      if (callback && typeof callback === 'function')
        this._callbackQueue.push(callback);
      return;
    }

    // State `init`: opening connection to IndexedDB
    const database = this.name;
    const tables = this.tables;

    if (this.version)
      this._connection = indexedDB.open(database, this.version);
    else
      this._connection = indexedDB.open(database);

    this._connection.onsuccess = (ev) => {

      const { result } = this._connection || ev.target as IDBOpenDBRequest;

      // triggered when 'onupgradeneeded' was not called
      // meaning that the database was already existed in browser
      if (!this.idb) {
        this.idb = result;
        console.log(`Database['${database}'] existed with version (${result.version})`);
      }
      console.log(`Local database '${database}' is opened!`);

      // executing operations invoked by user at State `connecting`
      if (this._callbackQueue?.length) {
        this._callbackQueue.forEach(fn => fn(this.idb))
      }

      // call onOpened if it is defined by user
      if (this.onOpened) {
        if (typeof this.onOpened === 'function')
          this.onOpened(this.idb);
        else
          console.warn(`'onOpened' should be a function, not ${typeof this.onOpened}`);
      }

      // The code below is actually not necessary,
      //  cuz it will only be invoked in the constructor,
      //  and constructor's `getDB` has no callback
      // if (callback && typeof callback === 'function')
      //   callback(result);
    };

    // called every time when db version changed
    this._connection.onupgradeneeded = (ev) => {
      const { oldVersion, newVersion, target } = ev;

      // get database instance
      this.idb = (target as IDBOpenDBRequest).result;

      console.log(`Database['${database}'] version changed from (${oldVersion}) to (${newVersion})`);

      // create a new database
      if (oldVersion === 0 && newVersion > 0) {
        console.log(`Database['${database}'] created with version (${newVersion})`);
        for (let table in tables) {
          this.createTable(table, tables[table].schema);
        }
      }

      // TODO: database was dropped somewhere while still opening
      else if (newVersion > 0 && newVersion === 0) {
        console.warn(`Current opening database '${database}' was dropped`);
      }

      // TODO: schema changed
      else if (oldVersion > 0 && newVersion > 0) {
        console.log(`Database['${database}'] was upgraded`);
      }

      this.version = newVersion;
    };

    this._connection.onerror = (ev) => {
      const { error } = ev.target as IDBOpenDBRequest;
      const { name, message } = error;
      throw Error(
        `Local database '${database}' opening failed!`
        + `\n- ${name}: ${message}`
      );
    };

    this._connection.onblocked = (ev) => {
      const { newVersion, oldVersion } = ev as IDBVersionChangeEvent;
      throw Error(
        `Database['${database}'] is opening somewhere with version (${oldVersion}), `
        + `thus new opening request to version (${newVersion}) is failed.`
      );
    };
  }
}
