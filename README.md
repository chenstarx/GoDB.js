English | [中文文档](docs/README-zh.md)
# Godb.js

IndexedDB with Intuitive API, CRUD with one line of code.



**Warining**: this project is currently in Alpha status, which means:

- The software is not stable enough for production
- Some APIs might have breaking changes in the future.



TODO：

- [x] `Table.find()`
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

// Create
user.add({
    name: 'luke',
    age: 22
})
  .then(id => user.get(id)) // Read, or user.get({ name: 'luke' })
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
            unique: true
        },
        // Index 'age'
        age: Number
    }
}

const testDB = new Godb('testDB', schema);
const user = testDB.table('user');

const luke1 = {
    name: 'luke'
    age: 22
};

const luke2 = {
    name: 'luke'
    age: 19
};

user.add(luke1) // OK
  .then(() => user.add(luke2)) // ERROR
```

The design of schema is inspired by `Mongoose`

If `schema` is defined, `Godb` will check the data structure in operations like `Table.add()`: if the data structure does not fit in schema, report an error.

In short, `Godb` will behave like MongoDB when the
`schema` was not provided, but like MySQL if `schema` was defined.
