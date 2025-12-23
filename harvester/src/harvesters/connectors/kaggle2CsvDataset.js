import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

import { parse } from "csv-parse/sync";

import Course from "../../models/course.js";

function normalizeLevel(levelRaw) {
  const n = Number(levelRaw);
  if (Number.isNaN(n)) return "unknown";
  if (n === 0) return "beginner";
  if (n === 1) return "intermediate";
  if (n === 2) return "advanced";
  return "unknown";
}

function decodeHtmlEntities(s) {
  // Minimal decoding seen in the dataset (e.g., "&amp;").
  return s.replaceAll("&amp;", "&");
}

function splitSkills(skillsRaw) {
  if (!skillsRaw) return [];
  const s = decodeHtmlEntities(String(skillsRaw));

  return s
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
}

function normalizePlatform(platformRaw) {
  const s = String(platformRaw ?? "").trim();
  if (!s) return "unknown";
  return s.toLowerCase().replaceAll(/\s+/g, "_");
}

function stableId({ platform, title, level }) {
  const key = `${platform}|${title.trim().toLowerCase().replaceAll(/\s+/g, " ")}|${level}`;
  return crypto.createHash("sha1").update(key).digest("hex");
}

async function readKaggle2CsvRows() {
  const filePath = path.resolve("src/harvesters/data/kaggle2/final_cleaned_dataset.csv");
  const raw = await fs.readFile(filePath, "utf-8");

  // Important: this CSV contains quoted commas and quoted fields with embedded newlines.
  const records = parse(raw, {
    columns: true,
    skip_empty_lines: true,
    relax_quotes: true,
    relax_column_count: true,
    bom: true,
  });

  if (!Array.isArray(records)) throw new Error("final_cleaned_dataset.csv parse failed");
  return records;
}

function toCourseDoc(row) {
  const title = String(row.Course_Name ?? "").trim();
  const platform = normalizePlatform(row.Platform);
  const level = normalizeLevel(row.Level);

  return {
    title,
    description: undefined,
    keywords: splitSkills(row.Skills),
    language: undefined,
    level,
    source: {
      name: `kaggle2_${platform}`,
      url: "https://www.kaggle.com/",
    },
    link: undefined,
    last_update: new Date(),
    source_course_id: stableId({ platform, title, level: String(row.Level ?? "") }),
  };
}

export async function fullImportKaggle2CsvDataset() {
  const rows = await readKaggle2CsvRows();

  const ops = [];
  for (const row of rows) {
    const doc = toCourseDoc(row);
    if (!doc.title || !doc.source_course_id) continue;

    ops.push({
      updateOne: {
        filter: { "source.name": doc.source.name, source_course_id: doc.source_course_id },
        update: { $set: doc },
        upsert: true,
      },
    });
  }

  if (!ops.length) return { matched: 0, upserted: 0, modified: 0 };

  const res = await Course.bulkWrite(ops, { ordered: false });
  return {
    matched: res.matchedCount ?? 0,
    upserted: res.upsertedCount ?? 0,
    modified: res.modifiedCount ?? 0,
  };
}

// Partial update for this dataset is safest as INSERT-ONLY because there is no trustworthy upstream last_update.
export async function partialUpdateKaggle2CsvDataset() {
  const rows = await readKaggle2CsvRows();

  let inserted = 0;
  let skipped = 0;

  const now = new Date();

  for (const row of rows) {
    const doc = toCourseDoc(row);
    if (!doc.title || !doc.source_course_id) continue;

    doc.last_update = now;

    const filter = { "source.name": doc.source.name, source_course_id: doc.source_course_id };
    const res = await Course.updateOne(
      filter,
      { $setOnInsert: doc },
      { upsert: true }
    );

    if (res.upsertedCount) inserted += res.upsertedCount;
    else skipped++;
  }

  return { inserted, skipped };
}
