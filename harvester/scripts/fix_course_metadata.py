#!/usr/bin/env python3
"""fix_course_metadata.py

Scans the MongoDB `courses_aggregator` database `courses` collection and:
 - Detects language from course `description` (or `title`) and updates `language` field if different
 - Sets `description` to "import with no description" when missing or empty

Usage:
  python fix_course_metadata.py [--apply] [--min-confidence 0.7] [--limit N]

By default the script runs in dry-run mode and prints planned changes. Use --apply to perform updates.

Dependencies:
  pip install pymongo langdetect python-dotenv

The script reads MONGO_URI (defaults to mongodb://localhost:27017) from the harvester/.env file.
"""

from __future__ import annotations

import argparse
import logging
import os
import re
from pathlib import Path
from typing import Optional, Tuple, Dict

from langdetect import DetectorFactory, detect_langs, LangDetectException
from pymongo import MongoClient
from dotenv import load_dotenv

# Make langdetect deterministic
DetectorFactory.seed = 0

# Language code -> pretty name
LANG_MAP = {
    "en": "English",
    "es": "Spanish",
    "fr": "French",
    "de": "German",
    "pt": "Portuguese",
    "it": "Italian",
    "ru": "Russian",
    "ar": "Arabic",
    "zh-cn": "Chinese",
    "zh-tw": "Chinese",
    "zh": "Chinese",
    "ja": "Japanese",
    "ko": "Korean",
    "hi": "Hindi",
}

UNKNOWN = "Unknown"


def load_env_from_harvester() -> None:
    # harvester/.env is expected to be two levels up from this script: scripts/<file>
    script_dir = Path(__file__).resolve().parent
    harvester_root = script_dir.parent
    env_path = harvester_root / ".env"
    if env_path.exists():
        load_dotenv(env_path)
        logging.debug(f"Loaded .env from {env_path}")
    else:
        logging.debug("No .env found at harvester root; falling back to environment variables")


def detect_language_from_text(text: str, min_confidence: float = 0.7) -> Tuple[str, float]:
    """Return (language_name, confidence)."""
    if not text or not text.strip():
        return UNKNOWN, 0.0
    try:
        langs = detect_langs(text)
    except LangDetectException:
        return UNKNOWN, 0.0
    if not langs:
        return UNKNOWN, 0.0
    best = langs[0]
    code = best.lang.lower()
    prob = float(best.prob)
    name = LANG_MAP.get(code, UNKNOWN)
    if prob < min_confidence:
        return UNKNOWN, prob
    return name, prob


def normalize_db_language(lang_value: Optional[str]) -> str:
    if not lang_value:
        return UNKNOWN
    lv = lang_value.strip()
    if not lv:
        return UNKNOWN
    # Common normalization (e.g., 'english' -> 'English', 'en' -> English)
    lv_lower = lv.lower()
    if lv_lower in (v.lower() for v in LANG_MAP.values()):
        # return capitalized name from LANG_MAP values
        for code, name in LANG_MAP.items():
            if name.lower() == lv_lower:
                return name
    if lv_lower in LANG_MAP:
        return LANG_MAP[lv_lower]
    # possibly stored as 'en' or 'EN'
    if lv_lower in LANG_MAP:
        return LANG_MAP[lv_lower]
    # fallback: title case
    return lv.capitalize()


def clean_description(text: Optional[str]) -> str:
    """Remove leading 'Description' tokens and common noise from imported descriptions."""
    if not text:
        return ""
    s = str(text).strip()
    # Remove leading repeated 'Description' (case-insensitive) followed by colon/dash/space
    s = re.sub(r'^(?:\s*(?:description)\s*[:\-–—]\s*)+', '', s, flags=re.IGNORECASE)
    # If there's still a leading 'description' word followed by whitespace, remove it
    s = re.sub(r'^(?:\s*(?:description)\s+)+', '', s, flags=re.IGNORECASE)
    return s.strip()


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--apply", action="store_true", help="Apply changes to the DB (default: dry-run)")
    parser.add_argument("--min-confidence", type=float, default=0.7, help="Min confidence for language detection (0..1)")
    parser.add_argument("--limit", type=int, default=0, help="Limit number of courses processed (0 = no limit)")
    parser.add_argument("--batch-size", type=int, default=100, help="How many docs to fetch per batch")
    parser.add_argument("--verbose", action="store_true")
    args = parser.parse_args()

    logging.basicConfig(level=logging.DEBUG if args.verbose else logging.INFO, format="%(message)s")

    load_env_from_harvester()
    mongo_uri = os.getenv("MONGO_URI", "mongodb://localhost:27017")

    client = MongoClient(mongo_uri)
    db = client.get_database("courses_aggregator")
    coll = db.get_collection("courses")

    query = {}
    total = coll.count_documents(query)
    logging.info(f"Found {total} total courses in DB")

    processed = 0
    updated_docs = 0
    fixes_lang = 0
    fixes_desc = 0

    cursor = coll.find(query, no_cursor_timeout=True).batch_size(args.batch_size)
    try:
        for doc in cursor:
            if args.limit and processed >= args.limit:
                break
            processed += 1

            doc_id = doc.get("_id")
            title = doc.get("title", "")
            description = doc.get("description")
            current_lang = normalize_db_language(doc.get("language"))

            updates: Dict[str, object] = {}

            # Clean existing description if present, otherwise set placeholder
            cleaned_desc = None
            if description and str(description).strip():
                cleaned = clean_description(description)
                if not cleaned:
                    # cleaned text is empty -> set placeholder
                    updates["description"] = "import with no description"
                    fixes_desc += 1
                elif cleaned != str(description).strip():
                    # remove noisy leading tokens like 'Description:'
                    updates["description"] = cleaned
                    fixes_desc += 1
                cleaned_desc = cleaned
            else:
                updates["description"] = "import with no description"
                fixes_desc += 1

            # Choose text to detect language: prefer cleaned description (unless placeholder) else title
            text_for_lang = None
            if cleaned_desc and cleaned_desc != "import with no description":
                text_for_lang = cleaned_desc
            elif title and title.strip():
                text_for_lang = str(title)
            else:
                text_for_lang = ""

            detected_lang, confidence = detect_language_from_text(text_for_lang or "", args.min_confidence)

            # If detected differs from current -> update
            if detected_lang != UNKNOWN and detected_lang != current_lang:
                updates["language"] = detected_lang
                fixes_lang += 1

            if updates:
                logging.info(f"Doc {doc_id}: will update -> {updates} (detected: {detected_lang}, conf={confidence:.2f}, current: {current_lang})")
                if args.apply:
                    result = coll.update_one({"_id": doc_id}, {"$set": updates})
                    if result.modified_count:
                        updated_docs += 1
                    else:
                        logging.warning(f"Doc {doc_id}: update reported modified_count=0")
            else:
                logging.debug(f"Doc {doc_id}: no changes needed (detected: {detected_lang}, current: {current_lang})")

    finally:
        cursor.close()

    logging.info("--- Summary ---")
    logging.info(f"Processed: {processed}")
    logging.info(f"Language fixes planned: {fixes_lang}")
    logging.info(f"Description fixes planned: {fixes_desc}")
    logging.info(f"Updated docs (applied): {updated_docs}")


if __name__ == "__main__":
    main()
