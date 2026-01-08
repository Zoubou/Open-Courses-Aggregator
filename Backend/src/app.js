import express from "express";
import cors from "cors";
import connectDB from "../../harvester/config/db.js"; 
import courseRoutes from "./routes/routes.js";

const app = express();

app.use(cors());
app.use(express.json());

connectDB();

app.get("/", (req, res) => {
  res.send("Backend running with shared MongoDB config...");
});

app.use('/courses', courseRoutes);

export default app; 