#!/usr/bin/env python3
"""Validate the static Al-Arba'in Nawawi dataset without modifying it."""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = ROOT / "public" / "data" / "hadith" / "arbaeen-nawawi"
COLLECTIONS_FILE = ROOT / "public" / "data" / "hadith" / "collections.json"
REPORT_FILE = ROOT / "scripts" / "hadith-pipeline" / "validation_report.json"
FOOTNOTE = re.compile(r"¤\d+¤")
CHROME = re.compile(r"(?:Copy|Favorite|Continue with Google|எதை நகலெடுக்க வேண்டும்)", re.I)


def non_empty_blocks(value: Any) -> bool:
    return isinstance(value, list) and bool(value) and all(isinstance(item, str) and item.strip() for item in value)


def main() -> int:
    errors: list[str] = []
    warnings: list[str] = []
    duplicate_references: dict[str, list[int]] = {}
    optional_missing: dict[str, list[int]] = {"grading": [], "chapter": [], "narrator": [], "cross_references": []}

    if not COLLECTIONS_FILE.exists():
        errors.append("missing public/data/hadith/collections.json")
        collections = []
    else:
        collections = json.loads(COLLECTIONS_FILE.read_text(encoding="utf-8"))
    if not isinstance(collections, list) or len(collections) != 1 or collections[0].get("slug") != "arbaeen-nawawi":
        errors.append("collections.json does not contain exactly the arbaeen-nawawi collection")

    index_file = DATA_DIR / "index.json"
    if not index_file.exists():
        errors.append("missing collection index.json")
        index = []
    else:
        index = json.loads(index_file.read_text(encoding="utf-8"))
    if not isinstance(index, list) or [item.get("number") for item in index] != list(range(1, 51)):
        errors.append("index numbers are not exactly 1–50 in order")

    files = sorted(DATA_DIR.glob("*.json"), key=lambda item: (item.name == "index.json", item.name)) if DATA_DIR.exists() else []
    record_files = [item for item in files if item.name != "index.json"]
    expected_names = {f"{number}.json" for number in range(1, 51)}
    actual_names = {item.name for item in record_files}
    if actual_names != expected_names:
        errors.append(f"record files differ from expected 1–50: missing={sorted(expected_names - actual_names)}, extra={sorted(actual_names - expected_names)}")

    for number in range(1, 51):
        file = DATA_DIR / f"{number}.json"
        if not file.exists():
            continue
        record = json.loads(file.read_text(encoding="utf-8"))
        if record.get("number") != number:
            errors.append(f"#{number}: record number mismatch")
        if record.get("collection_slug") != "arbaeen-nawawi":
            errors.append(f"#{number}: incorrect collection_slug")
        if not non_empty_blocks(record.get("tamil", {}).get("blocks")):
            errors.append(f"#{number}: missing Tamil blocks")
        if not non_empty_blocks(record.get("arabic", {}).get("text_blocks")):
            errors.append(f"#{number}: missing Arabic main blocks")
        if not isinstance(record.get("provenance", {}).get("source_url"), str) or not record["provenance"]["source_url"].startswith("https://tamil.quranandhadis.com/"):
            errors.append(f"#{number}: missing or invalid source URL")
        references = record.get("references")
        if not isinstance(references, list) or not references or not all(isinstance(item.get("label"), str) and item["label"].strip() for item in references if isinstance(item, dict)):
            errors.append(f"#{number}: missing source reference")
        for reference in references if isinstance(references, list) else []:
            label = reference.get("label") if isinstance(reference, dict) else None
            if isinstance(label, str):
                duplicate_references.setdefault(label, []).append(number)
        all_text = "\n".join(
            block
            for area in [record.get("tamil", {}), record.get("arabic", {}), record.get("source_context", {})]
            if isinstance(area, dict)
            for value in area.values()
            if isinstance(value, list)
            for block in value
            if isinstance(block, str)
        )
        if FOOTNOTE.search(all_text):
            errors.append(f"#{number}: unexpected Quran-style footnote marker")
        if CHROME.search(all_text):
            errors.append(f"#{number}: page chrome leaked into source blocks")
        context = record.get("source_context", {})
        if not record.get("grading"):
            optional_missing["grading"].append(number)
        if not context.get("chapter_blocks"):
            optional_missing["chapter"].append(number)
        if not context.get("narrator_blocks"):
            optional_missing["narrator"].append(number)
        if not context.get("cross_reference_blocks"):
            optional_missing["cross_references"].append(number)
        if number == 23:
            exception = record.get("known_source_exceptions", [])
            if not any("#23" in item for item in exception if isinstance(item, str)):
                errors.append("#23: known membership exception is not documented")
        elif "source_membership_label" not in record:
            errors.append(f"#{number}: missing linked-record collection membership label")

    duplicates = {label: numbers for label, numbers in duplicate_references.items() if len(numbers) > 1}
    for label, numbers in duplicates.items():
        warnings.append(f"duplicate source reference label retained: {label} in records {numbers}")

    report = {
        "records_expected": 50,
        "record_files_found": len(record_files),
        "errors": errors,
        "warnings": warnings,
        "optional_metadata_missing": optional_missing,
        "duplicate_source_references": duplicates,
        "known_exception": "#23 membership comes from collection page because muslim-381 lacks the expected collection marker.",
    }
    REPORT_FILE.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(report, ensure_ascii=False, indent=2))
    return 1 if errors else 0


if __name__ == "__main__":
    sys.exit(main())
