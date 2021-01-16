import { Godb, GodbData, GodbInputData, GodbTableSchema, GodbTableSearch } from './global/types';

// TODO: GLOBAL ERROR HANDLER
// TODO: optimizing for duplicated codes, make a global promise to handle error
// TODO: make sure that schema is sync with objectStore
export default class GodbTable {

  name: string;
  godb: Godb;
  schema: GodbTableSchema;

  constructor(godb: Godb, name: string, schema: GodbTableSchema) {

    this.godb = godb;
    this.name = name;

    this.schema = schema ? {
      id: Number,
      ...schema
    } : {};

  }

  // TODO: check if criteria's key fits schema
  get(criteria: GodbTableSearch | number): Promise<GodbData> {
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
            reject(new Error('Table.get failed: invalid criteria'));
          }

        } catch (err) {
          reject(err);
        }
      });
    });
  }

  // TODO: check data's schema
  // resolve: id of added item
  add(data: GodbInputData): Promise<number> {
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
            resolve(result);
          };

          request.onerror = (e) => {
            const { error } = e.target as IDBRequest;
            reject(error);
          };

        } catch (err) {
          console.error(err);
        }
      });
    });
  }

  // TODO: check data's schema
  // if data is not in table, `put` will add the data, otherwise update
  // TODO: check schema's unique key, which decides whether update or add data
  // resolve: id of updated item
  put(data: GodbData): Promise<number> {
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

  // update only, be ware of the difference to `put`
  update() {

  }

  delete(criteria: GodbTableSearch): Promise<void> {
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
  find(fn: Function) {

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
            console.warn(`Table.consoleTable() accepts 'limit' no more than 1000`);
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
              console.log(`Top ${limit} data in Table['${this.name}']:`);
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
