English | [中文文档](docs/README-zh.md)
# GoDB.js

IndexedDB with Intuitive API, CRUD with one line of code.


![godb-logo](https://cdn.liqi.tech/godb/godb-full.png)



**Warining**: this project is currently in Beta status, which means:

- Do not use it in any serious project
- The designed features are not fully implemented yet
- The APIs might have breaking changes in the future


**Star this project** if you think it is helpful, thanks~


## install

```
npm install godb
```



## Usage

CRUD operations with one line of code:

``` javascript
import GoDB from 'godb';

const testDB = new GoDB('testDB');
const user = testDB.table('user');

const data = { name: 'luke', age: 22 };

user.add(data) // Create
  .then(luke => user.get(luke.id)) // Read
  .then(luke => user.put({ ...luke, age: 23 })) // Update
  .then(luke => user.delete(luke.id)); // Delete
```

If you want to add many data at once:
``` javascript
const data = [
    { name: 'luke', age: 22 },
    { name: 'elaine', age: 23 }
];

user.addMany(data).then(() => user.consoleTable());
```

The method `user.consoleTable()` will print the `user` table in console:

<img src="https://cdn.lukerr.com/docs/godb/add-many.png" alt="add-many" style="zoom:50%;" />

Mention that the column `(index)` is the `id` of data

Warning: do not call `addMany()` and `add()` at the same time,
or the data order in database will be unexpected,
please call `add()` after `await addMany()`

**Table.find()**

When you want to find some data in a table, you can use `Table.find()`

```javascript
const data = [
    { name: 'luke', age: 22 },
    { name: 'elaine', age: 23 }
];

user.addMany(data)
  .then(() => {
    user.find(item => {
      return item.age > 22;
    })
      .then(result => console.log(result));
      // { name: 'elaine', age: 23 }
  });
```

The usage is very similar to JavaScript's `Array.find()`

This method will use `IDBCursor` to traverse a table, and return the first matched result

If you want to get all the matched results, use `Table.findAll()`

**Table.find() vs Table.get()**

Both `Table.find()` and `Table.get()` can be used to find data in a table.

`Table.get()` uses the indexes to search a table, while `Table.find()` will traverse a table and return the results that match the criteria.

Therefore, `Table.get()` has a better performance, especially when the table is large, but it only accepts the table indexes as search criteria.

`Table.find()` is more flexible, since it accepts a function as search criteria.


## Schema

You can use schema to define the database structure (recommended)

``` javascript
import GoDB from 'godb';

// Define schema
const schema = {
    // Table user：
    user: {
        // Index 'name'
        name: {
            type: String,
            unique: true // no repeat value
        },
        // Index 'age'
        age: Number
    }
}

const testDB = new GoDB('testDB', schema);
const user = testDB.table('user');

const data = { name: 'luke', age: 22 };

user.add(data) // OK
  .then(() => user.get({ name: 'luke' })) // index as search criteria
  .then(luke => user.add(luke)); // ERROR, since the name should be unique
```

When schema is defined, you can use the defined indexes as search criteria in the
`Table.get()` method.

It is faster than `Table.find()`, especially when the table has huge amounts of data,
since it uses Index to find item

The design of schema is inspired by `Mongoose`

**The following design is not implemented yet**

If `schema` is defined, `GoDB` will check the data structure in table operations

- Ignoring fields that are not existed in `schema`
  - Unable to add data of non-existing fields
  - Unable to get data from non-existing fields

### Table Schema

You can also define the schema when creating table:

```javascript
const testDB = new GoDB('testDB');
const user = testDB.table('user', {
    name: {
        type: String,
        unique: true
    },
    age: Number
});
```

Mention that if you create table after db's opening,
GoDB will raise a `versionchange` transaction, and upgrade the db's version, since IndexedDB requires db upgrading to create new objectStores in an opening db

```javascript
const testDB = new GoDB('testDB');

setTimeout(() => {
  // db is already opened after 1000ms
  console.log(testDB.version); // 1

  // creating multiple tables only require upgrade once
  const user = testDB.table('user');
  const user = testDB.table('message');

  setTimeout(() => {
    // another setTimeout to wait for upgrading
    console.log(testDB.version); // 2, upgraded
  }, 1000);

}, 1000);
```

However, if the db are opening somewhere else, the
version change transaction will be blocked by browser

Until all other connections were closed, the db's version will not be upgraded, and the objectStores will not be created


```javascript
const db1 = new GoDB('testDB');
const db2 = new GoDB('testDB');

setTimeout(() => {
  // db is already opened after 1000ms
  console.log(db1.version); // 1

  const user = db1.table('user');

  setTimeout(() => {
    // wait for upgrading
    console.log(db1.version); // 1, blocked!

    db2.close(); // close other connections

    setTimeout(() => {
      // wait for upgrading
      console.log(db1.version); // 2, upgraded

    }, 1000);

  }, 1000);

}, 1000);
```

Therefore, it is **recommended** to define all the schema at the beginning in `new GoDB()`,
where GoDB will create all the objectStores and Indexes at once


# TODOs

- [x] Creating objectStore by upgrading db after db's opening
- [x] If database or table is existed, check the db structure when init
    - [x] update db structure when it is not matching with schema
- [x] Make sure `schema` is matching with database structure
- [x] Creating table from exisiting objectStore when table is not defined in schema
- [ ] A universal `Table.do()` for code simplify, and open IndexedDB objectStore operations to user
- [ ] Global error handler for Exceptions
- [ ] Key-Value mode, like localStorage
- [ ] A better `Table.update()` option to replace `Table.put()`
- [ ] Check `schema` in CRUD operation if `schema` is defined
    - [ ] only adding fields that were defined in `schema`
- [ ] `default` and `ref` property for Index
