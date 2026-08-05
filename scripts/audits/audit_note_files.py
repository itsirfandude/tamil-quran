#!/usr/bin/env python3

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]

NOTES_DIR = ROOT / "public" / "data" / "notes"

print("=" * 70)
print("Note Files Audit")
print("=" * 70)
print()

issues = []

# ---------------------------------------------------------------------
# Collect note files
# ---------------------------------------------------------------------

files = sorted(
    NOTES_DIR.glob("*.json"),
    key=lambda p: int(p.stem),
)

if not files:
    print("No note files found.")
    sys.exit(1)

# Expected note numbers are derived from the filenames present.
expected = {int(f.stem) for f in files}
seen = set()

# ---------------------------------------------------------------------
# Validate every note
# ---------------------------------------------------------------------

for file in files:

    filename_number = int(file.stem)

    try:
        with file.open(encoding="utf-8") as f:
            note = json.load(f)

    except Exception as e:
        issues.append(f"[INVALID_JSON] {file.name} ({e})")
        continue

    if not isinstance(note, dict):
        issues.append(f"[INVALID_OBJECT] {file.name}")
        continue

    number = note.get("number")

    if number is None:
        issues.append(f"[MISSING_NUMBER] {file.name}")
        continue

    if number != filename_number:
        issues.append(
            f"[NUMBER_MISMATCH] file={filename_number} json={number}"
        )

    if number in seen:
        issues.append(f"[DUPLICATE_NUMBER] {number}")

    seen.add(number)

    title = note.get("title")

    if not isinstance(title, str) or not title.strip():
        issues.append(f"[EMPTY_TITLE] {number}")

    paragraphs = note.get("paragraphs")

    if not isinstance(paragraphs, list):
        issues.append(f"[INVALID_PARAGRAPHS] {number}")
        continue

    if len(paragraphs) == 0:
        issues.append(f"[EMPTY_PARAGRAPHS] {number}")
        continue

    for i, paragraph in enumerate(paragraphs, start=1):
        if not isinstance(paragraph, str):
            issues.append(
                f"[INVALID_PARAGRAPH] note={number} paragraph={i}"
            )
            continue

        if not paragraph.strip():
            issues.append(
                f"[EMPTY_PARAGRAPH] note={number} paragraph={i}"
            )

# ---------------------------------------------------------------------
# Missing note numbers
# ---------------------------------------------------------------------

missing = expected - seen

for number in sorted(missing):
    issues.append(f"[MISSING_NOTE] {number}")

# ---------------------------------------------------------------------
# Unexpected note numbers
# ---------------------------------------------------------------------

extra = seen - expected

for number in sorted(extra):
    issues.append(f"[UNEXPECTED_NOTE] {number}")

# ---------------------------------------------------------------------
# Report
# ---------------------------------------------------------------------

if issues:

    print("Issues found:\n")

    for issue in issues:
        print(issue)

    print()
    print("=" * 70)
    print(f"Total issues: {len(issues)}")
    print()
    print("❌ NOTE FILE AUDIT FAILED")
    sys.exit(1)

print(f"Note files   : {len(files)}")
print(f"Highest note : {max(seen)}")
print()
print("✅ All note files verified.")

sys.exit(0)