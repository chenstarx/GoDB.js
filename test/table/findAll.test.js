function findAllTest(dbName) {
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

  const db = new GoDB(dbName, schema);
  const user = db.table('user');

  crud();

  async function crud() {

    // Create:
    const data = [];

    for (let i = 0; i < 300; i++) {
      data.push({
        name: `luke${i}`,
        age: Math.floor(Math.random() * 100)
      })
    }

    await user.addMany(data);

    await user.consoleTable();

    // Find:
    result = await user.findAll(item => item.name === 'luke');

    console.log(`find result for 'luke': `, result);

    result = await user.findAll(item => item.name === 'luke99');

    console.log(`find result for 'luke99': `, result);

    result = await user.findAll(item => item.age > 50);

    console.log(`find result for age > 50: `, result);

  }
}
