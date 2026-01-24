#!/usr/bin/env python3
"""total_languages.py

Scan the `courses` collection and produce a JSON list of languages
and counts suitable for frontend filtering.

Usage:
  python total_languages.py [--out PATH] [--mongo-uri URI] [--min-count N]

The script writes a JSON array to stdout or to `--out` with objects:
  { "label": "English", "value": "English", "count": 123 }

It normalizes stored language values using the same normalization rules
used by the fix script so the frontend can consume consistent labels.
"""

from __future__ import annotations

import argparse
import json
import logging
import os
from pathlib import Path
from typing import Optional, Dict, Any

from dotenv import load_dotenv
from pymongo import MongoClient

# Minimal LANG_MAP copied/expanded from fix_course_metadata for consistent labels
LANG_MAP = {
    "en": "English",
    "es": "Spanish",
    "fr": "French",
    "de": "German",
    "pt": "Portuguese",
    "it": "Italian",
    "ru": "Russian",
    "ar": "Arabic",
    "zh-cn": "Chinese (Simplified)",
    "zh-tw": "Chinese (Traditional)",
    "zh": "Chinese",
    "ja": "Japanese",
    "ko": "Korean",
    "hi": "Hindi",
    "tr": "Turkish",
    "nl": "Dutch",
    "sv": "Swedish",
    "fi": "Finnish",
    "no": "Norwegian",
    "da": "Danish",
    "pl": "Polish",
    "cs": "Czech",
    "el": "Greek",
    "he": "Hebrew",
    "id": "Indonesian",
    "th": "Thai",
    "vi": "Vietnamese",
}

UNKNOWN = "Unknown"


def load_env_from_harvester() -> None:
    script_dir = Path(__file__).resolve().parent
    harvester_root = script_dir.parent
    env_path = harvester_root / ".env"
    if env_path.exists():
        load_dotenv(env_path)
        logging.debug(f"Loaded .env from {env_path}")


def normalize_db_language(lang_value: Optional[str]) -> str:
    if not lang_value:
        return UNKNOWN
    lv = str(lang_value).strip()
    if not lv:
        return UNKNOWN
    lv_lower = lv.lower()
    # If the stored value matches a LANG_MAP value (e.g. 'English')
    if lv_lower in (v.lower() for v in LANG_MAP.values()):
        for code, name in LANG_MAP.items():
            if name.lower() == lv_lower:
                return name
    # If the stored value is an ISO code
    if lv_lower in LANG_MAP:
        return LANG_MAP[lv_lower]
    # fallback: title case the stored value
    return lv.capitalize()


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--out", help="Output file (JSON). If omitted, prints to stdout.")
    parser.add_argument("--mongo-uri", help="Mongo URI (overrides .env MONGO_URI)")
    parser.add_argument("--min-count", type=int, default=1, help="Minimum count to include a language")
    parser.add_argument("--verbose", action="store_true")
    args = parser.parse_args()

    logging.basicConfig(level=logging.DEBUG if args.verbose else logging.INFO, format="%(message)s")

    load_env_from_harvester()
    mongo_uri = args.mongo_uri or os.getenv("MONGO_URI", "mongodb://localhost:27017")

    client = MongoClient(mongo_uri)
    db = client.get_database("courses_aggregator")
    coll = db.get_collection("courses")

    # Aggregate distinct stored language values with counts
    pipeline = [
        {"$project": {"language": {"$ifNull": ["$language", ""]}}},
        {"$group": {"_id": "$language", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
    ]

    agg = coll.aggregate(pipeline)

    normalized_map: Dict[str, Dict[str, Any]] = {}
    total_docs = 0
    for row in agg:
        raw = row.get("_id") or ""
        count = int(row.get("count", 0))
        total_docs += count
        norm = normalize_db_language(raw)
        entry = normalized_map.setdefault(norm, {"label": norm, "value": norm, "count": 0, "raw_values": []})
        entry["count"] += count
        if raw not in entry["raw_values"]:
            entry["raw_values"].append(raw)

    # Build list and filter by min_count
    items = [v for v in normalized_map.values() if v["count"] >= args.min_count]
    items.sort(key=lambda x: x["count"], reverse=True)

    output = {"total_documents": total_docs, "languages": items}

    out_json = json.dumps(output, ensure_ascii=False, indent=2)
    if args.out:
        out_path = Path(args.out)
        out_path.write_text(out_json, encoding="utf-8")
        logging.info(f"Wrote {len(items)} languages to {out_path} (total docs: {total_docs})")
    else:
        print(out_json)


if __name__ == "__main__":
    main()
