#!/usr/bin/env python3
"""Read-only V1 content integrity audit.

This checks the published JSON dataset against its generated indexes. It
intentionally has no external dependencies and exits non-zero on integrity
errors.
"""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[2]
DATA = ROOT / "public" / "data"
SOURCE = ROOT / "scripts" / "data-pipeline" / "extracted.md"

REFERENCE_RE = re.compile(r"^(\d{1,3}):(\d{1,3})(?:-(\d{1,3}))?$")
FOOTNOTE_RE = re.compile(r"¤(\d+)¤")


def read_json(relative: str) -> Any:
    with (ROOT / relative).open(encoding="utf-8") as handle:
        return json.load(handle)


def non_empty(value: Any) -> bool:
    return isinstance(value, str) and bool(value.strip())


def add_error(errors: list[str], area: str, message: str) -> None:
    errors.append(f"{area}: {message}")


def iter_numbers(count: int) -> range:
    return range(1, count + 1)


def validate_reference(
    reference: str,
    all_ayahs: set[str],
    errors: list[str],
    context: str,
) -> None:
    match = REFERENCE_RE.fullmatch(reference)
    if not match:
        add_error(errors, "TOPICS", f"{context}: malformed Quran reference {reference!r}")
        return

    surah = int(match.group(1))
    start = int(match.group(2))
    end = int(match.group(3) or start)
    if end < start:
        add_error(errors, "TOPICS", f"{context}: descending Quran range {reference}")
        return

    missing = [f"{surah}:{ayah}" for ayah in range(start, end + 1) if f"{surah}:{ayah}" not in all_ayahs]
    if not missing:
        return

    add_error(
        errors,
        "TOPICS",
        f"{context}: reference {reference} points to missing {', '.join(missing)}",
    )


