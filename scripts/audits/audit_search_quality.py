#!/usr/bin/env python3

import json
import re
import sys
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]

SEARCH_INDEX = ROOT / "public" / "data" / "search-index.json"

print("=" * 70)
print("Search Quality Audit")
print("=" * 70)
print()

with SEARCH_INDEX.open(encoding="utf-8") as f:
    entries = json.load(f)

errors = []
warnings = []

seen = set()
duplicates = []

# Legitimately short translations (Muqatta'at)
allowed_short = {
    (20, (1,)),  # طه
    (36, (1,)),  # يس
    (38, (1,)),  # ص
    (50, (1,)),  # ق
    (68, (1,)),  # ن
}

for entry in entries:

    key = (
        entry["surah"],
        tuple(entry["verses"]),
    )

    if key in seen:
        duplicates.append(key)

    seen.add(key)

    tamil = entry.get("tamil", "")

    # ------------------------------------------------------------------
    # Critical errors
    # ------------------------------------------------------------------

    if not tamil.strip():
        errors.append(
            f"[EMPTY] Surah {entry['surah']} verses {entry['verses']}"
        )
        continue

    if (
        len(tamil.strip()) < 8
        and key not in allowed_short
    ):
        warnings.append(
            f"[VERY_SHORT] Surah {entry['surah']} verses {entry['verses']}"
        )

    if re.search(r"¤\d+¤", tamil):
        errors.append(
            f"[LEAKED_MARKER] Surah {entry['surah']} verses {entry['verses']}"
        )

    if re.search(r";\d+", tamil):
        errors.append(
            f"[SEMICOLON_NUMBER] Surah {entry['surah']} verses {entry['verses']}"
        )

    # ------------------------------------------------------------------
    # Cosmetic warnings
    # ------------------------------------------------------------------

    if tamil != tamil.strip():
        warnings.append(
            f"[WHITESPACE] Surah {entry['surah']} verses {entry['verses']}"
        )

    if "  " in tamil:
        warnings.append(
            f"[DOUBLE_SPACE] Surah {entry['surah']} verses {entry['verses']}"
        )

    if re.search(r" {3,}", tamil):
        warnings.append(
            f"[EXCESSIVE_SPACES] Surah {entry['surah']} verses {entry['verses']}"
        )

    if "\n" in tamil or "\r" in tamil:
        warnings.append(
            f"[NEWLINE] Surah {entry['surah']} verses {entry['verses']}"
        )

for surah, verses in duplicates:
    errors.append(
        f"[DUPLICATE] Surah {surah} verses {list(verses)}"
    )

counter = Counter(e["surah"] for e in entries)

print("Entries per surah\n")

for s in sorted(counter):
    print(f"{s:>3} : {counter[s]}")

print()

if warnings:
    print("Warnings:\n")
    for warning in warnings:
        print(warning)
    print()

if errors:
    print("Critical issues:\n")
    for error in errors:
        print(error)

    print()
    print("=" * 70)
    print(f"Critical issues : {len(errors)}")
    print("❌ SEARCH QUALITY FAILED")
    sys.exit(1)

print("=" * 70)

if warnings:
    print(f"⚠ Search quality completed with {len(warnings)} warning(s).")
else:
    print("✅ Search quality looks good.")

sys.exit(0)