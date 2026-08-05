#!/usr/bin/env python3

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]

SURAH_DIR = ROOT / "public" / "data" / "surah"
NOTES_DIR = ROOT / "public" / "data" / "notes"
SEARCH_INDEX = ROOT / "public" / "data" / "search-index.json"

print("=" * 70)
print("Tamil Quran Dataset Summary")
print("=" * 70)
print()

surahs = 0
ayah_groups = 0
verses = 0
introductions = 0

# ---------------------------------------------------------------------
# Count dataset
# ---------------------------------------------------------------------

for file in sorted(SURAH_DIR.glob("*.json"), key=lambda p: int(p.stem)):

    with file.open(encoding="utf-8") as f:
        data = json.load(f)

    surahs += 1

    if data.get("introduction"):
        introductions += 1

    ayah_groups += len(data["ayah_groups"])

    for group in data["ayah_groups"]:
        verses += len(group["verses"])

notes = len(list(NOTES_DIR.glob("*.json")))

with SEARCH_INDEX.open(encoding="utf-8") as f:
    search = json.load(f)

search_entries = len(search)

# ---------------------------------------------------------------------
# Print summary
# ---------------------------------------------------------------------

print(f"Surahs             : {surahs}")
print(f"Verse groups       : {ayah_groups}")
print(f"Verse numbers      : {verses}")
print(f"Introductions      : {introductions}")
print(f"Notes              : {notes}")
print(f"Search entries     : {search_entries}")

print()
print("Relationships")
print("-" * 13)

issues = 0

if surahs == 114:
    print("✓ Surahs == 114")
else:
    print(f"✗ Expected 114 surahs, found {surahs}")
    issues += 1

if verses == 6236:
    print("✓ Verse numbers == 6236")
else:
    print(f"✗ Expected 6236 verses, found {verses}")
    issues += 1

if introductions == 114:
    print("✓ Introductions == 114")
else:
    print(f"✗ Expected 114 introductions, found {introductions}")
    issues += 1

if ayah_groups == search_entries:
    print("✓ Verse groups == Search entries")
else:
    print(
        f"✗ Verse groups ({ayah_groups}) != Search entries ({search_entries})"
    )
    issues += 1

if notes == 521:
    print("✓ Notes == 521")
else:
    print(f"✗ Expected 521 notes, found {notes}")
    issues += 1

print()
print("=" * 70)

if issues:
    print(f"❌ DATASET SUMMARY FAILED ({issues} issue(s))")
    sys.exit(1)

print("✅ Dataset summary complete.")
sys.exit(0)