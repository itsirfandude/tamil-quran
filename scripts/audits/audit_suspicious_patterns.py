#!/usr/bin/env python3
"""
Audit generated Quran JSON for suspicious text patterns.

Checks for:

- semicolon footnote bugs (e.g. ;488)
- broken verse references (e.g. 24;43)
- replacement characters (�)
- zero-width Unicode characters
- double punctuation (;; or ::)
"""

from pathlib import Path
import json
import re
import sys

ROOT = Path(__file__).resolve().parents[2]
SURAH_DIR = ROOT / "public" / "data" / "surah"

SEMICOLON_NUMBER = re.compile(r";\d+")
BROKEN_VERSE_REFERENCE = re.compile(r"\b\d+;\d+\b")
DOUBLE_PUNCT = re.compile(r";;|::")
BROKEN_CHAR = "\ufffd"

ZERO_WIDTH = [
    "\u200b",  # Zero Width Space
    "\u200c",  # Zero Width Non-Joiner
    "\u200d",  # Zero Width Joiner
    "\ufeff",  # BOM
]


def walk_strings(obj):
    """Yield every string found anywhere inside a nested JSON object."""
    if isinstance(obj, str):
        yield obj
    elif isinstance(obj, list):
        for item in obj:
            yield from walk_strings(item)
    elif isinstance(obj, dict):
        for value in obj.values():
            yield from walk_strings(value)


issues = []

for file in sorted(SURAH_DIR.glob("*.json")):
    data = json.loads(file.read_text(encoding="utf-8"))

    for text in walk_strings(data):

        m = SEMICOLON_NUMBER.search(text)
        if m:
            issues.append(
                (
                    file.name,
                    "SEMICOLON_NUMBER",
                    m.group(),
                    text[:180],
                )
            )

        m = BROKEN_VERSE_REFERENCE.search(text)
        if m:
            issues.append(
                (
                    file.name,
                    "BROKEN_VERSE_REFERENCE",
                    m.group(),
                    text[:180],
                )
            )

        m = DOUBLE_PUNCT.search(text)
        if m:
            issues.append(
                (
                    file.name,
                    "DOUBLE_PUNCT",
                    m.group(),
                    text[:180],
                )
            )

        if BROKEN_CHAR in text:
            issues.append(
                (
                    file.name,
                    "REPLACEMENT_CHARACTER",
                    "�",
                    text[:180],
                )
            )

        for ch in ZERO_WIDTH:
            if ch in text:
                issues.append(
                    (
                        file.name,
                        "ZERO_WIDTH_CHARACTER",
                        f"U+{ord(ch):04X}",
                        text[:180],
                    )
                )

print("=" * 70)
print("Suspicious Pattern Audit")
print("=" * 70)

if not issues:
    print("✅ No suspicious patterns found.")
    sys.exit(0)

current_file = None

for file, kind, match, snippet in issues:

    if file != current_file:
        current_file = file
        print()
        print(file)

    print(f"  [{kind}] {match}")
    print(f"    {snippet}")

print()
print("=" * 70)
print(f"Total issues: {len(issues)}")

sys.exit(1)