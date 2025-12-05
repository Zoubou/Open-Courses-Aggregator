const express = require("express");
const cors = require("cors");

const app = express();

// Enable middleware
app.use(cors());
app.use(express.json());

// optional test route
app.get("/", (req, res) => {
  res.send("Backend running...");
});

module.exports = app;
