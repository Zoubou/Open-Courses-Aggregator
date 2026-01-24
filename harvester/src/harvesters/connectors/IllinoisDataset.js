import fs from "node:fs/promises";
import fsSync from "node:fs";
import path from "node:path";
import { parse } from "csv-parse/sync";

import Course from "../../models/course.js";
import { franc } from "franc";
import langs from "langs";

function normalizeLanguageField(raw) {
  if (!raw) return undefined;
  const s = String(raw).trim();
  if (!s) return undefined;
  const lower = s.toLowerCase();

  if (/^[a-z]{2}$/.test(lower)) {
    const l = langs.where("1", lower);
    if (l) return l.name.toLowerCase();
  }

  if (/^[a-z]{3}$/.test(lower)) {
    const l = langs.where("3", lower);
    if (l) return l.name.toLowerCase();
  }

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
  s = s.replace(/^(?:\s*(?:description)\s*[:\-–—]\s*)+/i, "");
  s = s.replace(/^(?:\s*(?:description)\s+)+/i, "");
  s = s.trim();
  return s || undefined;
}

function normalizeKeywords(item) {
  const out = new Set();
  const addMany = (value) => {
    if (Array.isArray(value)) value.forEach((x) => addMany(x));
    else if (typeof value === "string") {
      value
        .split(/[,;|]/)
        .map((s) => s.trim())
        .filter(Boolean)
        .forEach((t) => out.add(t));
    }
  };

  addMany(item.tags);
  addMany(item.subjects);
  addMany(item.skills);

  return [...out];
}

function pickTitle(item) {
  return (item.title ?? item.name ?? "").toString().trim();
}

function pickLink(item) {
  return (item.link ?? item.url ?? "").toString().trim() || undefined;
}

function buildSource(item) {
  const provider = (item.provider ?? "").toString().trim().toLowerCase();
  const name = provider ? `illinois_${provider}` : "illinois";
  return { name, url: "https://waf.cs.illinois.edu/" };
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
    level: "unknown",
    source: buildSource(item),
    link,
    last_update: parseDate(item.last_update),
    source_course_id: computeSourceCourseId(item),
  };
}

async function readIllinoisCsvRows() {
  const filePath = path.resolve("src/harvesters/data/new_data/illinois2.csv");
  if (!fsSync.existsSync(filePath)) {
    throw Object.assign(new Error("illinois2.csv not found"), { code: "ENOENT" });
  }
  const raw = await fs.readFile(filePath, "utf-8");
  const records = parse(raw, { columns: true, skip_empty_lines: true, bom: true });
  if (!Array.isArray(records)) throw new Error("illinois2.csv parse failed");
  return records;
}

export async function fullImportIllinoisCsvDataset() {
  const rows = await readIllinoisCsvRows();

  const ops = [];
  for (const row of rows) {
    // Map illinois2.csv columns
    const item = {
      title: row.Course_Name ?? row.title ?? row.name,
      description: row.Description ?? row.description ?? row.overview ?? row.summary,
      link: row.link ?? row.url, // add a URL column later if you want
      language: row.language ?? row.lang, // or hardcode "English"
      tags: row.Skills ?? row.tags ?? row.subjects ?? row.skills,
      last_update: row.last_update ?? row.updated ?? row.date,
      provider: row.Platform ?? row.provider ?? "illinois",
    };

    const doc = toCourseDoc(item);
    if (!doc.title || !doc.source_course_id) continue;

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

export async function partialUpdateIllinoisCsvDataset() {
  const rows = await readIllinoisCsvRows();

  let inserted = 0;
  let skipped = 0;
  const now = new Date();

  for (const row of rows) {
    const item = {
      title: row.Course_Name ?? row.title ?? row.name,
      description: row.Description ?? row.description ?? row.overview ?? row.summary,
      link: row.link ?? row.url,
      language: row.language ?? row.lang,
      tags: row.Skills ?? row.tags ?? row.subjects ?? row.skills,
      last_update: row.last_update ?? row.updated ?? row.date,
      provider: row.Platform ?? row.provider ?? "illinois",
    };

    const doc = toCourseDoc(item);
    if (!doc.title || !doc.source_course_id) continue;

    doc.last_update = now;

    const filter = { "source.name": doc.source.name, source_course_id: doc.source_course_id };
    const res = await Course.updateOne(filter, { $setOnInsert: doc }, { upsert: true });
    if (res.upsertedCount) inserted += res.upsertedCount;
    else skipped++;
  }

  return { inserted, skipped };
}
