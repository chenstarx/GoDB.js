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

  const db = new Godb(dbName, { schema });
  const user = db.table('user');

  crud();

  async function crud() {

    // Create:
    await user.addMany([
      {
        name: 'luke',
        age: 22
      },
      {
        name: 'elaine',
        age: 23
      }
    ]);

    console.log('add users: luke and elaine');
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
}
