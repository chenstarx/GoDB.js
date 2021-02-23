function findTest(dbName) {
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

    await user.consoleTable(); // show table data in console

    // Find:
    result = await user.find(item => item.name === 'luke12');

    console.log(`find result for 'luke12': `, result);

    result = await user.find(item => item.name === 'luke99');

    console.log(`find result for 'luke99': `, result);

    result = await user.find(item => item.name === 'luke0');

    console.log(`find result for 'luke0': `, result);

    result = await user.find(item => item.name === 'luke');

    console.log(`find result for 'luke': `, result);

    result = await user.find(item => item.age === 22);

    console.log(`find result for age 22: `, result);

    result = await user.find(item => item.age === 55);

    console.log(`find result for age 55: `, result);

    result = await user.find(item => item.age === 12);

    console.log(`find result for age 12: `, result);

  }
}
