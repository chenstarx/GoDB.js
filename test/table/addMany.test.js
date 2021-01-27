function addManyTest(dbName) {
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

  const data = [];

  const db = new GoDB(dbName, { schema });
  const user = db.table('user');

  for(let i = 0; i < 10000; i++) {
    data.push({
      name: `user${i}`,
      age: i % 100
    });
  }

  adding();

  async function adding() {

    console.log('timer started');
    console.time('adding');

    // Create:
    await user.addMany(data);

    console.timeEnd('adding');
    console.log('timer ended');
  }
}
