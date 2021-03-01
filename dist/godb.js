/*! *****************************************************************************
Copyright (c) Microsoft Corporation.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
***************************************************************************** */

var __assign = function() {
    __assign = Object.assign || function __assign(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};

function __awaiter(thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
}

function __generator(thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
}

// TODO: GLOBAL ERROR HANDLER
// TODO: optimizing for duplicated codes, make a global promise to handle error
// TODO: make sure that schema is sync with objectStore
var GoDBTable = /** @class */ (function () {
    function GoDBTable(godb, name, schema) {
        this.godb = godb;
        this.name = name;
        this.schema = schema || null;
    }
    // crud(operation: GoDBTableCRUD): Promise<void | GoDBData | GoDBData[]> {
    //   return new Promise((resolve, reject) => {
    //     this.godb.getDB((idb) => {
    //       try {
    //       } catch (err) {
    //         reject(err);
    //       }
    //     });
    //   });
    // }
    // TODO: check if criteria's key fits schema
    GoDBTable.prototype.get = function (criteria) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            _this.godb.getDB(function (idb) {
                try {
                    var store = idb
                        .transaction(_this.name, 'readonly')
                        .objectStore(_this.name);
                    // if the key is not unique, return one object with least id
                    // TODO: warning user if the key is not unique
                    var onSuccess = function (e) {
                        var result = e.target.result;
                        resolve(result);
                    };
                    var onError = function (e) {
                        var error = e.target.error;
                        reject(error);
                    };
                    if (typeof criteria === 'object') {
                        var key = Object.keys(criteria)[0];
                        var value = criteria[key];
                        var request = key === 'id'
                            ? store.get(value)
                            : store.index(key).get(value);
                        request.onsuccess = onSuccess;
                        request.onerror = onError;
                    }
                    else if (typeof criteria === 'number') {
                        var request = store.get(criteria);
                        request.onsuccess = onSuccess;
                        request.onerror = onError;
                    }
                    else {
                        reject(new Error('Table.get() failed: invalid criteria'));
                    }
                }
                catch (err) {
                    reject(err);
                }
            });
        });
    };
    GoDBTable.prototype.getAll = function (limit) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            _this.godb.getDB(function (idb) {
                try {
                    var store = idb
                        .transaction(_this.name, 'readonly')
                        .objectStore(_this.name);
                    var request = limit
                        ? store.getAll(null, limit)
                        : store.getAll();
                    request.onsuccess = function (e) {
                        var result = e.target.result;
                        resolve(result);
                    };
                    request.onerror = function (e) {
                        var error = e.target.error;
                        reject(error);
                    };
                }
                catch (err) {
                    reject(err);
                }
            });
        });
    };
    // TODO: check data's schema
    // resolve: id of added item
    GoDBTable.prototype.add = function (data) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            _this.godb.getDB(function (idb) {
                try {
                    var store = idb
                        .transaction(_this.name, 'readwrite')
                        .objectStore(_this.name);
                    var request = store.add(data);
                    // TODO: according to MDN, `onsuccess` does not exactly mean a successful adding
                    request.onsuccess = function (e) {
                        var result = e.target.result;
                        resolve(__assign(__assign({}, data), { id: result }));
                    };
                    request.onerror = function (e) {
                        var error = e.target.error;
                        reject(error);
                    };
                }
                catch (err) {
                    reject(err);
                }
            });
        });
    };
    // TODO FIX: the order might be unexpected when
    //  `addMany` and `add` were executing at the same time
    GoDBTable.prototype.addMany = function (data) {
        var _this = this;
        return new Promise(function (resolve, reject) { return __awaiter(_this, void 0, void 0, function () {
            var arr, _i, data_1, item, _a, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        if (!Array.isArray(data)) return [3 /*break*/, 5];
                        arr = [];
                        _i = 0, data_1 = data;
                        _c.label = 1;
                    case 1:
                        if (!(_i < data_1.length)) return [3 /*break*/, 4];
                        item = data_1[_i];
                        _b = (_a = arr).push;
                        return [4 /*yield*/, this.add(item)];
                    case 2:
                        _b.apply(_a, [_c.sent()]);
                        _c.label = 3;
                    case 3:
                        _i++;
                        return [3 /*break*/, 1];
                    case 4:
                        resolve(arr);
                        return [3 /*break*/, 6];
                    case 5:
                        reject(new Error('Table.addMany() failed: input data should be an array'));
                        _c.label = 6;
                    case 6: return [2 /*return*/];
                }
            });
        }); });
    };
    // TODO: check data's schema
    // if data is not in table, `put` will add the data, otherwise update
    // TODO: check schema's unique key, which decides whether update or add data
    // resolve: id of updated item
    GoDBTable.prototype.put = function (data) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            _this.godb.getDB(function (idb) {
                if (!(data && typeof data === 'object'))
                    return reject(new Error('Table.put() failed: data should be an object'));
                if (!data.id)
                    return reject(new Error('Table.put() failed: id is required in data'));
                try {
                    var store = idb
                        .transaction(_this.name, 'readwrite')
                        .objectStore(_this.name);
                    // equals to `add(data)` if `data` is not in table
                    var request = store.put(data);
                    // TODO: according to MDN, `onsuccess` does not exactly mean a successful adding
                    request.onsuccess = function (e) {
                        var result = e.target.result;
                        resolve(__assign(__assign({}, data), { id: result }));
                    };
                    request.onerror = function (e) {
                        var error = e.target.error;
                        reject(error);
                    };
                }
                catch (err) {
                    reject(err);
                }
            });
        });
    };
    // update only, be ware of the difference to `put`
    GoDBTable.prototype.update = function () {
    };
    GoDBTable.prototype["delete"] = function (criteria) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            _this.godb.getDB(function (idb) {
                try {
                    _this.get(criteria).then(function (doc) {
                        var store = idb
                            .transaction(_this.name, 'readwrite')
                            .objectStore(_this.name);
                        var request = store["delete"](doc.id);
                        request.onsuccess = function () {
                            resolve();
                        };
                        request.onerror = function (e) {
                            var error = e.target.error;
                            reject(error);
                        };
                    });
                }
                catch (err) {
                    reject(err);
                }
            });
        });
    };
    // find by a function
    GoDBTable.prototype.find = function (fn) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            _this.godb.getDB(function (idb) {
                try {
                    var store = idb
                        .transaction(_this.name, 'readonly')
                        .objectStore(_this.name);
                    store.openCursor().onsuccess = function (e) {
                        var cursor = e.target.result;
                        if (cursor) {
                            if (fn(cursor.value))
                                return resolve(cursor.value);
                            cursor["continue"]();
                        }
                        else {
                            resolve(null);
                        }
                    };
                }
                catch (err) {
                    reject(err);
                }
            });
        });
    };
    // return all results by a find function
    GoDBTable.prototype.findAll = function (fn) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            _this.godb.getDB(function (idb) {
                try {
                    var store = idb
                        .transaction(_this.name, 'readonly')
                        .objectStore(_this.name);
                    var data_2 = [];
                    store.openCursor().onsuccess = function (e) {
                        var cursor = e.target.result;
                        if (cursor) {
                            if (fn(cursor.value))
                                data_2.push(cursor.value);
                            cursor["continue"]();
                        }
                        else {
                            resolve(data_2);
                        }
                    };
                }
                catch (err) {
                    reject(err);
                }
            });
        });
    };
    // TODO: people.where('age').below(22).toArray()
    GoDBTable.prototype.where = function () {
    };
    // showing 1000 items maximum in Chrome and Firefox
    GoDBTable.prototype.consoleTable = function (limit) {
        var _this = this;
        if (limit === void 0) { limit = 1000; }
        return new Promise(function (resolve, reject) {
            _this.godb.getDB(function (idb) {
                try {
                    if (limit > 1000) {
                        console.warn("Table.consoleTable() expects a limit no more than 1000");
                        limit = 1000;
                    }
                    var count_1 = 0;
                    var data_3 = {};
                    var store = idb
                        .transaction(_this.name, 'readonly')
                        .objectStore(_this.name);
                    store.openCursor().onsuccess = function (e) {
                        var cursor = e.target.result;
                        if (cursor && count_1 < limit) {
                            count_1 += 1;
                            data_3[cursor.key] = __assign({}, cursor.value);
                            delete data_3[cursor.key].id;
                            cursor["continue"]();
                        }
                        else {
                            console.log("Data in Table['" + _this.name + "'] of Database['" + _this.godb.name + "'], limit " + limit + ":");
                            console.table(data_3);
                            resolve();
                        }
                    };
                }
                catch (err) {
                    reject(err);
                }
            });
        });
    };
    return GoDBTable;
}());

