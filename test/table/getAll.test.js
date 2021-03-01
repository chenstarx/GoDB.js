function getAllTest(dbName) {
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

    for (let i = 0; i < 100; i++) {
      data.push({
        name: `luke${i}`,
        age: Math.floor(Math.random() * 100)
      })
    }

    await user.addMany(data);

    await user.consoleTable();

    result = await user.getAll();

    console.log(`getAll result for 'luke': `, result);

    result = await user.getAll(50);

    console.log(`getAll result for 'luke' with limit 50: `, result);

  }
}
