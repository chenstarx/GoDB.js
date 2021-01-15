function crudTest(dbName) {
  if (!dbName) return alert('database name required');

  const schema = {
    user: {
      name: {
        type: String,
        unique: true
      },
      age: Number
    }
  };

  const db = new Godb(dbName, schema);

  const user = db.table('user');

  user.add({
    name: 'luke',
    age: 22
  })
    .then(async () => {
      console.log('\n');
      console.log('add user luke:');
      await user.consoleTable();

      console.log('\n');
      console.log('add user elain:');
      await user.add({
        name: 'elain',
        age: 24
      });

      await user.consoleTable();

      console.log('\n');
      console.log('put luke, set luke.age to 23:');
      luke = await user.get({ name: 'luke' });
      luke.age = 23;
      await user.put(luke);

      await user.consoleTable();

      console.log('\n');
      console.log('delete user luke:');
      await user.delete({ name: 'luke' });
      await user.consoleTable();

    })
    .catch(err => console.error(err));
}
