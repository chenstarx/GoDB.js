# Godb

IndexedDB with Intuitive API


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

user.add({
  name: 'luke',
  age: 22
})
  .then(async () => {
    console.log('\n');
    console.log('add user luke:');

    // show table in console
    await user.consoleTable();

    console.log('add user elain:');
    await user.add({
      name: 'elain',
      age: 24
    });

    await user.consoleTable();

    console.log('set luke.age to 23:');
    luke = await user.get({ name: 'luke' });
    luke.age = 23;
    await user.put(luke);

    await user.consoleTable();

    console.log('delete user luke:');
    await user.delete({ name: 'luke' });

    await user.consoleTable();

  })
  .catch(err => console.error(err));
```
