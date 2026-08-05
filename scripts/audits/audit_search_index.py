#!/usr/bin/env python3

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]

SURAH_DIR = ROOT / "public" / "data" / "surah"
SEARCH_INDEX = ROOT / "public" / "data" / "search-index.json"

print("=" * 70)
print("Search Index Audit")
print("=" * 70)
print()

with SEARCH_INDEX.open(encoding="utf-8") as f:
    index = json.load(f)

issues = []

# --------------------------------------------------------
# Build expected verse groups
# --------------------------------------------------------

expected = set()

for file in sorted(SURAH_DIR.glob("*.json"), key=lambda p: int(p.stem)):
    with file.open(encoding="utf-8") as f:
        surah = json.load(f)

    for group in surah["ayah_groups"]:
        expected.add(
            (
                surah["number"],
                tuple(group["verses"]),
            )
        )

# --------------------------------------------------------
# Scan search index
# --------------------------------------------------------

seen = set()

for entry in index:

    if "surah" not in entry:
        issues.append("[MISSING_SURAH]")
        continue

    if "verses" not in entry:
        issues.append(f"[MISSING_VERSES] Surah {entry.get('surah')}")
        continue

    if "tamil" not in entry:
        issues.append(
            f"[MISSING_TAMIL] Surah {entry['surah']} verses {entry['verses']}"
        )
        continue

    if not entry["tamil"].strip():
        issues.append(
            f"[EMPTY_TEXT] Surah {entry['surah']} verses {entry['verses']}"
        )

    key = (
        entry["surah"],
        tuple(entry["verses"]),
    )

    if key in seen:
        issues.append(
            f"[DUPLICATE] Surah {entry['surah']} verses {entry['verses']}"
        )

    seen.add(key)

# --------------------------------------------------------
# Missing entries
# --------------------------------------------------------

for missing in sorted(expected - seen):
    issues.append(
        f"[MISSING] Surah {missing[0]} verses {list(missing[1])}"
    )

# --------------------------------------------------------
# Unexpected entries
# --------------------------------------------------------

for extra in sorted(seen - expected):
    issues.append(
        f"[EXTRA] Surah {extra[0]} verses {list(extra[1])}"
    )

# --------------------------------------------------------
# Report
# --------------------------------------------------------

if issues:
    print("Issues found:\n")

    for issue in issues:
        print(issue)

    print()
    print("=" * 70)
    print(f"Total issues: {len(issues)}")
    print()
    print("❌ SEARCH INDEX AUDIT FAILED")
    sys.exit(1)

print(f"Search entries : {len(index)}")
print(f"Expected groups: {len(expected)}")
print()
print("✅ Search index verified.")

sys.exit(0)