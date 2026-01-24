#!/usr/bin/env python3
"""Fetch course catalog CSV and append to kaggle combined_dataset.json, then trigger import.

Usage:
  python scripts/new_source.py [--url <csv-url>] [--provider <name>] [--apply]

- Default URL: https://waf.cs.illinois.edu/discovery/course-catalog.csv
- --apply will write to combined_dataset.json and run `npm run import:combined` to insert into DB
 - The fetched CSV will be saved as src/harvesters/data/new_data/illinois.csv (overwriting each time).
Notes:
- The script maps common CSV column names to the fields used in the combined dataset.
- It avoids duplicates by link (preferred) or title.
"""
from __future__ import annotations

import argparse
import json
import os
import subprocess
from pathlib import Path
from typing import Dict, List
from datetime import datetime

import pandas as pd

# Default CSV to fetch
DEFAULT_CSV_URL = "https://waf.cs.illinois.edu/discovery/course-catalog.csv"
BASE_DIR = Path(__file__).resolve().parent.parent
COMBINED_JSON = BASE_DIR / "src/harvesters/data/kaggle/combined_dataset.json"

# Candidate column names for mapping
TITLE_COLS = ["title", "course_title", "name", "Course Title", "courseName"]
DESC_COLS = ["description", "overview", "courseDescription", "Course Description", "summary"]
LINK_COLS = ["url", "link", "course_url", "courseLink"]
LANG_COLS = ["language", "lang"]
TAGS_COLS = ["tags", "subjects", "skills"]
LAST_UPDATE_COLS = ["last_update", "updated", "modified", "date"]

# Additional candidate columns present in the public CSV
YEAR_COLS = ["Year", "year"]
TERM_COLS = ["Term", "term"]
YEARTERM_COLS = ["YearTerm", "Year Term", "year_term"]
SUBJECT_COLS = ["Subject", "subject"]
NUMBER_COLS = ["Number", "number"]
CREDIT_COLS = ["Credit Hours", "Credits", "credit_hours", "credit"]
SECTION_COLS = ["Section Info", "Section", "section_info", "section"]
DEGREE_COLS = ["Degree Attributes", "degree_attributes", "DegreeAttributes"]


def first_existing(row: pd.Series, candidates: List[str]):
    for c in candidates:
        if c in row and pd.notna(row[c]):
            v = row[c]
            if isinstance(v, float):
                # nan
                continue
            s = str(v).strip()
            if s:
                return s
    return None


def row_to_item(row: pd.Series, provider_name: str) -> Dict:
    item: Dict = {}

    title = first_existing(row, TITLE_COLS) or first_existing(row, [col for col in row.index])
    if title:
        item["title"] = title

    desc = first_existing(row, DESC_COLS)
    if desc:
        item["description"] = desc

    link = first_existing(row, LINK_COLS)
    if link:
        item["link"] = link

    lang = first_existing(row, LANG_COLS)
    if lang:
        item["language"] = lang

    # tags: may be comma-separated
    tags_raw = first_existing(row, TAGS_COLS)
    if tags_raw:
        if isinstance(tags_raw, str) and ("," in tags_raw):
            tags = [t.strip() for t in tags_raw.split(",") if t.strip()]
        else:
            tags = [tags_raw]
        item["tags"] = tags

    last = first_existing(row, LAST_UPDATE_COLS)
    if last:
        item["last_update"] = last

    # Course-specific fields from the public CSV
    year_raw = first_existing(row, YEAR_COLS)
    if year_raw:
        try:
            item["year"] = int(year_raw)
        except Exception:
            item["year"] = year_raw

    term = first_existing(row, TERM_COLS)
    if term:
        item["term"] = term

    year_term = first_existing(row, YEARTERM_COLS)
    if year_term:
        item["year_term"] = year_term

    subject = first_existing(row, SUBJECT_COLS)
    if subject:
        item["subject"] = subject

    number_raw = first_existing(row, NUMBER_COLS)
    if number_raw:
        try:
            item["number"] = int(number_raw)
        except Exception:
            item["number"] = number_raw

    credit_hours = first_existing(row, CREDIT_COLS)
    if credit_hours:
        item["credit_hours"] = credit_hours

    section_info = first_existing(row, SECTION_COLS)
    if section_info:
        item["section_info"] = section_info

    degree_attrs = first_existing(row, DEGREE_COLS)
    if degree_attrs:
        item["degree_attributes"] = degree_attrs

    # provider information
    item["provider"] = provider_name

    return item


