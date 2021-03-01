declare type PrimitiveType = number | string | boolean | null;
declare type GoDBDataType = PrimitiveType | object;
declare type GoDBClass = GoDB;
declare type GoDBTableClass = GoDBTable;
interface GoDBData {
    id: number;
    [key: string]: GoDBDataType | Array<GoDBDataType>;
}
interface GoDBInputData {
    [key: string]: GoDBDataType | Array<GoDBDataType>;
}
interface GoDBTableSearch {
    [key: string]: number | string;
}
declare type GetDBCallback = (idb: IDBDatabase) => void;
declare type TableFindFunction = (item?: GoDBData) => boolean;
declare type TableIndexTypes = NumberConstructor | StringConstructor | BooleanConstructor | DateConstructor | ObjectConstructor | ArrayConstructor;
interface TableIndex {
    type: TableIndexTypes;
    multiEntry?: boolean;
    unique?: boolean;
    default?: any;
    ref?: string;
}
interface GoDBConfig {
    version?: number;
}
interface GoDBTableSchema {
    [key: string]: TableIndex | TableIndexTypes;
}
interface GoDBSchema {
    [table: string]: GoDBTableSchema;
}
interface GoDBTableDict {
    [table: string]: GoDBTableClass;
}

declare class GoDBTable {
    name: string;
    godb: GoDBClass;
    schema: GoDBTableSchema;
    constructor(godb: GoDBClass, name: string, schema?: GoDBTableSchema);
    get(criteria: GoDBTableSearch | number): Promise<GoDBData>;
    getAll(limit?: number): Promise<GoDBData[]>;
    add(data: GoDBInputData): Promise<GoDBData>;
    addMany(data: GoDBInputData[]): Promise<GoDBData[]>;
    put(data: GoDBData): Promise<GoDBData>;
    update(): void;
    delete(criteria: GoDBTableSearch | number): Promise<void>;
    find(fn: TableFindFunction): Promise<GoDBData>;
    findAll(fn: TableFindFunction): Promise<GoDBData[]>;
    where(): void;
    consoleTable(limit?: number): Promise<void>;
}

declare class GoDB {
    name: string;
    version: number;
    idb: IDBDatabase;
    tables: GoDBTableDict;
    private _closed;
    private _connection;
    private _callbackQueue;
    onOpened: Function;
    onClosed: Function;
    constructor(name: string, schema?: GoDBSchema, config?: GoDBConfig);
    table(table: string, tableSchema?: GoDBTableSchema): GoDBTable;
    updateSchema(schema?: GoDBSchema): void;
    close(): void;
    drop(): Promise<Event>;
    getDBState(): string;
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
    getDB(callback?: GetDBCallback): void;
    private _openDB;
    private _shouldUpgrade;
    private _updateObjectStore;
}

export default GoDB;
