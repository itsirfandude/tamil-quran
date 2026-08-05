#!/usr/bin/env python3
"""
Validate every ¤123¤ marker inside generated Quran JSON.

Checks:

✓ Every marker refers to an existing note.
✓ Reports missing note ids.
✓ Reports unused notes.
"""

from pathlib import Path
import json
import re
import sys

ROOT = Path(__file__).resolve().parents[2]

SURAH_DIR = ROOT / "public" / "data" / "surah"
NOTES_DIR = ROOT / "public" / "data" / "notes"

MARKER = re.compile(r"¤(\d+)¤")


def walk_strings(obj):
    if isinstance(obj, str):
        yield obj
    elif isinstance(obj, list):
        for x in obj:
            yield from walk_strings(x)
    elif isinstance(obj, dict):
        for v in obj.values():
            yield from walk_strings(v)


# ---------------------------------------------------
# Load every note id
# ---------------------------------------------------

existing_notes = set()

for file in NOTES_DIR.glob("*.json"):
    try:
        existing_notes.add(int(file.stem))
    except ValueError:
        pass

# ---------------------------------------------------
# Scan markers
# ---------------------------------------------------

used_notes = set()
missing = []

for file in sorted(SURAH_DIR.glob("*.json")):

    data = json.loads(file.read_text(encoding="utf-8"))

    for text in walk_strings(data):

        for m in MARKER.finditer(text):

            note = int(m.group(1))
            used_notes.add(note)

            if note not in existing_notes:
                missing.append(
                    (
                        file.name,
                        note,
                        text[:180],
                    )
                )

print("=" * 70)
print("Footnote Marker Audit")
print("=" * 70)

if missing:

    print("\nMissing note references:\n")

    for file, note, snippet in missing:

        print(file)
        print(f"  Missing note {note}")
        print(f"  {snippet}")
        print()

else:

    print("✓ Every footnote marker points to an existing note.")

unused = sorted(existing_notes - used_notes)

print()

print(f"Existing notes : {len(existing_notes)}")
print(f"Referenced     : {len(used_notes)}")
print(f"Unused         : {len(unused)}")

if unused:

    print("\nUnused note ids:\n")

    for n in unused:
        print(f"  {n}")

print()

if missing:
    sys.exit(1)

sys.exit(0)