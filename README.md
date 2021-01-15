# Godb

IndexedDB with Intuitive API, bring a comfortable CRUD experience.


# install

```
npm install godb
```


# Usage

A CRUD example:

``` javascript
import Godb from 'godb';

const schema = {
  user: {
    name: {
      type: String,
      unique: true
    },
    age: Number
  }
};

const db = new Godb('testDB', schema);
const user = db.table('user');

// Create
user.add({
  name: 'elain',
  age: 23
}).then((id) => {
  console.log('\n');
  console.log('elain added with id:', id);
});

crud();

async function crud() {

  // Create:
  await user.add({
    name: 'luke',
    age: 22
  });

  console.log('add user: luke');
  await user.consoleTable(); // show table data in console

  // Read:
  const luke = await user.get({ name: 'luke' });
  // const luke = await user.get({ id: 1 });

  // Update:
  luke.age = 23;
  await user.put(luke);

  console.log('update: set luke.age to 23');
  await user.consoleTable();

  // Delete:
  await user.delete({ name: 'luke' });

  console.log('delete user: luke');
  await user.consoleTable();

}

```

The codes above will generate logs in console:

![crud_test](https://cdn.lukerr.com/docs/godb/crud-test.png)
