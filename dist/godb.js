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
var GodbTable = /** @class */ (function () {
    function GodbTable(godb, name, schema) {
        this.godb = godb;
        this.name = name;
        this.schema = schema ? __assign({ id: Number }, schema) : {};
    }
    // TODO: check if criteria's key fits schema
    GodbTable.prototype.get = function (criteria) {
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
    // TODO: check data's schema
    // resolve: id of added item
    GodbTable.prototype.add = function (data) {
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
    // TODO FIX: the order might be unexpected when
    //  `addMany` and `add` were executing at the same time
    GodbTable.prototype.addMany = function (data) {
        var _this = this;
        return new Promise(function (resolve, reject) { return __awaiter(_this, void 0, void 0, function () {
            var id, _i, data_1, item, _a, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        if (!Array.isArray(data)) return [3 /*break*/, 5];
                        id = [];
                        _i = 0, data_1 = data;
                        _c.label = 1;
                    case 1:
                        if (!(_i < data_1.length)) return [3 /*break*/, 4];
                        item = data_1[_i];
                        _b = (_a = id).push;
                        return [4 /*yield*/, this.add(item)];
                    case 2:
                        _b.apply(_a, [_c.sent()]);
                        _c.label = 3;
                    case 3:
                        _i++;
                        return [3 /*break*/, 1];
                    case 4:
                        resolve(id);
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
    GodbTable.prototype.put = function (data) {
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
    // update only, be ware of the difference to `put`
    GodbTable.prototype.update = function () {
    };
    GodbTable.prototype["delete"] = function (criteria) {
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
    GodbTable.prototype.find = function (fn) {
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
    // TODO: people.where('age').below(22).toArray()
    GodbTable.prototype.where = function () {
    };
    // showing 1000 items maximum in Chrome and Firefox
    GodbTable.prototype.consoleTable = function (limit) {
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
                    var data_2 = {};
                    var store = idb
                        .transaction(_this.name, 'readonly')
                        .objectStore(_this.name);
                    store.openCursor().onsuccess = function (e) {
                        var cursor = e.target.result;
                        if (cursor && count_1 < limit) {
                            count_1 += 1;
                            data_2[cursor.key] = __assign({}, cursor.value);
                            delete data_2[cursor.key].id;
                            cursor["continue"]();
                        }
                        else {
                            console.log("Data in Table['" + _this.name + "'] with limit of " + limit + ":");
                            console.table(data_2);
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
    return GodbTable;
}());

var global = window;
var indexedDB = global.indexedDB ||
    global.webkitIndexedDB ||
    global.mozIndexedDB ||
    global.msIndexedDB;

var Godb = /** @class */ (function () {
    function Godb(name, schema) {
        // init params
        this.tables = {};
        this._callbackQueue = [];
        // save database's name
        this.name = name;
        // init tables
        for (var table in schema)
            this.tables[table] = new GodbTable(this, table, schema[table]);
        // open connection to the IndexedDB
        this.getDB();
    }
    Godb.prototype.table = function (table, tableSchema) {
        if (!this.tables[table]) {
            if (this.idb) ;
            else {
                this.tables[table] = new GodbTable(this, table, tableSchema);
            }
        }
        return this.tables[table];
    };
    // init the database with schema
    // TODO: when db is not empty, clear the db, then change db version to 1
    Godb.prototype.init = function (schema) {
        if (!schema)
            return console.warn('Init failed: schema is not provided');
        if (!this.idb)
            return console.warn('Init failed: database is not opened yet');
    };
    Godb.prototype.close = function () {
        if (this.idb) {
            this.idb.close();
            this.idb = null;
            this._connection = null;
            this._closed = true;
            console.log("Connection to '" + this.idb.name + "' is closed");
        }
        else {
            console.warn('Unable to close: database is not opened');
        }
    };
    // drop a database by its name
    // TODO: make this no-static, close the database before dropping
    Godb.prototype.drop = function () {
        var _this = this;
        return new Promise(function (resolve, reject) {
            _this.close();
            var database = _this.name;
            // no need to handle Exception according to MDN
            var deleteRequest = indexedDB.deleteDatabase(database);
            deleteRequest.onsuccess = function (ev) {
                console.log("Local database '" + database + "' is successfully dropped!");
                if (_this.onClosed) {
                    if (typeof _this.onClosed === 'function')
                        _this.onClosed();
                    else
                        console.warn("'onClosed' should be a function, not " + typeof _this.onClosed);
                }
                resolve(ev);
            };
            deleteRequest.onerror = function (ev) {
                var error = ev.target.error;
                var name = error.name, message = error.message;
                console.warn("Local database '" + database + "' deleting failed!          \n- " + name + ": " + message);
                reject(name + ": " + message);
            };
        });
    };
    // TODO: backup for dangerous operations, like drop() and version change events
    Godb.prototype.backup = function () {
    };
    Godb.prototype.getDBState = function () {
        if (this._closed)
            return 'closed';
        if (this.idb)
            return 'opened';
        if (this._connection)
            return 'connecting';
        return 'init';
    };
    // Require IDBTransaction `versionchange`
    Godb.prototype.createTable = function (table, schema) {
        var idb = this.idb;
        if (!idb)
            return console.error("Create table '" + table + "' failed: database is not opened");
        if (!idb.objectStoreNames.contains(table)) {
            var objectStore = idb.createObjectStore(table, {
                keyPath: 'id',
                autoIncrement: true
            });
            console.log("Table['" + table + "'] created in Database['" + idb.name + "']");
            for (var key in schema) {
                var unique = !!schema[key]['unique'];
                objectStore.createIndex(key, key, { unique: unique });
                console.log("Key['" + key + "'] created in Table['" + table + "'], Database['" + idb.name + "']");
            }
        }
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
    Godb.prototype.getDB = function (callback) {
        var _this = this;
        // return function for corresponding state
        return ({
            // unable `getDB` if db was closed
            closed: function () {
                console.warn('getDB failed: database is closed');
            },
            // State `opened`: db is opened, callback is sync in this case
            opened: function () {
                if (callback && typeof callback === 'function')
                    callback(_this.idb);
            },
            // State `connecting`: connection opened, but db not opened yet
            connecting: function () {
                if (callback && typeof callback === 'function')
                    _this._callbackQueue.push(callback);
            },
            // State `init`: no connection yet
            init: function () {
                // ONLY EXECUTED ONCE IN CONSTRUCTOR
                var database = _this.name;
                var tables = _this.tables;
                _this._connection = indexedDB.open(database);
                _this._connection.onsuccess = function (ev) {
                    var _a;
                    var result = (_this._connection || ev.target).result;
                    // triggered when 'onupgradeneeded' was not called
                    // meaning that the database was already existed in browser
                    if (!_this.idb) {
                        _this.idb = result;
                        console.log("Database['" + database + "'] existed with version (" + result.version + ")");
                    }
                    console.log("Local database '" + database + "' is opened!");
                    // executing operations invoked by user at State 2
                    if ((_a = _this._callbackQueue) === null || _a === void 0 ? void 0 : _a.length) {
                        _this._callbackQueue.forEach(function (fn) { return fn(_this.idb); });
                    }
                    // call onOpened if it is defined by user
                    if (_this.onOpened) {
                        if (typeof _this.onOpened === 'function')
                            _this.onOpened(_this.idb);
                        else
                            console.warn("'onOpened' should be a function, not " + typeof _this.onOpened);
                    }
                    // The code below is actually not necessary,
                    //  cuz it will only be invoked in the constructor,
                    //  and constructor's `getDB` has no callback
                    // if (callback && typeof callback === 'function')
                    //   callback(result);
                };
                // called every time when db version changed
                _this._connection.onupgradeneeded = function (ev) {
                    var oldVersion = ev.oldVersion, newVersion = ev.newVersion, target = ev.target;
                    // get database instance
                    _this.idb = target.result;
                    console.log("Database['" + database + "'] version changed from (" + oldVersion + ") to (" + newVersion + ")");
                    // create a new database
                    if (oldVersion === 0 && newVersion > 0) {
                        console.log("Database['" + database + "'] created with version (" + newVersion + ")");
                        for (var table in tables) {
                            _this.createTable(table, tables[table].schema);
                        }
                    }
                    // TODO: database was dropped somewhere while still opening
                    else if (newVersion > 0 && newVersion === 0) {
                        console.warn("Current opening database '" + database + "' was dropped");
                    }
                    // TODO: schema changed
                    else if (oldVersion > 0 && newVersion > 0) {
                        console.log("Database['" + database + "'] was upgraded");
                    }
                };
                _this._connection.onerror = function (ev) {
                    var error = ev.target.error;
                    var name = error.name, message = error.message;
                    throw Error("Local database '" + database + "' opening failed!            \n- " + name + ": " + message);
                };
                _this._connection.onblocked = function (ev) {
                    var _a = ev, newVersion = _a.newVersion, oldVersion = _a.oldVersion;
                    throw Error("Database['" + database + "'] is opening somewhere with version (" + oldVersion + ")            thus new opening request to version (" + newVersion + ") is failed.");
                };
            }
        }[this.getDBState()])();
    };
    return Godb;
}());

export default Godb;
