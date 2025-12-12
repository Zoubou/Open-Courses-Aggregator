const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());
 
app.get("/", (req, res) => {
  res.send("Backend running...");
});

const courseRoutes = require('./routes/routes.js');
app.use('/courses', courseRoutes);

module.exports = app;