var global = window;
var indexedDB = global.indexedDB ||
    global.webkitIndexedDB ||
    global.mozIndexedDB ||
    global.msIndexedDB;

var GoDB = /** @class */ (function () {
    function GoDB(name, schema, config) {
        // init params
        this.version = 0;
        this.tables = {};
        this._callbackQueue = [];
        // save database's name
        this.name = name;
        // settings
        if (config) {
            var version = config.version;
            if (version)
                this.version = version;
        }
        // init tables, `this.idb` is null when init
        this.updateSchema(schema);
        // open connection to the IndexedDB
        this.getDB();
    }
    GoDB.prototype.table = function (table, tableSchema) {
        if (!this.tables[table]) {
            this.tables[table] = new GoDBTable(this, table, tableSchema);
            this.updateSchema();
        }
        else if (tableSchema) {
            this.tables[table] = new GoDBTable(this, table, tableSchema);
            if (this._shouldUpgrade())
                this.updateSchema();
        }
        return this.tables[table];
    };
    GoDB.prototype.updateSchema = function (schema) {
        if (schema) {
            this.tables = {};
            for (var table in schema)
                this.tables[table] = new GoDBTable(this, table, schema[table]);
        }
        if (this.idb) {
            // create new objectStores when database is already opened
            console.log("Updating Schema of Database['" + this.name + "']");
            this.idb.close();
            // activate callbackQueue in getDB()
            // and avoid repeating calling _openDB() before db's opening
            this.idb = null;
            // triger `onupgradeneeded` event in _openDB() to update objectStores
            this._openDB(++this.version, true);
        }
    };
    GoDB.prototype.close = function () {
        if (this.idb) {
            this.idb.close();
            this.idb = null;
            this._connection = null;
            this._closed = true;
            console.log("A connection to Database['" + this.name + "'] is closed");
        }
        else {
            console.warn("Unable to close Database['" + this.name + "']: it is not opened yet");
        }
    };
    // drop a database
    GoDB.prototype.drop = function () {
        var _this = this;
        return new Promise(function (resolve, reject) {
            var database = _this.name;
            _this.close();
            // no need to handle Exception according to MDN
            var deleteRequest = indexedDB.deleteDatabase(database);
            deleteRequest.onsuccess = function (ev) {
                _this.version = 0;
                console.log("Database['" + database + "'] is successfully dropped");
                if (_this.onClosed) {
                    if (typeof _this.onClosed === 'function')
                        _this.onClosed();
                    else
                        console.warn("'onClosed' should be a function, not " + typeof _this.onClosed);
                    _this.onClosed = null;
                }
                resolve(ev);
            };
            deleteRequest.onerror = function (ev) {
                var error = ev.target.error;
                var name = error.name, message = error.message;
                console.warn("Unable to drop Database['" + database + "']          \n- " + name + ": " + message);
                reject(name + ": " + message);
            };
        });
    };
    GoDB.prototype.getDBState = function () {
        if (this._closed)
            return 'closed';
        if (this.idb)
            return 'opened';
        if (this._connection)
            return 'connecting';
        return 'init';
    };
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
    GoDB.prototype.getDB = function (callback) {
        // State `opened`: db is opened, calling callback synchronously with IDBDatabase instance
        if (this.idb) {
            if (callback && typeof callback === 'function')
                callback(this.idb);
            return;
        }
        // State `closed`: db is closed
        if (this._closed) {
            console.warn("Database['" + this.name + "'] is closed, operations will not be executed");
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
    };
    GoDB.prototype._openDB = function (version, stopUpgrade) {
        var _this = this;
        var database = this.name;
        var tables = this.tables;
        this._connection = version
            ? indexedDB.open(database, version)
            : indexedDB.open(database);
        this._connection.onsuccess = function (ev) {
            var result = _this._connection.result
                || ev.target.result;
            _this.version = result.version;
            // triggered when 'onupgradeneeded' was not called
            // meaning that the database was already existed in browser
            if (!_this.idb) {
                _this.idb = result;
                console.log("Database['" + database + "'] with version (" + result.version + ") is exisiting");
            }
            // @ts-ignore
            for (var _i = 0, _a = _this.idb.objectStoreNames; _i < _a.length; _i++) {
                var name_1 = _a[_i];
                if (!_this.tables[name_1])
                    _this.tables[name_1] = new GoDBTable(_this, name_1);
            }
            // `stopUpgrade` is used to avoid infinite recursion
            if (_this._shouldUpgrade() && !stopUpgrade) {
                // make sure the objectStores structure are matching with the Schema
                _this.updateSchema();
            }
            else {
                console.log("A connection to Database['" + database + "'] is opening");
                // executing Table operations invoked by user at State `connecting`
                if (_this._callbackQueue.length) {
                    _this._callbackQueue.forEach(function (fn) { return fn(_this.idb); });
                    _this._callbackQueue = [];
                }
                // call onOpened if it is defined by user
                if (_this.onOpened) {
                    if (typeof _this.onOpened === 'function')
                        _this.onOpened(_this.idb);
                    else
                        console.warn("'onOpened' should be a function, not " + typeof _this.onOpened);
                    _this.onOpened = null;
                }
            }
        };
        // called when db version is changing
        // it is called before `onsuccess`
        this._connection.onupgradeneeded = function (ev) {
            var oldVersion = ev.oldVersion, newVersion = ev.newVersion, target = ev.target;
            var transaction = target.transaction;
            // get IndexedDB database instance
            _this.idb = target.result;
            _this.version = newVersion;
            if (oldVersion === 0)
                console.log("Creating Database['" + database + "'] with version (" + newVersion + ")");
            // make sure the IDB objectStores structure are matching with GoDB Tables' Schema
            for (var table in tables)
                _this._updateObjectStore(table, tables[table].schema, transaction);
            if (oldVersion !== 0)
                console.log("Database['" + database + "'] version changed from (" + oldVersion + ") to (" + newVersion + ")");
        };
        this._connection.onerror = function (ev) {
            var error = ev.target.error;
            var name = error.name, message = error.message;
            throw Error("Failed to open Database['" + database + "']"
                + ("\n- " + name + ": " + message));
        };
        this._connection.onblocked = function (ev) {
            var _a = ev, newVersion = _a.newVersion, oldVersion = _a.oldVersion;
            console.warn("Database['" + database + "'] is opening somewhere with version (" + oldVersion + "),", "thus new opening request to version (" + newVersion + ") was blocked.");
        };
    };
    // check if it is needed to update the objectStores in a existing database
    // return true when objectStores structure are not matching with the schema
    //  - objectStore (table) is not existing
    //  - table schema has one or more index that objectStore do not have
    //  - index properties are different from which defined in schema
    GoDB.prototype._shouldUpgrade = function () {
        var idb = this.idb;
        if (!idb)
            return false;
        var tables = this.tables;
        for (var table in tables) {
            // check if objectStores is existing
            if (idb.objectStoreNames.contains(table)) {
                var transaction = idb.transaction(table, 'readonly');
                var _a = transaction.objectStore(table), indexNames = _a.indexNames, keyPath = _a.keyPath, autoIncrement = _a.autoIncrement;
                // if the keyPath is not 'id', or it is not autoIncrement
                if (keyPath !== 'id' || !autoIncrement) {
                    this.close();
                    throw Error("The current existing objectStore '" + table + "' in IndexedDB '" + this.name + "'"
                        + (" has a " + (autoIncrement ? '' : 'non-') + "autoIncrement keyPath `" + keyPath + "`,")
                        + " while GoDB requires an autoIncrement keyPath `id`,"
                        + (" thus GoDB can not open Database['" + this.name + "']"));
                }
                for (var index in tables[table].schema) {
                    // check if the objectStore has the index
                    if (indexNames.contains(index)) ;
                    else {
                        // closing the transaction to avoid db's `blocked` event when upgrading
                        transaction.abort();
                        return true;
                    }
                }
                transaction.abort();
            }
            else {
                return true;
            }
        }
        return false;
    };
    // applying the schema to corresponding IndexedDB objectStores to setup indexes
    // require IDBTransaction `versionchange`
    // it can only be called in `onupgradeneeded`
    GoDB.prototype._updateObjectStore = function (table, schema, transaction) {
        var idb = this.idb;
        if (!idb)
            return;
        var putIndex = function (index, store, update) {
            if (index === 'id')
                return;
            if (update)
                store.deleteIndex(index);
            store.createIndex(index, index, {
                unique: !!schema[index]['unique'],
                multiEntry: !!schema[index]['multiEntry']
            });
            console.log((update ? 'Updating' : 'Creating') + " Index['" + index + "']", "in Table['" + table + "'], Database['" + idb.name + "']");
        };
        if (idb.objectStoreNames.contains(table)) {
            // objectStore is existing, update its indexes
            var store = transaction.objectStore(table);
            var indexNames = store.indexNames;
            // if the objectStore contains an index, update the index
            // if not, create a new index in the objectStore
            for (var index in this.tables[table].schema)
                putIndex(index, store, indexNames.contains(index));
        }
        else {
            // create objectStore if not exist
            var store = idb.createObjectStore(table, {
                keyPath: 'id',
                autoIncrement: true
            });
            console.log("Creating Table['" + table + "'] in Database['" + idb.name + "']");
            for (var index in schema)
                putIndex(index, store);
        }
    };
    return GoDB;
}());

export default GoDB;
