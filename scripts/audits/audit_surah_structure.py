#!/usr/bin/env python3
"""
Audit the structural integrity of every generated Surah JSON.

Checks:

✓ Exactly 114 Surah files exist
✓ Filename matches Surah number
✓ Surah number is 1..114
✓ Required fields exist
✓ Introduction exists
✓ Ayah groups exist
✓ Verse numbers are valid
✓ No duplicate verses
✓ Verse ordering is increasing

Exit code:
0 = PASS
1 = FAIL
"""

from pathlib import Path
import json
import sys

ROOT = Path(__file__).resolve().parents[2]
SURAH_DIR = ROOT / "public" / "data" / "surah"

issues = []


print("=" * 70)
print("Surah Structure Audit")
print("=" * 70)
print()

# -------------------------------------------------------
# Check directory
# -------------------------------------------------------

if not SURAH_DIR.exists():
    print("❌ Surah directory not found")
    sys.exit(1)

files = sorted(
    SURAH_DIR.glob("*.json"),
    key=lambda p: int(p.stem)
)

if len(files) != 114:
    issues.append(
        (
            "GLOBAL",
            f"Expected 114 Surah files, found {len(files)}",
        )
    )

expected = 1

for file in files:

    try:
        number = int(file.stem)
    except ValueError:
        issues.append(
            (
                file.name,
                "Filename is not numeric",
            )
        )
        continue

    if number != expected:
        issues.append(
            (
                file.name,
                f"Expected filename {expected}.json",
            )
        )

    expected += 1

    try:
        data = json.loads(
            file.read_text(encoding="utf-8")
        )
    except Exception as e:
        issues.append(
            (
                file.name,
                f"Invalid JSON ({e})",
            )
        )
        continue

    # -------------------------------------------------------
    # Required fields
    # -------------------------------------------------------

    required = [
        "number",
        "name_tamil",
        "stated_total_verses",
        "introduction",
        "ayah_groups",
]

    for field in required:

        if field not in data:

            issues.append(
                (
                    file.name,
                    f"Missing field '{field}'",
                )
            )

    if data.get("number") != number:

        issues.append(
            (
                file.name,
                f"number={data.get('number')} filename={number}",
            )
        )

    intro = data.get("introduction")

    if not isinstance(intro, dict):

        issues.append(
        (
            file.name,
            "Introduction is not an object",
        )
    )

    else:

        if (
        not isinstance(intro.get("name_meaning"), str)
        or not intro["name_meaning"].strip()
    ):
            issues.append(
            (
                file.name,
                "Missing introduction name_meaning",
            )
        )

    paragraphs = intro.get("paragraphs")

    if not isinstance(paragraphs, list) or not paragraphs:
        issues.append(
            (
                file.name,
                "Introduction paragraphs missing",
            )
        )

    ayah_groups = data.get("ayah_groups")

    if not isinstance(ayah_groups, list):

        issues.append(
            (
                file.name,
                "ayah_groups is not a list",
            )
        )
        continue

    if not ayah_groups:

        issues.append(
            (
                file.name,
                "ayah_groups is empty",
            )
        )
        continue

 
    # -------------------------------------------------------
    # Validate every ayah group
    # -------------------------------------------------------

    seen_verses = set()
    previous = 0

    for index, group in enumerate(ayah_groups, start=1):

        if not isinstance(group, dict):
            issues.append(
                (
                    file.name,
                    f"Ayah group {index} is not an object",
                )
            )
            continue

        if "verses" not in group:
            issues.append(
                (
                    file.name,
                    f"Ayah group {index} missing 'verses'",
                )
            )
            continue

        verses = group["verses"]

        if not isinstance(verses, list):
            issues.append(
                (
                    file.name,
                    f"Ayah group {index} verses is not a list",
                )
            )
            continue

        if not verses:
            issues.append(
                (
                    file.name,
                    f"Ayah group {index} has no verses",
                )
            )
            continue

        # Every verse number must be an integer
        for verse in verses:

            if not isinstance(verse, int):
                issues.append(
                    (
                        file.name,
                        f"Ayah group {index} contains non-integer verse",
                    )
                )
                continue

            # Duplicate verse
            if verse in seen_verses:
                issues.append(
                    (
                        file.name,
                        f"Duplicate verse {verse}",
                    )
                )

            seen_verses.add(verse)

            # Strictly increasing globally
            if verse <= previous:
                issues.append(
                    (
                        file.name,
                        f"Verse ordering error ({previous} -> {verse})",
                    )
                )

            previous = verse

        # Clubbed verses must themselves be sequential
        if len(verses) > 1:

            for a, b in zip(verses, verses[1:]):

                if b != a + 1:
                    issues.append(
                        (
                            file.name,
                            f"Non-contiguous clubbed verses {verses}",
                        )
                    )

        # ---------------------------------------------------
        # Validate Tamil text
        # ---------------------------------------------------

        tamil = group.get("tamil")

        if not isinstance(tamil, str):
            issues.append(
                (
                    file.name,
                    f"Ayah group {index} missing Tamil text",
                )
            )

        elif not tamil.strip():
            issues.append(
                (
                    file.name,
                    f"Ayah group {index} empty Tamil text",
                )
            )

        # ---------------------------------------------------
        # Validate Arabic text
        # ---------------------------------------------------

        arabic = group.get("arabic")

        if not isinstance(arabic, str):
            issues.append(
                (
                    file.name,
                    f"Ayah group {index} missing Arabic text",
                )
            )

        elif not arabic.strip():
            issues.append(
                (
                    file.name,
                    f"Ayah group {index} empty Arabic text",
                )
            )

    # -------------------------------------------------------
    # Ensure verses are continuous
    # -------------------------------------------------------

    if seen_verses:

        expected_verses = set(range(1, max(seen_verses) + 1))

        missing = sorted(expected_verses - seen_verses)

        if missing:
            issues.append(
                (
                    file.name,
                    f"Missing verses: {missing[:10]}{'...' if len(missing) > 10 else ''}",
                )
            )

        actual_total = max(seen_verses)

        if actual_total != data.get("stated_total_verses"):
            issues.append(
        (
            file.name,
            f"stated_total_verses={data.get('stated_total_verses')} actual={actual_total}",
        )
    )
   

    # -------------------------------------------------------
    # Optional sanity checks
    # -------------------------------------------------------

    first_group = ayah_groups[0]
    first_verse = first_group["verses"][0]

    if first_verse != 1:
        issues.append(
            (
                file.name,
                "First verse is not 1",
            )
        )

# =======================================================
# Report
# =======================================================

print()

if not issues:
    print("✅ Dataset structure verified.")
    print()
    print(f"Surahs checked : {len(files)}")
    print("Problems found : 0")
    sys.exit(0)

current_file = None

print("Issues found:\n")

for file, message in issues:

    if file != current_file:
        current_file = file
        print(file)

    print(f"  • {message}")

print()
print("=" * 70)
print(f"Total issues : {len(issues)}")

sys.exit(1)