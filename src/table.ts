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
  get(criteria: GodbTableSearch): Promise<GodbData> {
    return new Promise((resolve, reject) => {
      this.godb.getDB((idb) => {
        const key = Object.keys(criteria)[0];
        const value = criteria[key];
        try {
          const store = idb
            .transaction(this.name, 'readonly')
            .objectStore(this.name);

          // if the key is not unique, return one object with least id
          // TODO: warning user if the key is not unique
          const request = key === 'id'
            ? store.get(value)
            : store.index(key).get(value);

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
  consoleTable(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.godb.getDB((idb) => {
        try {
          const data = [];
          const store = idb
            .transaction(this.name, 'readonly')
            .objectStore(this.name);

          store.openCursor().onsuccess = (e) => {
            const cursor = (e.target as IDBRequest).result;
            if (cursor) {
              data.push({
                id: cursor.key,
                ...cursor.value
              });
              cursor.continue();
            } else {
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
