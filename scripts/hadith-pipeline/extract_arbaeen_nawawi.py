#!/usr/bin/env python3
"""Extract the reviewed Al-Arba'in Nawawi source manifest into static JSON.

The collection page establishes the 1–50 membership and the complete visible
reference list. Each record below deliberately selects one of those references
as the canonical content source. No URLs are discovered or inferred.
"""

from __future__ import annotations

import argparse
import json
import re
import ssl
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from urllib.request import Request, urlopen

import certifi
from bs4 import BeautifulSoup, Tag


ROOT = Path(__file__).resolve().parents[2]
OUTPUT_DIR = ROOT / "public" / "data" / "hadith" / "arbaeen-nawawi"
COLLECTIONS_FILE = ROOT / "public" / "data" / "hadith" / "collections.json"
REPORT_FILE = ROOT / "scripts" / "hadith-pipeline" / "extraction_report.json"
COLLECTION_URL = (
    "https://tamil.quranandhadis.com/"
    "%E0%AE%85%E0%AE%B2%E0%AF%8D%E0%AE%85%E0%AE%B0%E0%AF%8D%E0%AE%AA%E0%AE%88%E0%AE%A9%E0%AF%8D-"
    "%E0%AE%A8%E0%AE%B5%E0%AE%B5%E0%AF%80/"
)

