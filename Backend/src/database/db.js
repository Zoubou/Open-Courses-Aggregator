const mysql = require('mysql2');

const con = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "root",
    database: "coursesdb"
});

con.connect((err) => {
    if (err) throw err;
    console.log('Connected to MySQL!');
});

module.exports = con;