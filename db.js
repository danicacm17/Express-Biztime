/** Database setup for BizTime. */

const { Client } = require("pg");

let DB_URI;

if (process.env.NODE_ENV === "test") {
  // No password for test database
  DB_URI = "postgresql://danica@localhost/biztime_test"; 
} else {
  // No password for main database
  DB_URI = "postgresql://danica@localhost/biztime"; 
}

const db = new Client({
  connectionString: DB_URI,
  // Set password as an empty string or omit it if not required
  password: ''
});

db.connect()
  .then(() => console.log('Database connected successfully!'))
  .catch(err => {
    console.error('Error connecting to the database:', err);
    process.exit(1);
  });

module.exports = db;