# Each entry is transcribed from the confirmed collection-page inventory.
# `primary` is only a source choice; `references` retains every visible
# collection-page reference in source order without merging them.
MANIFEST: list[dict[str, Any]] = [
    {"number": 1, "primary": "bukhari-1", "secondary": ["muslim-3868"], "references": ["புகாரி-1", "முஸ்லிம்-3868"]},
    {"number": 2, "primary": "muslim-1", "references": ["முஸ்லிம்-1"]},
    {"number": 3, "primary": "muslim-21", "reference_slugs": ["bukhari-8", "muslim-21"], "references": ["புகாரி-8", "முஸ்லிம்-21"]},
    {"number": 4, "primary": "bukhari-6594", "reference_slugs": ["muslim-5145", "bukhari-6594"], "references": ["முஸ்லிம்-5145", "புகாரி-6594"]},
    {"number": 5, "primary": "bukhari-2697", "reference_slugs": ["muslim-3540", "muslim-3541", "bukhari-2697"], "references": ["முஸ்லிம்-3540", "3541", "புகாரி-2697"]},
    {"number": 6, "primary": "muslim-3259", "references": ["முஸ்லிம்-3259"]},
    {"number": 7, "primary": "muslim-95", "references": ["முஸ்லிம்-95"]},
    {"number": 8, "primary": "bukhari-25", "references": ["புகாரி-25"]},
    {"number": 9, "primary": "muslim-4702", "references": ["முஸ்லிம்-4702"]},
    {"number": 10, "primary": "muslim-1844", "references": ["முஸ்லிம்-1844"]},
    {"number": 11, "primary": "tirmidhi-2518", "references": ["திர்மிதீ-2518"]},
    {"number": 12, "primary": "tirmidhi-2317", "references": ["திர்மிதீ-2317"], "status": "பலவீனமானது"},
    {"number": 13, "primary": "bukhari-13", "references": ["புகாரி-13"]},
    {"number": 14, "primary": "muslim-3463", "references": ["முஸ்லிம்-3463"]},
    {"number": 15, "primary": "bukhari-6475", "references": ["புகாரி-6475"]},
    {"number": 16, "primary": "bukhari-6116", "references": ["புகாரி-6116"]},
    {"number": 17, "primary": "muslim-3955", "references": ["முஸ்லிம்-3955"]},
    {"number": 18, "primary": "tirmidhi-1987", "references": ["திர்மிதீ-1987"], "status": "ஆய்வில்"},
    {"number": 19, "primary": "tirmidhi-2516", "references": ["திர்மிதீ-2516"]},
    {"number": 20, "primary": "bukhari-6120", "references": ["புகாரி-6120"]},
    {"number": 21, "primary": "muslim-62", "references": ["முஸ்லிம்-62"]},
    {"number": 22, "primary": "muslim-18", "references": ["முஸ்லிம்-18"]},
    {"number": 23, "primary": "muslim-381", "references": ["முஸ்லிம்-381"], "known_membership_exception": True},
    {"number": 24, "primary": "muslim-5033", "references": ["முஸ்லிம்-5033"]},
    {"number": 25, "primary": "muslim-1832", "references": ["முஸ்லிம்-1832"]},
    {"number": 26, "primary": "bukhari-2989", "references": ["புகாரி-2989"]},
    {"number": 27, "primary": "muslim-4992", "references": ["முஸ்லிம்-4992"]},
    {"number": 28, "primary": "musnad-ahmad-17142", "references": ["அஹ்மத்-17142"]},
    {"number": 29, "primary": "tirmidhi-2616", "references": ["திர்மிதீ-2616"], "status": "ஆய்வில்"},
    {"number": 30, "primary": "daraqutni-4396", "references": ["தாரகுத்னீ-4396"], "status": "ஆய்வில்"},
    {"number": 31, "primary": "ibn-majah-4102", "references": ["இப்னு மாஜா-4102"], "status": "ஆய்வில்"},
    {"number": 32, "primary": "daraqutni-3079", "references": ["தாரகுத்னீ-3079"], "status": "ஆய்வில்"},
    {"number": 33, "primary": "muslim-3524", "references": ["முஸ்லிம்-3524"]},
    {"number": 34, "primary": "muslim-78", "references": ["முஸ்லிம்-78"]},
    {"number": 35, "primary": "muslim-5010", "references": ["முஸ்லிம்-5010"]},
    {"number": 36, "primary": "muslim-5231", "references": ["முஸ்லிம்-5231"]},
    {"number": 37, "primary": "bukhari-6491", "references": ["புகாரி-6491"]},
    {"number": 38, "primary": "bukhari-6502", "references": ["புகாரி-6502"]},
    {"number": 39, "primary": "ibn-majah-2045", "references": ["இப்னு மாஜா-2045"], "status": "ஆய்வில்"},
    {"number": 40, "primary": "musnad-ahmad-6156", "references": ["அஹ்மத்-6156"]},
    {"number": 41, "primary": "tarikh-baghdad-1609", "references": ["தாரீகு பஃக்தாத்-1609"], "status": "பலவீனமானது"},
    {"number": 42, "primary": "tirmidhi-3540", "references": ["திர்மிதீ-3540"]},
    {"number": 43, "primary": "bukhari-6732", "references": ["புகாரி-6732"]},
    {"number": 44, "primary": "bukhari-2646", "references": ["புகாரி-2646"]},
    {"number": 45, "primary": "bukhari-2236", "references": ["புகாரி-2236"]},
    {"number": 46, "primary": "bukhari-4342", "references": ["புகாரி-4342"]},
    {"number": 47, "primary": "musnad-ahmad-17186", "references": ["அஹ்மத்-17186"]},
    {"number": 48, "primary": "bukhari-34", "references": ["புகாரி-34"]},
    {"number": 49, "primary": "tirmidhi-2344", "references": ["திர்மிதீ-2344"]},
    {"number": 50, "primary": "musnad-ahmad-17680", "references": ["அஹ்மத்-17680"]},
]


def fetch(url: str) -> str:
    request = Request(url, headers={"User-Agent": "quran-app-hadith-pipeline/1.0"})
    # The system Python certificate store in this environment is incomplete;
    # certifi supplies the standard public CA bundle without disabling TLS
    # verification.
    context = ssl.create_default_context(cafile=certifi.where())
    with urlopen(request, timeout=45, context=context) as response:
        return response.read().decode("utf-8")


def clean_text(node: Tag) -> str:
    text = node.get_text("\n", strip=True).replace("\xa0", " ")
    return re.sub(r"[ \t]+", " ", text).strip()


