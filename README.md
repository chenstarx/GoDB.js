English | [中文文档](docs/README-zh.md)
# Godb.js

IndexedDB with Intuitive API, CRUD with one line of code.



**Warining**: this project is currently in Alpha status, which means:

- The software is not stable enough for production
- Some APIs might have breaking changes in the future.



TODO：

- [ ] `Table.update()`
- [ ] Global error handler for Exceptions
- [ ] Check `schema` in CRUD operation if `schema` is defined
- [ ] Make sure `schema` is sync with database structure


Star this project if you think it is helpful, thanks~


## install

```
npm install godb
```



## Usage

CRUD operations with one line of code:

``` javascript
import Godb from 'godb';

const testDB = new Godb('testDB');
const user = testDB.table('user');

const luke = {
  name: 'luke',
  age: 22
}

user.add(luke) // Create
  .then(id => user.get(id)) // Read
  .then(luke => user.put({ ...luke, age: 23 })) // Update
  .then(id => user.delete(id)); // Delete
```

If you want to add many data at once:
``` javascript
const data = [
    {
        name: 'luke',
        age: 22
    },
    {
        name: 'elaine',
        age: 23
    }
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
    {
        name: 'luke',
        age: 22
    },
    {
        name: 'elaine',
        age: 23
    }
];

user.addMany(data)
  .then(() => {
    user.find(item => {
      return item.age > 22;
    })
      .then(result => console.log(result)); // { name: 'elaine', age: 23 }
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
import Godb from 'godb';

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

const testDB = new Godb('testDB', { schema }); // { schema: schema }
const user = testDB.table('user');

const luke = {
    name: 'luke'
    age: 22
};

user.add(luke) // OK
  .then(() => user.get({ name: 'luke' })) // index as search criteria
  .then(luke1 => user.add(luke1)) // ERROR, since the name should be unique
```

When schema is defined, you can use the indexes as search criteria in the
`Table.get()` method.

It is faster than `Table.find()`, especially when the table has huge amounts of data

The design of schema is inspired by `Mongoose`

If `schema` is defined, `Godb` will check the data structure in operations like `Table.add()`: if the data structure does not fit in schema, report an error.

In short, `Godb` will behave like MongoDB when the
`schema` was not provided, but like MySQL if `schema` was defined.
