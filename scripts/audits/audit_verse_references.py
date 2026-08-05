#!/usr/bin/env python3

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = ROOT / "public" / "data" / "surah"

COLON_REF = re.compile(r"\b(\d{1,3}):(\d{1,3})\b")
SEMICOLON_REF = re.compile(r"\b(\d{1,3});(\d{1,3})\b")

print("=" * 70)
print("Verse Reference Audit")
print("=" * 70)
print()

files = sorted(DATA_DIR.glob("*.json"), key=lambda p: int(p.stem))

valid_verses = {}

# ----------------------------------------------------------------------
# Build valid Surah -> Verse lookup
# ----------------------------------------------------------------------

for file in files:
    with file.open("r", encoding="utf-8") as f:
        data = json.load(f)

    verses = set()

    for group in data.get("ayah_groups", []):
        for verse in group.get("verses", []):
            verses.add(verse)

    valid_verses[data["number"]] = verses

issues = 0


def walk(value, filename):
    global issues

    if isinstance(value, dict):
        for v in value.values():
            walk(v, filename)
        return

    if isinstance(value, list):
        for item in value:
            walk(item, filename)
        return

    if not isinstance(value, str):
        return

    # --------------------------------------------------------------
    # Semicolon references
    # --------------------------------------------------------------

    for match in SEMICOLON_REF.finditer(value):
        print(filename)
        print(f"  [SEMICOLON_REFERENCE] {match.group(0)}")
        issues += 1

    # --------------------------------------------------------------
    # Colon references
    # --------------------------------------------------------------

    for match in COLON_REF.finditer(value):

        surah = int(match.group(1))
        verse = int(match.group(2))

        if surah not in valid_verses:
            print(filename)
            print(f"  [INVALID_REFERENCE] {match.group(0)}")
            issues += 1
            continue

        if verse not in valid_verses[surah]:
            print(filename)
            print(f"  [INVALID_REFERENCE] {match.group(0)}")
            issues += 1


# ----------------------------------------------------------------------
# Scan every file
# ----------------------------------------------------------------------

for file in files:

    with file.open("r", encoding="utf-8") as f:
        data = json.load(f)

    walk(data, file.name)

print()
print("=" * 70)
print(f"Total issues: {issues}")
print()

if issues:
    print("❌ VERSE REFERENCE AUDIT FAILED")
    sys.exit(1)

print("✅ All verse references are valid.")
sys.exit(0)