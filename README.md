English | [中文文档](docs/README-zh.md)
# GoDB.js

IndexedDB with Intuitive API, CRUD with one line of code.
![godb-logo](https://cdn.liqi.tech/godb/godb.png)



**Warining**: this project is currently in Alpha status, which means:

- The software is not stable enough for production
- Some APIs might have breaking changes in the future.



TODO：

- [x] Table creating after db is connected
- [x] If database or table is existed, check the db structure when init
    - [x] update db structure when it is not matching with schema
- [x] Make sure `schema` is matching with database structure
- [x] Creating table from exisiting objectStore when table is not defined in schema
- [ ] A universal `Table.do()` for code simplify, and open IndexedDB objectStore operations to user
- [ ] Global error handler for Exceptions
- [ ] Key-Value mode, like localStorage
- [ ] `Table.update()`
- [ ] Check `schema` in CRUD operation if `schema` is defined
    - [ ] only adding fields that were defined in `schema`


Star this project if you think it is helpful, thanks~


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

You can use schema to define the database structure (optional)

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

const testDB = new GoDB('testDB', { schema }); // { schema: schema }
const user = testDB.table('user');

const data = { name: 'luke', age: 22 };

user.add(data) // OK
  .then(() => user.get({ name: 'luke' })) // index as search criteria
  .then(luke => user.add(luke)); // ERROR, since the name should be unique
```

When schema is defined, you can use the defined indexes as search criteria in the
`Table.get()` method.

It is faster than `Table.find()`, especially when the table has huge amounts of data

The design of schema is inspired by `Mongoose`

If `schema` is defined, `GoDB` will check the data structure in operations like `Table.add()`: if the data structure does not fit in schema, report an error.

In short, `GoDB` will behave like MongoDB when the
`schema` was not provided, but like MySQL if `schema` was defined.

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