def main() -> int:
    errors: list[str] = []
    warnings: list[str] = []
    index = read_json("public/data/index.json")
    notes_index = read_json("public/data/notes-index.json")
    topics = read_json("public/data/topics.json")
    topic_map = read_json("public/data/topic_content_map.json")
    topic_content = read_json("public/data/topic_content.json")
    search_index = read_json("public/data/search-index.json")

    all_ayahs: set[str] = set()
    surah_count = 0
    ayah_count = 0
    footnote_reference_count = 0
    footnote_array_reference_count = 0

    if not isinstance(index, list) or len(index) != 114:
        add_error(errors, "SURAH", f"index.json expected 114 entries, found {len(index) if isinstance(index, list) else 'non-array'}")

    index_numbers: set[int] = set()
    for meta in index if isinstance(index, list) else []:
        number = meta.get("number") if isinstance(meta, dict) else None
        if not isinstance(number, int):
            add_error(errors, "SURAH", "index entry has malformed number")
            continue
        if number in index_numbers:
            add_error(errors, "SURAH", f"duplicate index number {number}")
        index_numbers.add(number)
        file = DATA / "surah" / f"{number}.json"
        if not file.exists():
            add_error(errors, "SURAH", f"missing {file.relative_to(ROOT)}")
            continue
        surah = json.loads(file.read_text(encoding="utf-8"))
        surah_count += 1
        if surah.get("number") != number:
            add_error(errors, "SURAH", f"{file.relative_to(ROOT)} number disagrees with index")
        if surah.get("name_tamil") != meta.get("name_tamil"):
            add_error(errors, "SURAH", f"{file.relative_to(ROOT)} Tamil name disagrees with index")
        if surah.get("stated_total_verses") != meta.get("total_verses"):
            add_error(errors, "SURAH", f"{file.relative_to(ROOT)} total verses disagrees with index")
        groups = surah.get("ayah_groups")
        if not isinstance(groups, list) or len(groups) != meta.get("total_groups"):
            add_error(errors, "SURAH", f"{file.relative_to(ROOT)} ayah group count disagrees with index")
        seen: set[int] = set()
        expected = surah.get("stated_total_verses", 0)
        for group_number, group in enumerate(groups or [], start=1):
            verses = group.get("verses") if isinstance(group, dict) else None
            if not isinstance(verses, list) or not verses:
                add_error(errors, "SURAH", f"{file.relative_to(ROOT)} group {group_number} has no verses")
                continue
            if not non_empty(group.get("arabic")):
                add_error(errors, "SURAH", f"{file.relative_to(ROOT)} group {group_number} has empty Arabic")
            if not non_empty(group.get("tamil")):
                add_error(errors, "SURAH", f"{file.relative_to(ROOT)} group {group_number} has empty Tamil")
            for verse in verses:
                if not isinstance(verse, int) or not 1 <= verse <= expected:
                    add_error(errors, "SURAH", f"{file.relative_to(ROOT)} has malformed ayah {verse!r}")
                if verse in seen:
                    add_error(errors, "SURAH", f"{file.relative_to(ROOT)} duplicates ayah {verse}")
                seen.add(verse)
                all_ayahs.add(f"{number}:{verse}")
                ayah_count += 1
            note_ids = group.get("notes")
            if not isinstance(note_ids, list):
                add_error(errors, "FOOTNOTE", f"{file.relative_to(ROOT)} group {group_number} notes is not an array")
                note_ids = []
            markers = [int(match.group(1)) for match in FOOTNOTE_RE.finditer(group.get("tamil", ""))]
            footnote_reference_count += len(markers)
            footnote_array_reference_count += len(note_ids)
            if sorted(set(markers)) != sorted(set(note_ids)):
                add_error(errors, "FOOTNOTE", f"{file.relative_to(ROOT)} group {group_number} markers and notes differ")
            stripped = FOOTNOTE_RE.sub("", group.get("tamil", ""))
            if "¤" in stripped:
                add_error(errors, "FOOTNOTE", f"{file.relative_to(ROOT)} group {group_number} has malformed marker")
            for note_id in note_ids + markers:
                if not isinstance(note_id, int) or not 1 <= note_id <= 521 or not (DATA / "notes" / f"{note_id}.json").exists():
                    add_error(errors, "FOOTNOTE", f"{file.relative_to(ROOT)} references missing note {note_id!r}")
        missing = [str(verse) for verse in iter_numbers(expected) if verse not in seen]
        if missing:
            add_error(errors, "SURAH", f"{file.relative_to(ROOT)} missing ayahs {', '.join(missing)}")

    for number in iter_numbers(114):
        if number not in index_numbers:
            add_error(errors, "SURAH", f"index.json missing Surah {number}")

    if not isinstance(notes_index, list) or len(notes_index) != 521:
        add_error(errors, "NOTES", f"notes-index.json expected 521 entries, found {len(notes_index) if isinstance(notes_index, list) else 'non-array'}")
    note_numbers: set[int] = set()
    for entry in notes_index if isinstance(notes_index, list) else []:
        number = entry.get("number") if isinstance(entry, dict) else None
        if not isinstance(number, int):
            add_error(errors, "NOTES", "notes-index entry has malformed number")
            continue
        if number in note_numbers:
            add_error(errors, "NOTES", f"duplicate note number {number}")
        note_numbers.add(number)
        file = DATA / "notes" / f"{number}.json"
        if not file.exists():
            add_error(errors, "NOTES", f"missing {file.relative_to(ROOT)}")
            continue
        note = json.loads(file.read_text(encoding="utf-8"))
        if note.get("number") != number or note.get("title") != entry.get("title"):
            add_error(errors, "NOTES", f"{file.relative_to(ROOT)} disagrees with notes-index.json")
        paragraphs = note.get("paragraphs")
        if not isinstance(paragraphs, list) or not paragraphs or any(not non_empty(p) for p in paragraphs):
            add_error(errors, "NOTES", f"{file.relative_to(ROOT)} has missing or empty content")
    for number in iter_numbers(521):
        if number not in note_numbers:
            add_error(errors, "NOTES", f"notes-index.json missing Note {number}")

    topic_slugs: dict[str, dict[str, Any]] = {}
    for group in topics if isinstance(topics, list) else []:
        for item in group.get("items", []):
            slug = item.get("slug")
            if slug in topic_slugs:
                add_error(errors, "TOPICS", f"duplicate topic slug {slug}")
            topic_slugs[slug] = item
            for child in item.get("children", []):
                child_slug = child.get("slug")
                if child_slug in topic_slugs:
                    add_error(errors, "TOPICS", f"duplicate topic slug {child_slug}")
                topic_slugs[child_slug] = child

    content_sections = {section.get("title"): section for section in topic_content.get("sections", [])}
    content_topic_titles = {
        section.get("title"): {topic.get("title") for topic in section.get("topics", [])}
        for section in topic_content.get("sections", [])
    }
    for slug, item in topic_slugs.items():
        mapping = topic_map.get("entries", {}).get(slug)
        if not mapping:
            add_error(errors, "TOPICS", f"{slug}: missing topic_content_map entry")
            continue
        section = mapping.get("section")
        if section not in content_sections:
            add_error(errors, "TOPICS", f"{slug}: mapped section missing: {section}")
        if mapping.get("mode") == "topic" and mapping.get("sourceTopic") not in content_topic_titles.get(section, set()):
            add_error(errors, "TOPICS", f"{slug}: mapped sourceTopic missing: {mapping.get('sourceTopic')}")
        if mapping.get("mode") == "topics":
            for source_topic in mapping.get("sourceTopics", []):
                if source_topic not in content_topic_titles.get(section, set()):
                    add_error(errors, "TOPICS", f"{slug}: mapped sourceTopic missing: {source_topic}")
    for slug in topic_map.get("entries", {}):
        if slug not in topic_slugs:
            add_error(errors, "TOPICS", f"{slug}: topic_content_map entry has no topics.json route")

    topic_reference_count = 0
    for section in topic_content.get("sections", []):
        for topic in section.get("topics", []):
            items = list(topic.get("items", []))
            for subtopic in topic.get("subtopics", []):
                items.extend(subtopic.get("items", []))
            for item in items:
                for reference in item.get("references", []):
                    topic_reference_count += 1
                    validate_reference(
                        reference,
                        all_ayahs,
                        errors,
                        f"{section.get('title')} > {topic.get('title')}",
                    )

    search_reference_count = 0
    search_group_keys: set[str] = set()
    source_groups: dict[str, str] = {}
    for number in iter_numbers(114):
        surah = json.loads((DATA / "surah" / f"{number}.json").read_text(encoding="utf-8"))
        for group in surah.get("ayah_groups", []):
            source_groups[f"{number}:{','.join(str(v) for v in group['verses'])}"] = FOOTNOTE_RE.sub("", group.get("tamil", ""))
    for entry_number, entry in enumerate(search_index if isinstance(search_index, list) else []):
        if not isinstance(entry.get("surah"), int) or not isinstance(entry.get("verses"), list) or not non_empty(entry.get("tamil")):
            add_error(errors, "SEARCH", f"entry {entry_number} is malformed")
            continue
        key = f"{entry['surah']}:{','.join(str(v) for v in entry['verses'])}"
        if key in search_group_keys:
            add_error(errors, "SEARCH", f"duplicate entry {key}")
        search_group_keys.add(key)
        if key not in source_groups:
            add_error(errors, "SEARCH", f"entry {entry_number} points to missing group {key}")
        elif source_groups[key] != entry["tamil"]:
            add_error(errors, "SEARCH", f"entry {entry_number} Tamil text differs from source")
        for verse in entry["verses"]:
            search_reference_count += 1
            if f"{entry['surah']}:{verse}" not in all_ayahs:
                add_error(errors, "SEARCH", f"entry {entry_number} points to missing ayah {entry['surah']}:{verse}")
    for key in source_groups:
        if key not in search_group_keys:
            add_error(errors, "SEARCH", f"missing search entry for {key}")

    print("CONTENT INTEGRITY AUDIT")
    print(f"Surahs checked: {surah_count}")
    print(f"Ayahs checked: {ayah_count}")
    print(f"Notes checked: {len(note_numbers)}")
    print(f"Footnote references checked: {footnote_reference_count}")
    print(f"Topics checked: {len(topic_slugs)}")
    print(f"Topic content references checked: {topic_reference_count}")
    print(f"Search-index entries checked: {len(search_index) if isinstance(search_index, list) else 0}")
    print(f"Search-index references checked: {search_reference_count}")
    print(f"Errors found: {len(errors)}")
    for error in errors:
        print(f"ERROR: {error}")
    print(f"SOURCE-VERIFICATION WARNINGS: {len(warnings)}")
    for warning in warnings:
        print(f"WARNING: {warning}")
    return 1 if errors else 0


if __name__ == "__main__":
    sys.exit(main())
