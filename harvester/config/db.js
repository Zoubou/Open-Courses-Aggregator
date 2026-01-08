import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Υπολογισμός της διαδρομής του .env που βρίσκεται μέσα στον harvester
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Αυτό λέει στο dotenv να ψάξει το .env στον φάκελο harvester, 
// ακόμα και αν το τρέχουμε από το Backend
dotenv.config({ path: path.resolve(__dirname, "../.env") });

export default async function connectDB() {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    throw new Error(
      "Missing MONGO_URI. Ensure the .env file is in the harvester directory."
    );
  }

  await mongoose.connect(mongoUri, {
    dbName: "courses_aggregator" // Το ενιαίο όνομα βάσης
  });
  console.log("MongoDB connected successfully");
}