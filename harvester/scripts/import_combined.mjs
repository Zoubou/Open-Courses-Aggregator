import connectDB from '../config/db.js';
import mongoose from 'mongoose';
import fs from 'node:fs/promises';
import fsSync from 'node:fs';
import path from 'node:path';
import { parse } from 'csv-parse/sync';
import { fullImportKaggleCombinedDataset } from '../src/harvesters/connectors/kaggleCombinedDataset.js';

const COMBINED_PATH = path.resolve('src/harvesters/data/kaggle/combined_dataset.json');
const NEW_DATA_DIR = path.resolve('src/harvesters/data/new_data');

function computeId(item) {
  return item.link || item.title || JSON.stringify(item).slice(0, 200);
}

async function mergeNewCsvsIntoCombined() {
  // Load existing combined dataset
  let combined = [];
  try {
    const raw = await fs.readFile(COMBINED_PATH, 'utf-8');
    combined = JSON.parse(raw);
    if (!Array.isArray(combined)) throw new Error('combined_dataset.json must be an array');
  } catch (err) {
    if (err.code === 'ENOENT') combined = [];
    else throw err;
  }

  const existingIds = new Set(combined.map(computeId));

  // If new data folder doesn't exist, nothing to merge
  if (!fsSync.existsSync(NEW_DATA_DIR)) return { merged: 0 };

  const files = fsSync.readdirSync(NEW_DATA_DIR).filter(f => /\.csv$/i.test(f));
  if (!files.length) return { merged: 0 };

  let merged = 0;
  for (const f of files) {
    const txt = fsSync.readFileSync(path.join(NEW_DATA_DIR, f), 'utf-8');
    const rows = parse(txt, { columns: true, skip_empty_lines: true });
    for (const r of rows) {
      const item = {
        title: (r.title || r.name || '').toString().trim(),
        description: (r.description || r.overview || r.summary || '').toString().trim(),
        link: (r.link || r.url || '').toString().trim() || undefined,
        language: (r.language || r.lang || '').toString().trim() || undefined,
        tags: r.tags ? (Array.isArray(r.tags) ? r.tags : r.tags.toString().split(',').map(s => s.trim()).filter(Boolean)) : undefined,
        last_update: r.last_update || r.updated || r.date || undefined,
        provider: r.provider || undefined,
      };

      const id = computeId(item);
      if (existingIds.has(id)) continue;
      combined.push(item);
      existingIds.add(id);
      merged++;
    }
  }

  if (merged) {
    await fs.writeFile(COMBINED_PATH, JSON.stringify(combined, null, 2), 'utf-8');
  }

  return { merged };
}

async function main() {
  try {
    const mergeRes = await mergeNewCsvsIntoCombined();
    if (mergeRes.merged) console.log(`Merged ${mergeRes.merged} rows from new_data into combined_dataset.json`);

    await connectDB();
    const res = await fullImportKaggleCombinedDataset();
    console.log('Import result:', res);
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Import failed', err);
    process.exit(1);
  }
}

main();