def blocks(node: Tag | None) -> list[str]:
    if node is None:
        return []
    found = [clean_text(item) for item in node.find_all(["p", "li"], recursive=True)]
    return [item for item in found if item]


def direct_blocks(node: Tag | None) -> list[str]:
    if node is None:
        return []
    found = [clean_text(item) for item in node.find_all(["p", "li"], recursive=False)]
    return [item for item in found if item]


def source_url(slug: str) -> str:
    return f"https://tamil.quranandhadis.com/{slug}/"


def parse_record(entry: dict[str, Any], html: str, retrieved_at: str) -> dict[str, Any]:
    soup = BeautifulSoup(html, "html.parser")
    main = soup.select_one("#main-content.entry-content")
    if main is None:
        raise ValueError("source main-content container missing")

    tamil_area = main.select_one("#tamil-copy-area")
    tamil_all = blocks(tamil_area)
    if not tamil_all:
        raise ValueError("Tamil content container missing or empty")

    chapter_blocks = [
        block for block in tamil_all if re.match(r"^(அத்தியாயம்|பாடம்|Book)\s*:", block)
    ]
    narrator_blocks = [block for block in tamil_all if block.startswith("அறிவிப்பவர்:")]
    tamil_content = [
        block for block in tamil_all if block not in chapter_blocks and block not in narrator_blocks
    ]

    arabic = main.select_one("#hadis_content_id")
    arabic_chapter = blocks(arabic.select_one(".hadis_baab") if arabic else None)
    arabic_isnad = blocks(arabic.select_one(".hadis_ravi") if arabic else None)
    arabic_main = blocks(arabic.select_one(".hadis_main") if arabic else None)
    arabic_footnotes = blocks(arabic.select_one(".hadis_footnote") if arabic else None)
    if not arabic_main:
        raise ValueError("Arabic main content container missing or empty")

    quality = main.select_one("#quality-copy-area")
    grading_blocks = blocks(quality)
    reference_area = main.select_one("#hadis-ref-area")
    source_reference_blocks = blocks(reference_area)
    if reference_area is not None and not source_reference_blocks:
        source_reference_blocks = [clean_text(reference_area)]
    if not source_reference_blocks:
        raise ValueError("source reference area missing or empty")

    more_info = main.select_one(".setfontbyjs")
    additional: list[str] = []
    cross_references: list[str] = []
    membership_label: str | None = None
    for block in direct_blocks(more_info):
        if "அல்அர்பஈன்" in block and "எண்-" in block:
            membership_label = block
            continue
        if "பார்க்க:" in block or "மேலும் பார்க்க:" in block or "இதனுடன் தொடர்புடைய" in block:
            cross_references.append(block)
        elif block and not block.startswith("Favorite"):
            additional.append(block)

    expected_label = f"எண்-{entry['number']}"
    if membership_label is None:
        membership_node = main.find(string=re.compile(re.escape(expected_label)))
        if membership_node is not None:
            membership_label = clean_text(membership_node.parent)
    membership_exception = bool(entry.get("known_membership_exception"))
    if not membership_exception and (membership_label is None or expected_label not in membership_label):
        raise ValueError(f"collection membership marker {expected_label} missing")

    reference_slugs = entry.get("reference_slugs", [entry["primary"], *entry.get("secondary", [])])
    references = [
        {"label": label, "url": source_url(slug)}
        for label, slug in zip(entry["references"], reference_slugs, strict=True)
    ]
    record: dict[str, Any] = {
        "collection_slug": "arbaeen-nawawi",
        "number": entry["number"],
        "references": references,
        "primary_source_reference": source_reference_blocks[0],
        "tamil": {"blocks": tamil_content},
        "arabic": {
            "text_blocks": arabic_main,
        },
        "source_context": {
            "chapter_blocks": chapter_blocks,
            "narrator_blocks": narrator_blocks,
            "source_reference_blocks": source_reference_blocks,
            "additional_note_blocks": additional,
            "cross_reference_blocks": cross_references,
        },
        "provenance": {
            "source_url": source_url(entry["primary"]),
            "collection_url": COLLECTION_URL,
            "retrieved_at": retrieved_at,
        },
    }
    if arabic_chapter:
        record["arabic"]["chapter_blocks"] = arabic_chapter
    if arabic_isnad:
        record["arabic"]["isnad_blocks"] = arabic_isnad
    if arabic_footnotes:
        record["arabic"]["footnote_blocks"] = arabic_footnotes
    if grading_blocks:
        record["grading"] = {"raw_blocks": grading_blocks, "source": "linked-record"}
    if entry.get("status"):
        record["collection_page_status"] = entry["status"]
    if membership_label:
        record["source_membership_label"] = membership_label
    if membership_exception:
        record["known_source_exceptions"] = [
            "The collection page establishes #23 membership; its linked source record lacks the expected எண்-23 marker."
        ]
    return record


