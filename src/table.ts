import {
  GoDBClass,
  GoDBData,
  GoDBInputData,
  GoDBTableSchema,
  GoDBTableSearch,
  TableFindFunction
} from './interface/types';

// TODO: GLOBAL ERROR HANDLER
// TODO: optimizing for duplicated codes, make a global promise to handle error
// TODO: make sure that schema is sync with objectStore
export default class GoDBTable {

  name: string;
  godb: GoDBClass;
  schema: GoDBTableSchema | null;

  constructor(godb: GoDBClass, name: string, schema?: GoDBTableSchema) {

    this.godb = godb;
    this.name = name;

    this.schema = schema || null;

  }

  // TODO: check if criteria's key fits schema
  get(criteria: GoDBTableSearch | number): Promise<GoDBData> {
    return new Promise((resolve, reject) => {
      this.godb.getDB((idb) => {
        try {
          const store = idb
            .transaction(this.name, 'readonly')
            .objectStore(this.name);

          // if the key is not unique, return one object with least id
          // TODO: warning user if the key is not unique

          const onSuccess = (e: Event) => {
            const { result } = e.target as IDBRequest;
            resolve(result);
          }

          const onError = (e: Event) => {
            const { error } = e.target as IDBRequest;
            reject(error);
          }

          if (typeof criteria === 'object') {
            const key = Object.keys(criteria)[0];
            const value = criteria[key];

            const request = key === 'id'
              ? store.get(value)
              : store.index(key).get(value);

            request.onsuccess = onSuccess;
            request.onerror = onError;

          } else if (typeof criteria === 'number') {
            const request = store.get(criteria);

            request.onsuccess = onSuccess;
            request.onerror = onError;

          } else {
            reject(new Error('Table.get() failed: invalid criteria'));
          }

        } catch (err) {
          reject(err);
        }
      });
    });
  }

  getAll(limit?: number): Promise<GoDBData[]> {
    return new Promise((resolve, reject) => {
      this.godb.getDB((idb) => {
        try {
          const store = idb
            .transaction(this.name, 'readonly')
            .objectStore(this.name);

          const request = limit
            ? store.getAll(null, limit)
            : store.getAll();

          request.onsuccess = (e) => {
            const { result } = e.target as IDBRequest;
            resolve(result);
          };

          request.onerror = (e) => {
            const { error } = e.target as IDBRequest;
            reject(error);
          };

        } catch (err) {
          reject(err);
        }
      });
    });
  }

  // TODO: check data's schema
  // resolve: id of added item
  add(data: GoDBInputData): Promise<GoDBData> {
    return new Promise((resolve, reject) => {
      this.godb.getDB((idb) => {
        try {
          const store = idb
            .transaction(this.name, 'readwrite')
            .objectStore(this.name);

          const request = store.add(data);

          // TODO: according to MDN, `onsuccess` does not exactly mean a successful adding
          request.onsuccess = (e) => {
            const { result } = e.target as IDBRequest;
            resolve({
              ...data,
              id: result
            });
          };

          request.onerror = (e) => {
            const { error } = e.target as IDBRequest;
            reject(error);
          };

        } catch (err) {
          reject(err);
        }
      });
    });
  }

  // TODO FIX: the order might be unexpected when
  //  `addMany` and `add` were executing at the same time
  addMany(data: GoDBInputData[]): Promise<GoDBData[]> {
    return new Promise(async (resolve, reject) => {
      if (Array.isArray(data)) {
        const arr: GoDBData[] = [];
        for (let item of data) {
          arr.push(await this.add(item));
        }
        resolve(arr);
      } else {
        reject(new Error('Table.addMany() failed: input data should be an array'));
      }
    });
  }

  // TODO: check data's schema
  // if data is not in table, `put` will add the data, otherwise update
  // TODO: check schema's unique key, which decides whether update or add data
  // resolve: id of updated item
  put(data: GoDBData): Promise<GoDBData> {
    return new Promise((resolve, reject) => {
      this.godb.getDB((idb) => {
        if (!(data && typeof data === 'object'))
          return reject(new Error('Table.put() failed: data should be an object'));
        if (!data.id)
          return reject(new Error('Table.put() failed: id is required in data'));
        try {
          const store = idb
            .transaction(this.name, 'readwrite')
            .objectStore(this.name);

          // equals to `add(data)` if `data` is not in table
          const request = store.put(data);

          // TODO: according to MDN, `onsuccess` does not exactly mean a successful adding
          request.onsuccess = (e) => {
            const { result } = e.target as IDBRequest;
            resolve({
              ...data,
              id: result
            });
          };

          request.onerror = (e) => {
            const { error } = e.target as IDBRequest;
            reject(error);
          };
        } catch (err) {
          reject(err);
        }
      });
    });
  }

  // update only, be ware of the difference to `put`
  update() {

  }

  delete(criteria: GoDBTableSearch | number): Promise<void> {
    return new Promise((resolve, reject) => {
      this.godb.getDB((idb) => {
        try {
          this.get(criteria).then(doc => {
            const store = idb
              .transaction(this.name, 'readwrite')
              .objectStore(this.name);

            const request = store.delete(doc.id);

            request.onsuccess = () => {
              resolve();
            };

            request.onerror = (e) => {
              const { error } = e.target as IDBRequest;
              reject(error);
            };
          });
        } catch (err) {
          reject(err);
        }
      });
    });
  }

  // find by a function
  find(fn: TableFindFunction): Promise<GoDBData | null> {
    return new Promise((resolve, reject) => {
      this.godb.getDB((idb) => {
        try {
          const store = idb
            .transaction(this.name, 'readonly')
            .objectStore(this.name);

          store.openCursor().onsuccess = (e) => {
            const cursor = (e.target as IDBRequest).result;
            if (cursor) {
              if (fn(cursor.value))
                return resolve(cursor.value);
              cursor.continue();
            } else {
              resolve(null);
            }
          }
        } catch (err) {
          reject(err);
        }
      });
    });
  }

  // return all results by a find function
  findAll(find: TableFindFunction): Promise<GoDBData[]> {
    return new Promise((resolve, reject) => {
      this.godb.getDB((idb) => {
        try {
          const store = idb
            .transaction(this.name, 'readonly')
            .objectStore(this.name);

          const data: GoDBData[] = [];

          store.openCursor().onsuccess = (e) => {
            const cursor = (e.target as IDBRequest).result;
            if (cursor) {
              if (find(cursor.value)) {
                data.push(cursor.value);
              }
              cursor.continue();
            } else {
              resolve(data);
            }
          }
        } catch (err) {
          reject(err);
        }
      });
    });
  }

  // TODO: people.where('age').below(22).toArray()
  where() {

  }

  // showing 1000 items maximum in Chrome and Firefox
  consoleTable(limit: number = 1000): Promise<void> {
    return new Promise((resolve, reject) => {
      this.godb.getDB((idb) => {
        try {
          if (limit > 1000) {
            console.warn(`Table.consoleTable() expects a limit no more than 1000`);
            limit = 1000;
          }

          let count = 0;
          const data = {};

          const store = idb
            .transaction(this.name, 'readonly')
            .objectStore(this.name);

          store.openCursor().onsuccess = (e) => {
            const cursor = (e.target as IDBRequest).result;
            if (cursor && count < limit) {
              count += 1;
              data[cursor.key] = { ...cursor.value };
              delete data[cursor.key].id;
              cursor.continue();
            } else {
              console.log(`Data in Table['${this.name}'] of Database['${this.godb.name}'], limit ${limit}:`);
              console.table(data);
              resolve();
            }
          }
        } catch (err) {
          reject(err);
        }
      });
    });
  }
}
