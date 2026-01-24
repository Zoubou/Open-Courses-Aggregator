// index.js
import { spawn } from "node:child_process";
import fsSync from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import connectDB from "./config/db.js";
import mongoose from "mongoose";
import {
  fullImportKaggleCourses,
  partialUpdateKaggleCourses,
} from "./src/harvesters/kaggleCourses.js";
import {
  fullImportKaggle2Courses,
  partialUpdateKaggle2Courses,
} from "./src/harvesters/kaggle2Courses.js";
import {
  fullImportIllinoisCourses,
  partialUpdateIllinoisCourses,
} from "./src/harvesters/illinoisCourses.js";

function parseImportMode() {
  const mode = String(process.env.IMPORT_MODE ?? "full").trim().toLowerCase();
  return mode === "partial" ? "partial" : "full";
}

function parseImportSources() {
  // Comma-separated: kaggle,kaggle2,illinois
  const raw = String(process.env.IMPORT_SOURCES ?? "kaggle,kaggle2,illinois");
  const parts = raw
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

  return new Set(parts.length ? parts : ["kaggle", "kaggle2", "illinois"]);
}

function displaySourceName(s) {
  if (!s) return s;
  const map = {
    kaggle: "kaggle",
    kaggle2: "kaggle2",
    illinois: "University of Illinois",
    illinois_waf: "University of Illinois",
  };
  return map[s] ?? s;
}

async function ensureIllinois2CsvExists() {
  const __filename = fileURLToPath(import.meta.url);
  const root = path.resolve(path.dirname(__filename));
  const newDataDir = path.join(root, "src", "harvesters", "data", "new_data");
  const illinois2Path = path.join(newDataDir, "illinois2.csv");

  if (fsSync.existsSync(illinois2Path)) {
    console.log(`Found illinois2.csv at ${illinois2Path}`);
    return;
  }

  console.log("illinois2.csv not found. Running new_source.py and fix.py to generate it...");

  const pythonCmd = process.platform === "win32" ? "python" : "python3";

  // 1) Run new_source.py
  await new Promise((resolve, reject) => {
    const ps = spawn(
      pythonCmd,
      ["scripts/new_source.py"],
      { cwd: root, stdio: "inherit", shell: true }
    );
    ps.on("close", (code) =>
      code === 0 ? resolve() : reject(new Error(`new_source.py exited with code ${code}`))
    );
    ps.on("error", reject);
  });

  // 2) Run fix.py
  await new Promise((resolve, reject) => {
    const ps = spawn(
      pythonCmd,
      ["scripts/fix.py"],
      { cwd: root, stdio: "inherit", shell: true }
    );
    ps.on("close", (code) =>
      code === 0 ? resolve() : reject(new Error(`fix.py exited with code ${code}`))
    );
    ps.on("error", reject);
  });

  if (!fsSync.existsSync(illinois2Path)) {
    throw new Error("illinois2.csv was not created by fix.py");
  }

  console.log(`illinois2.csv generated at ${illinois2Path}`);
}

async function main() {
  await connectDB();
  const mode = parseImportMode();
  const sources = parseImportSources();

  console.log("Import mode:", mode);
  const display = [...sources].map(displaySourceName).join(", ");
  console.log("Import sources:", display);

  // Ensure illinois2.csv exists if Illinois is enabled
  if (sources.has("illinois")) {
    await ensureIllinois2CsvExists();
  }

  // Illinois (illinois2.csv via illinoisCourses / IllinoisDataset)
  if (sources.has("illinois")) {
    const illinoisResult =
      mode === "partial"
        ? await partialUpdateIllinoisCourses()
        : await fullImportIllinoisCourses();
    console.log("Illinois import finished:", illinoisResult);
  }

  // Kaggle JSON
  if (sources.has("kaggle")) {
    const kaggleResult =
      mode === "partial"
        ? await partialUpdateKaggleCourses()
        : await fullImportKaggleCourses();
    console.log("Kaggle import finished:", kaggleResult);
  }

  // Kaggle2 CSV
  if (sources.has("kaggle2")) {
    const kaggle2Result =
      mode === "partial"
        ? await partialUpdateKaggle2Courses()
        : await fullImportKaggle2Courses();
    console.log("Kaggle2 import finished:", kaggle2Result);
  }

  await mongoose.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