def collection_metadata(retrieved_at: str) -> list[dict[str, Any]]:
    return [{
        "slug": "arbaeen-nawawi",
        "title": {"latin": "Al-Arba'in Nawawi", "tamil": "அல்அர்பஈன் நவவீ"},
        "stated_description": "இமாம் அவர்கள் தொகுத்துள்ள அல்அர்பஈன் எனும் 42 முக்கிய ஹதீஸ்கள். இத்துடன் இப்னு ரஜப் அவர்கள் தனது ஜாமிஉல் உலூமி வல்ஹிகம் எனும் நூலில் இணைத்துள்ள 8 ஹதீஸ்கள் சேர்த்து 50 ஹதீஸ்களின் தொகுப்பு:",
        "stated_total": 50,
        "source": {
            "url": COLLECTION_URL,
            "attribution": "Tamil Hadis Browser; collection page by Abdul Hakkim",
            "retrieved_at": retrieved_at,
            "copyright_notice": "Copyright 2026 Tamil Hadis Browser",
        },
    }]


def build_index(records: list[dict[str, Any]]) -> list[dict[str, Any]]:
    items = []
    for record in records:
        item: dict[str, Any] = {
            "number": record["number"],
            "primary_reference": record["primary_source_reference"],
            "source_url": record["provenance"]["source_url"],
        }
        if record.get("collection_page_status"):
            item["collection_page_status"] = record["collection_page_status"]
        if record.get("grading"):
            item["grading"] = record["grading"]
        items.append(item)
    return items


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true", help="Fetch and inspect without writing dataset files")
    args = parser.parse_args()
    retrieved_at = datetime.now(timezone.utc).replace(microsecond=0).isoformat()
    records: list[dict[str, Any]] = []
    failures: list[dict[str, Any]] = []

    for entry in MANIFEST:
        try:
            records.append(parse_record(entry, fetch(source_url(entry["primary"])), retrieved_at))
        except Exception as exc:
            failures.append({"number": entry["number"], "source_url": source_url(entry["primary"]), "error": str(exc)})

    summary = {
        "retrieved_at": retrieved_at,
        "records_requested": len(MANIFEST),
        "records_extracted": len(records),
        "failures": failures,
        "representative_records": [
            {
                "number": record["number"],
                "tamil_blocks": len(record["tamil"]["blocks"]),
                "arabic_main_blocks": len(record["arabic"]["text_blocks"]),
                "source_url": record["provenance"]["source_url"],
            }
            for record in records if record["number"] in {1, 10, 23, 42, 50}
        ],
    }
    print(json.dumps(summary, ensure_ascii=False, indent=2))
    if failures:
        return 1
    if args.dry_run:
        return 0

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    COLLECTIONS_FILE.parent.mkdir(parents=True, exist_ok=True)
    COLLECTIONS_FILE.write_text(json.dumps(collection_metadata(retrieved_at), ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    (OUTPUT_DIR / "index.json").write_text(json.dumps(build_index(records), ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    for record in records:
        (OUTPUT_DIR / f"{record['number']}.json").write_text(json.dumps(record, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    REPORT_FILE.write_text(json.dumps(summary, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return 0


if __name__ == "__main__":
    sys.exit(main())
