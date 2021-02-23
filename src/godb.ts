import GoDBTable from './table';
import { indexedDB } from './global/window';
import {
  GoDBConfig,
  GoDBTableSchema,
  GoDBTableDict,
  GetDBCallback,
  GoDBSchema
} from './global/types';

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

  constructor(name: string, schema?: GoDBSchema, config?: GoDBConfig) {

    // init params
    this.version = 0;
    this.tables = {};
    this._callbackQueue = [];

    // save database's name
    this.name = name;

    // settings
    if (config) {

      const { version } = config;

      if (version) this.version = version;

    }

    // init tables, `this.idb` is null when init
    this.updateSchema(schema);

    // open connection to the IndexedDB
    this.getDB();
  }

  table(table: string, tableSchema?: GoDBTableSchema): GoDBTable {
    if (!this.tables[table]) {
      this.tables[table] = new GoDBTable(this, table, tableSchema);
      this.updateSchema();
    } else if (tableSchema)  {
      this.tables[table] = new GoDBTable(this, table, tableSchema);
      if (this._shouldUpgrade()) this.updateSchema();
    }
    return this.tables[table];
  }

  updateSchema(schema?: GoDBSchema): void {
    if (schema) {
      this.tables = {};
      for (let table in schema)
        this.tables[table] = new GoDBTable(this, table, schema[table]);
    }
    if (this.idb) {
      // create new objectStores when database is already opened
      console.log(`Updating Schema of Database['${this.name}']`);
      this.idb.close();
      // activate callbackQueue in getDB()
      // and avoid repeating calling _openDB() before db's opening
      this.idb = null;
      // triger `onupgradeneeded` event in _openDB() to update objectStores
      this._openDB(++this.version, true);
    }
  }

  close(): void {
    if (this.idb) {
      this.idb.close();
      this.idb = null;
      this._connection = null;
      this._closed = true;
      console.log(`A connection to Database['${this.name}'] is closed`);
    } else {
      console.warn(`Unable to close Database['${this.name}']: it is not opened yet`);
    }
  }

  // drop a database
  drop(): Promise<Event> {
    return new Promise((resolve, reject) => {

      const database = this.name;

      this.close();

      // no need to handle Exception according to MDN
      const deleteRequest = indexedDB.deleteDatabase(database);

      deleteRequest.onsuccess = (ev) => {

        this.version = 0;
        console.log(`Database['${database}'] is successfully dropped`);

        if (this.onClosed) {

          if (typeof this.onClosed === 'function')
            this.onClosed();
          else
            console.warn(`'onClosed' should be a function, not ${typeof this.onClosed}`);

          this.onClosed = null;
        }
        resolve(ev);
      };

      deleteRequest.onerror = (ev) => {
        const { error } = ev.target as IDBOpenDBRequest;
        const { name, message } = error;
        console.warn(
          `Unable to drop Database['${database}']\
          \n- ${name}: ${message}`
        );
        reject(`${name}: ${message}`);
      };
    });
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
      console.warn(`Database['${this.name}'] is closed, operations will not be executed`);
      return;
    }

    // State `connecting`: connection is opened, but db is not opened yet
    if (this._connection) {
      if (callback && typeof callback === 'function')
        this._callbackQueue.push(callback);
      return;
    }

    // State `init`: opening connection to IndexedDB
    // In case user has set a version in GoDBConfig
    if (this.version)
      this._openDB(this.version);
    else
      this._openDB();
  }

  private _openDB(version?: number, stopUpgrade?: boolean): void {

    const database = this.name;
    const tables = this.tables;

    this._connection = version
      ? indexedDB.open(database, version)
      : indexedDB.open(database);

    this._connection.onsuccess = (ev) => {

      const result = this._connection.result
        || (ev.target as IDBOpenDBRequest).result;

      this.version = result.version;

      // triggered when 'onupgradeneeded' was not called
      // meaning that the database was already existed in browser
      if (!this.idb) {
        this.idb = result;
        console.log(`Database['${database}'] with version (${result.version}) is exisiting`);
      }

      // @ts-ignore
      for (let name of this.idb.objectStoreNames) {
        if (!this.tables[name])
          this.tables[name] = new GoDBTable(this, name);
      }

      // `stopUpgrade` is used to avoid infinite recursion
      if (this._shouldUpgrade() && !stopUpgrade) {
        // make sure the objectStores structure are matching with the Schema
        this.updateSchema();

      } else {

        console.log(`A connection to Database['${database}'] is opening`);

        // executing Table operations invoked by user at State `connecting`
        if (this._callbackQueue.length) {
          this._callbackQueue.forEach(fn => fn(this.idb));
          this._callbackQueue = [];
        }

        // call onOpened if it is defined by user
        if (this.onOpened) {

          if (typeof this.onOpened === 'function')
            this.onOpened(this.idb);
          else
            console.warn(`'onOpened' should be a function, not ${typeof this.onOpened}`);

          this.onOpened = null;
        }
      }
    };

    // called when db version is changing
    // it is called before `onsuccess`
    this._connection.onupgradeneeded = (ev) => {
      const { oldVersion, newVersion, target } = ev;
      const { transaction } = target as IDBOpenDBRequest;

      // get IndexedDB database instance
      this.idb = (target as IDBOpenDBRequest).result;
      this.version = newVersion;

      if (oldVersion === 0)
        console.log(`Creating Database['${database}'] with version (${newVersion})`);

      // make sure the IDB objectStores structure are matching with GoDB Tables' Schema
      for (let table in tables)
        this._updateObjectStore(table, tables[table].schema, transaction);

      if (oldVersion !== 0)
        console.log(`Database['${database}'] version changed from (${oldVersion}) to (${newVersion})`);

    };

    this._connection.onerror = (ev) => {
      const { error } = ev.target as IDBOpenDBRequest;
      const { name, message } = error;
      throw Error(
        `Failed to open Database['${database}']`
        + `\n- ${name}: ${message}`
      );
    };

    this._connection.onblocked = (ev) => {
      const { newVersion, oldVersion } = ev as IDBVersionChangeEvent;
      console.warn(
        `Database['${database}'] is opening somewhere with version (${oldVersion}),`,
        `thus new opening request to version (${newVersion}) was blocked.`
      );
    };
  }

  // check if it is needed to update the objectStores in a existing database
  // return true when objectStores structure are not matching with the schema
  //  - objectStore (table) is not existing
  //  - table schema has one or more index that objectStore do not have
  //  - index properties are different from which defined in schema
  private _shouldUpgrade(): boolean {
    const idb = this.idb;
    if (!idb) return false;
    const tables = this.tables;
    for (let table in tables) {
      // check if objectStores is existing
      if (idb.objectStoreNames.contains(table)) {

        const transaction = idb.transaction(table, 'readonly');
        const { indexNames, keyPath, autoIncrement } = transaction.objectStore(table);

        // if the keyPath is not 'id', or it is not autoIncrement
        if (keyPath !== 'id' || !autoIncrement) {
          this.close();
          throw Error(
            `The current existing objectStore '${table}' in IndexedDB '${this.name}'`
            + ` has a ${autoIncrement ? '' : 'non-'}autoIncrement keyPath \`${keyPath}\`,`
            + ` while GoDB requires an autoIncrement keyPath \`id\`,`
            + ` thus GoDB can not open Database['${this.name}']`
          );
        }

        for (let index in tables[table].schema) {
          // check if the objectStore has the index
          if (indexNames.contains(index)) {
            // TODO: check properties like `unique`
          } else {
            // closing the transaction to avoid db's `blocked` event when upgrading
            transaction.abort();
            return true;
          }
        }
        transaction.abort();

      } else {
        return true;
      }
    }
    return false;
  }

  // applying the schema to corresponding IndexedDB objectStores to setup indexes
  // require IDBTransaction `versionchange`
  // it can only be called in `onupgradeneeded`
  private _updateObjectStore(table: string, schema: GoDBTableSchema, transaction: IDBTransaction): void {

    const idb = this.idb;
    if (!idb) return;

    const putIndex = (index: string, store: IDBObjectStore, update?: boolean) => {

      if (index === 'id') return;
      if (update) store.deleteIndex(index);

      store.createIndex(index, index, {
        unique: !!schema[index]['unique'],
        multiEntry: !!schema[index]['multiEntry']
      });
      console.log(
        `${update ? 'Updating' : 'Creating'} Index['${index}']`,
        `in Table['${table}'], Database['${idb.name}']`
      );
    }

    if (idb.objectStoreNames.contains(table)) {
      // objectStore is existing, update its indexes
      const store = transaction.objectStore(table);
      const { indexNames } = store;

      // if the objectStore contains an index, update the index
      // if not, create a new index in the objectStore
      for (let index in this.tables[table].schema)
        putIndex(index, store, indexNames.contains(index));

    } else {
      // create objectStore if not exist
      const store = idb.createObjectStore(table, {
        keyPath: 'id',
        autoIncrement: true
      });
      console.log(`Creating Table['${table}'] in Database['${idb.name}']`);

      for (let index in schema)
        putIndex(index, store);

    }
  }
}