def load_combined() -> List[Dict]:
    if not COMBINED_JSON.exists():
        return []
    with open(COMBINED_JSON, "r", encoding="utf-8") as fh:
        data = json.load(fh)
        if not isinstance(data, list):
            raise RuntimeError("combined_dataset.json must contain an array")
        return data


def write_combined(data: List[Dict]):
    # Write pretty JSON (2-space) to match repo style
    with open(COMBINED_JSON, "w", encoding="utf-8") as fh:
        json.dump(data, fh, ensure_ascii=False, indent=2)


def compute_id(item: Dict) -> str:
    # Use link if present, else title
    return item.get("link") or item.get("title") or json.dumps(item)[:200]


def run_import_combined() -> int:
    # Run `npm run import:combined` in harvester folder
    cwd = str(BASE_DIR)
    print(f"Running importer in {cwd}...")
    try:
        res = subprocess.run(["npm", "run", "import:combined"], cwd=cwd, check=False)
        return res.returncode
    except FileNotFoundError:
        print("npm not found on PATH; skipping import step")
        return 1


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--url", default=DEFAULT_CSV_URL)
    parser.add_argument("--provider", default="illinois_waf")
    parser.add_argument("--apply", action="store_true", help="Write to combined_dataset.json and run importer")
    args = parser.parse_args()

    print(f"Fetching CSV from: {args.url}")
    df = pd.read_csv(args.url)
    print(f"Fetched {len(df)} rows")

    # Save the fetched CSV to src/harvesters/data/new_data for later inspection
    NEW_DATA_DIR = BASE_DIR / "src/harvesters/data/new_data"
    try:
        NEW_DATA_DIR.mkdir(parents=True, exist_ok=True)
        # Save fetched CSV as a stable filename for inspection
        raw_csv_path = NEW_DATA_DIR / "illinois.csv"
        # Use DataFrame to_csv to preserve the fetched content
        df.to_csv(raw_csv_path, index=False, encoding="utf-8")
        print(f"Saved fetched CSV to {raw_csv_path}")
    except Exception as e:
        print(f"Warning: failed to save fetched CSV: {e}")

    items = [row_to_item(row, args.provider) for _, row in df.iterrows()]
    # Keep only items with title or link
    items = [it for it in items if it.get("title") or it.get("link")]

    print(f"Mapped {len(items)} candidate items (title/link present)")

    if not args.apply:
        print("Dry run (no changes). Use --apply to write to JSON and import into DB.")
        return

    # Load existing combined dataset
    existing = load_combined()
    existing_ids = set(compute_id(x) for x in existing)

    added = 0
    for it in items:
        sid = compute_id(it)
        if sid in existing_ids:
            continue
        # Ensure keys are simple primitives; convert lists where appropriate
        # We'll keep the new item footprint small (title, description, link, language, provider, tags, last_update)
        to_add = {}
        if it.get("title"): to_add["title"] = it["title"]
        if it.get("description"): to_add["description"] = it["description"]
        if it.get("link"): to_add["link"] = it["link"]
        if it.get("language"): to_add["language"] = it["language"]
        if it.get("tags"): to_add["tags"] = it["tags"]
        if it.get("last_update"): to_add["last_update"] = it["last_update"]
        # provider -> provider
        to_add["provider"] = it.get("provider")

        existing.append(to_add)
        existing_ids.add(sid)
        added += 1

    if added:
        write_combined(existing)
        print(f"Appended {added} new items to {COMBINED_JSON}")

        # Write newly added items to a timestamped CSV under src/harvesters/data/new_data
        NEW_DATA_DIR = BASE_DIR / "src/harvesters/data/new_data"
        NEW_DATA_DIR.mkdir(parents=True, exist_ok=True)

        ts = datetime.utcnow().strftime("%Y%m%dT%H%M%SZ")
        csv_path = NEW_DATA_DIR / f"new_{ts}.csv"

        import csv

        keys = ["title", "description", "link", "language", "provider", "tags", "last_update"]
        with open(csv_path, "w", encoding="utf-8", newline="") as fh:
            writer = csv.DictWriter(fh, fieldnames=keys)
            writer.writeheader()
            for item in [x for x in existing[-added:]]:
                row = {k: item.get(k, "") for k in keys}
                if isinstance(row.get("tags"), list):
                    row["tags"] = ",".join(row["tags"])
                writer.writerow(row)

        print(f"Wrote {added} new items CSV to {csv_path}")
    else:
        print("No new items to add")

    print("Finished (did not run importer). To import these items into the DB, run: npm run import:combined")


if __name__ == "__main__":
    main()