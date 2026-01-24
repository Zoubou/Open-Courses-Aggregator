import fs from "node:fs/promises";
import path from "node:path";

import Course from "../../models/course.js";
import { franc } from "franc";
import langs from "langs";

function normalizeLanguageField(raw) {
  if (!raw) return undefined;
  const s = String(raw).trim();
  if (!s) return undefined;
  const lower = s.toLowerCase();

  // ISO 639-1 two-letter code
  if (/^[a-z]{2}$/.test(lower)) {
    const l = langs.where("1", lower);
    if (l) return l.name.toLowerCase();
  }

  // ISO 639-3 three-letter code
  if (/^[a-z]{3}$/.test(lower)) {
    const l = langs.where("3", lower);
    if (l) return l.name.toLowerCase();
  }

  // Plain name, return as lowercased
  return lower;
}

function detectLanguageFromText(...texts) {
  const text = texts.filter(Boolean).join(" ").trim();
  if (!text || text.length < 30) return undefined;
  const code = franc(text, { minLength: 10 });
  if (!code || code === "und") return undefined;
  const l = langs.where("3", code);
  return l ? l.name.toLowerCase() : undefined;
} 

function cleanDescription(text) {
  if (text == null) return undefined;
  let s = String(text).trim();
  // Remove leading repeated 'Description' (case-insensitive) followed by colon/dash/space
  s = s.replace(/^(?:\s*(?:description)\s*[:\-–—]\s*)+/i, "");
  // If there's still a leading 'description' word followed by whitespace, remove it
  s = s.replace(/^(?:\s*(?:description)\s+)+/i, "");
  s = s.trim();
  return s || undefined;
} 
function normalizeLevel(levelRaw) {
  const s = String(levelRaw ?? "").trim().toLowerCase();
  if (!s) return "unknown";
  if (s.includes("beginner") || s.includes("intro")) return "beginner";
  if (s.includes("intermediate")) return "intermediate";
  if (s.includes("advanced")) return "advanced";
  return "unknown";
}

function normalizeKeywords(item) {
  const out = new Set();

  const addMany = (value) => {
    if (Array.isArray(value)) value.forEach((x) => addMany(x));
    else if (typeof value === "string") {
      const t = value.trim();
      if (t) out.add(t);
    }
  };

  addMany(item.skills);
  addMany(item.subject);
  addMany(item.tags);

  return [...out];
}

function pickTitle(item) {
  return (item.title ?? item.course_name ?? "").toString().trim();
}

function pickLink(item) {
  return (item.link ?? item.url ?? "").toString().trim() || undefined;
}

function buildSource(item) {
  const provider = (item.provider ?? "").toString().trim().toLowerCase();
  const name = provider ? `kaggle_${provider}` : "kaggle";
  return { name, url: "https://www.kaggle.com/" };
}

function computeSourceCourseId(item) {
  const link = pickLink(item);
  if (link) return link;

  const title = pickTitle(item);
  if (title) return title;

  return JSON.stringify(item).slice(0, 200);
}

function parseDate(value) {
  if (!value) return undefined;
  const d = new Date(value);
  return Number.isNaN(d.valueOf()) ? undefined : d;
}

function toCourseDoc(item) {
  const title = pickTitle(item);
  const link = pickLink(item);

  const normalizedLang = normalizeLanguageField(item.language);
  const cleanedDescription = cleanDescription(item.description);
  const detectedLang = detectLanguageFromText(title, cleanedDescription);

  return {
    title,
    description: cleanedDescription,
    keywords: normalizeKeywords(item),
    language: normalizedLang || detectedLang || undefined,
    level: normalizeLevel(item.level),
    source: buildSource(item),
    link,
    last_update: parseDate(item.last_update),
    source_course_id: computeSourceCourseId(item),
  };
} 

async function readCombinedDatasetJSON() {
  const filePath = path.resolve("src/harvesters/data/kaggle/combined_dataset.json");
  const raw = await fs.readFile(filePath, "utf-8");
  const data = JSON.parse(raw);
  if (!Array.isArray(data)) throw new Error("combined_dataset.json must be an array");
  return data;
}

export async function fullImportKaggleCombinedDataset() {
  const rows = await readCombinedDatasetJSON();

  const ops = [];
  for (const item of rows) {
    const doc = toCourseDoc(item);
    if (!doc.title || !doc.source_course_id) continue;

    // If dataset doesn't provide last_update, stamp now for traceability.
    if (!doc.last_update) doc.last_update = new Date();

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

export async function partialUpdateKaggleCombinedDataset() {
  const rows = await readCombinedDatasetJSON();

  let updated = 0;
  let inserted = 0;
  let skipped = 0;

  for (const item of rows) {
    const doc = toCourseDoc(item);
    if (!doc.title || !doc.source_course_id) continue;

    const filter = { "source.name": doc.source.name, source_course_id: doc.source_course_id };
    const existing = await Course.findOne(filter).select("last_update").lean();

    // If we don't have a trustworthy incoming last_update, treat as upsert.
    if (existing?.last_update && doc.last_update && doc.last_update <= new Date(existing.last_update)) {
      skipped++;
      continue;
    }

    if (!doc.last_update) doc.last_update = new Date();

    const res = await Course.updateOne(filter, { $set: doc }, { upsert: true });
    if (res.upsertedCount) inserted += res.upsertedCount;
    else updated += res.modifiedCount ?? 0;
  }

  return { updated, inserted, skipped };
}