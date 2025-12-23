// config/db.js
import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

export default async function connectDB() {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    throw new Error(
      "Missing MONGO_URI. Set it in a .env file or your shell environment (e.g. MONGO_URI=mongodb://localhost:27017)."
    );
  }

  await mongoose.connect(mongoUri, {
    dbName: "courses_aggregator"
  });
  console.log("MongoDB connected");
}
