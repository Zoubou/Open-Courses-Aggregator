// index.js
import connectDB from "./config/db.js";
import mongoose from "mongoose";
import { fullImportKaggleCourses, partialUpdateKaggleCourses } from "./src/harvesters/kaggleCourses.js";
import { fullImportKaggle2Courses, partialUpdateKaggle2Courses } from "./src/harvesters/kaggle2Courses.js";

function parseImportMode() {
  const mode = String(process.env.IMPORT_MODE ?? "full").trim().toLowerCase();
  return mode === "partial" ? "partial" : "full";
}

function parseImportSources() {
  // Comma-separated: kaggle,kaggle2
  const raw = String(process.env.IMPORT_SOURCES ?? "kaggle,kaggle2");
  const parts = raw
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

  return new Set(parts.length ? parts : ["kaggle", "kaggle2"]);
}

async function main() {
  await connectDB();
  const mode = parseImportMode();
  const sources = parseImportSources();

  console.log("Import mode:", mode);
  console.log("Import sources:", [...sources].join(", "));

  if (sources.has("kaggle")) {
    const kaggleResult = mode === "partial" ? await partialUpdateKaggleCourses() : await fullImportKaggleCourses();
    console.log("Kaggle import finished:", kaggleResult);
  }

  if (sources.has("kaggle2")) {
    const kaggle2Result = mode === "partial" ? await partialUpdateKaggle2Courses() : await fullImportKaggle2Courses();
    console.log("Kaggle2 import finished:", kaggle2Result);
  }

  await mongoose.disconnect();
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
