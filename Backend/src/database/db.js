const mysql = require("mysql2");

const pool = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "root",
  database: "coursesdb",
  port: 3306
});

const db = pool.promise();

db.getConnection()
  .then(conn => {
    console.log("Connected to MySQL!");
    conn.release();
  })
  .catch(err => {
    console.error("Database connection failed:", err);
  });

module.exports = db;

