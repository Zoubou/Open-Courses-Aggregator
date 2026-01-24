import fs from 'node:fs/promises';
import path from 'node:path';

const filePath = path.resolve('src/harvesters/data/kaggle/combined_dataset.json');

function cleanDescription(s) {
  if (!s) return s;
  let out = String(s).trim();

  // Remove leading noisy tokens like "Course Description:", "Description -", etc.
  out = out.replace(/^(?:\s*(?:course\s+)?(?:description)\s*[:\-–—]?\s*)+/i, '');

  // Also remove lingering "Course Description:" occurrences that appear mid-text (even if fused to previous word)
  out = out.replace(/course\s*description\s*[:\-–—]?/ig, '');

  // Strip HTML tags (e.g., <p>, <br>, <strong>) and replace them with spaces
  out = out.replace(/<\/?[^>]+>/g, ' ');

  // Decode common HTML entities
  out = out.replace(/&nbsp;/gi, ' ')
           .replace(/&amp;/gi, '&')
           .replace(/&lt;/gi, '<')
           .replace(/&gt;/gi, '>')
           .replace(/&quot;/gi, '"')
           .replace(/&#39;/g, "'");

  // Collapse whitespace and trim
  out = out.replace(/\s+/g, ' ').trim();

  return out;
}

async function main() {
  const raw = await fs.readFile(filePath, 'utf-8');
  const data = JSON.parse(raw);
  if (!Array.isArray(data)) throw new Error('expected an array');

  let changed = 0;

  const out = data.map((item) => {
    if (item && typeof item.description === 'string') {
      const cleaned = cleanDescription(item.description);
      if (cleaned !== item.description) {
        changed += 1;
        return { ...item, description: cleaned };
      }
    }
    return item;
  });

  if (changed) {
    await fs.writeFile(filePath, JSON.stringify(out, null, 2), 'utf-8');
    console.log(`Cleaned ${changed} descriptions in ${filePath}`);
  } else {
    console.log('No changes needed');
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
