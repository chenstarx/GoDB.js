function getDBTest(dbName) {
  if (!dbName) return alert('database name required');

  const testDB = new Godb(dbName);

  testDB.getDB((db) => {
    console.log('Init getDB', db);
  });

  setTimeout(() => {
    testDB.getDB((db) => {
      console.log('settimeout 1000', db);
    });
  }, 1000);

  testDB.getDB((db) => {
    console.log('async getDB 1', db);
  });

  testDB.getDB((db) => {
    console.log('async getDB 2', db);
  });

  testDB.getDB((db) => {
    console.log('async getDB 3', db);
  });

  testDB.onOpened = (db) => {
    console.log('onOpened', db);

    console.log('sync flag 1');
    testDB.getDB((db) => {
      console.log('sync getDB 1', db);
    });

    console.log('sync flag 2');
    testDB.getDB((db) => {
      console.log('sync getDB 2', db);
    });

    console.log('sync flag 3');
    testDB.getDB((db) => {
      console.log('sync getDB 3', db);
    });
  }
}
