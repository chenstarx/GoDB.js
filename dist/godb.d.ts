declare type PrimitiveType = number | string | boolean | null;
declare type DataType = PrimitiveType | object;
declare type Godb = Godb$1;
interface GodbData {
    id: number;
    [key: string]: DataType | Array<DataType>;
}
interface GodbInputData {
    [key: string]: DataType | Array<DataType>;
}
interface GodbTableSearch {
    [key: string]: number | string;
}
declare type GetDBCallback = (idb: IDBDatabase) => void;
declare type TableFindFunction = (item?: GodbData) => boolean;
declare type TableKeyTypes = NumberConstructor | StringConstructor | BooleanConstructor | DateConstructor | ObjectConstructor | ArrayConstructor;
interface TableKey {
    type: TableKeyTypes;
    unique?: boolean;
    default?: any;
    ref?: string;
}
interface GodbTableSchema {
    [key: string]: TableKey | TableKeyTypes;
}
interface GodbSchema {
    [table: string]: GodbTableSchema;
}
interface GodbTableDict {
    [table: string]: GodbTable;
}

declare class GodbTable {
    name: string;
    godb: Godb;
    schema: GodbTableSchema;
    constructor(godb: Godb, name: string, schema: GodbTableSchema);
    get(criteria: GodbTableSearch | number): Promise<GodbData>;
    add(data: GodbInputData): Promise<number>;
    addMany(data: Array<GodbInputData>): Promise<Array<number>>;
    put(data: GodbData): Promise<number>;
    update(): void;
    delete(criteria: GodbTableSearch): Promise<void>;
    find(fn: TableFindFunction): Promise<GodbData>;
    where(): void;
    consoleTable(limit?: number): Promise<void>;
}

declare class Godb$1 {
    name: string;
    idb: IDBDatabase;
    tables: GodbTableDict;
    private _closed;
    private _connection;
    private _callbackQueue;
    onOpened: Function;
    onClosed: Function;
    constructor(name: string, schema?: GodbSchema);
    table(table: string, tableSchema?: GodbTableSchema): GodbTable;
    init(schema: GodbSchema): void;
    close(): void;
    drop(): Promise<Event>;
    backup(): void;
    getDBState(): string;
    createTable(table: string, schema: GodbTableSchema): void;
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
     * Where: Table operations that are in the same macrotask as `new Godb()`
     *
     * State `opened`: The database is opened
     * Operation: Invoking the callback synchronously with `this.idb`
     * Where: Table operations when the db is opened,
     *  mention that the db's opening only takes a few milliseconds,
     *  and normally most of user's table operations will happen after db's opening
     *
     * Attention: callback is async in state 1 and 2,
     * but being sync in state 3
     */
    getDB(callback?: GetDBCallback): void;
}

export default Godb$1;
