#!/usr/bin/env python3
"""Build the Porul Attavanai dataset from the extracted Markdown source.

The source is intentionally parsed as a small document grammar rather than
by matching a fixed list of Tamil titles.  This keeps source ordering and
unusual/untitled entries intact when the source document changes.
"""

from __future__ import annotations

import argparse
import json
import re
from pathlib import Path
from typing import Any


SECTION_RE = re.compile(r"^##\s+(.+?)\s*$")
NESTED_RE = re.compile(r"^###\s+(.+?)\s*$")
NUMBERED_RE = re.compile(r"^(\d+)\.\s+(.+?)\s*$")
REFERENCE_RE = re.compile(
    r"(?<!\d)(?P<surah>\d{1,3})\s*:\s*"
    r"(?P<ayah>\d{1,3}(?:\s*[-–]\s*\d{1,3})?)"
    r"(?P<continuations>(?:\s*,\s*(?:(?P<next_surah>\d{1,3})\s*:\s*)?"
    r"\d{1,3}(?:\s*[-–]\s*\d{1,3})?)*)"
)
CONTINUATION_RE = re.compile(
    r",\s*(?:(?P<surah>\d{1,3})\s*:\s*)?"
    r"(?P<ayah>\d{1,3}(?:\s*[-–]\s*\d{1,3})?)"
)
CHAPTER_RE = re.compile(r"^#\s*அத்தியாயம்\s*:")

# These are the two known source extraction typos in the long reference list
# under topic 5. Keep this deliberately line-specific; do not normalize
# punctuation globally because semicolons may be meaningful elsewhere.
REFERENCE_NORMALIZATIONS = {
    2873: ("17;20", "17:20"),
    2875: ("18;28", "18:28"),
}

CONTENT_CUES = (
    "காண்க",
    "காணலாம்",
    "விபரம்",
    "சான்று",
    "குறித்து",
    "குறிப்பைக்",
    "குறிப்பை",
    "மற்ற விவரங்கள்",
    "இதற்கான",
    "இதுபற்றி",
    "இது குறித்து",
    "இவரைப்",
    "அவரது",
)


def references_in(text: str) -> list[str]:
    """Return Quran references in source order, preserving ranges."""
    result: list[str] = []
    for match in REFERENCE_RE.finditer(text):
        current_surah = match.group("surah")
        result.append(f"{current_surah}:{match.group('ayah').replace(' ', '')}")
        for continuation in CONTINUATION_RE.finditer(match.group("continuations")):
            if continuation.group("surah"):
                current_surah = continuation.group("surah")
            result.append(
                f"{current_surah}:{continuation.group('ayah').replace(' ', '')}"
            )
    return result


def remove_references(text: str) -> str:
    """Remove references and their separators, retaining the prose exactly."""
    text = REFERENCE_RE.sub("", text)
    text = re.sub(r"\s*[-–—]\s*(?:[,;]\s*)*$", "", text)
    text = re.sub(r"(?:\s*[,;]\s*)+$", "", text)
    text = re.sub(r"\s*[-–—]\s*$", "", text)
    return text.strip()


def is_reference_only(text: str) -> bool:
    if not references_in(text):
        return False
    remainder = REFERENCE_RE.sub("", text)
    return not re.sub(r"[\s,;./()\[\]{}:–—-]", "", remainder)


def looks_like_content(text: str, numbered: bool | None) -> bool:
    """Disambiguate reference-free prose from the source's plain headings."""
    if numbered is not None:
        return True
    stripped = text.strip()
    if stripped.startswith(('"', "'", "(", "“", "‘")):
        return True
    if any(cue in stripped for cue in CONTENT_CUES):
        return True
    return stripped.endswith((".", "!", "?", ")")) and len(stripped) > 55


def new_topic(title: str | None, line: int, number: int | None = None) -> dict[str, Any]:
    return {
        "number": number,
        "title": title,
        "items": [],
        "subtopics": [],
        "source_line": line,
    }


def new_item(text: str | None, refs: list[str], line: int) -> dict[str, Any]:
    return {"text": text, "references": refs, "source_line": line}


def parse_source(
    source: str, start_line: int = 2793
) -> tuple[dict[str, Any], list[dict[str, Any]], list[dict[str, Any]], list[dict[str, Any]]]:
    lines = source.splitlines()
    start = start_line - 1
    sections: list[dict[str, Any]] = []
    unclassified: list[dict[str, Any]] = []
    normalizations: list[dict[str, Any]] = []
    current_section: dict[str, Any] | None = None
    current_topic: dict[str, Any] | None = None
    current_subtopic: dict[str, Any] | None = None

    def active_container() -> dict[str, Any] | None:
        return current_subtopic or current_topic

    def ensure_null_topic(line: int) -> dict[str, Any]:
        nonlocal current_topic
        if current_topic is None:
            current_topic = new_topic(None, line)
            assert current_section is not None
            current_section["topics"].append(current_topic)
        return current_topic

    def next_nonempty(index: int) -> str | None:
        for later in lines[index + 1 :]:
            value = later.strip()
            if value:
                return value
        return None

    for index in range(start, len(lines)):
        line_number = index + 1
        raw = lines[index]
        value = raw.strip()
        if line_number in REFERENCE_NORMALIZATIONS:
            old, new = REFERENCE_NORMALIZATIONS[line_number]
            if old in value:
                value = value.replace(old, new)
                normalizations.append({"line": line_number, "from": old, "to": new})
        if not value:
            continue
        if CHAPTER_RE.match(value):
            break

        section_match = SECTION_RE.match(value)
        nested_match = NESTED_RE.match(value)
        numbered_match = NUMBERED_RE.match(value)

        if section_match:
            current_section = {
                "title": section_match.group(1).strip(),
                "topics": [],
                "source_line": line_number,
            }
            sections.append(current_section)
            current_topic = None
            current_subtopic = None
            continue

        if current_section is None:
            unclassified.append({"line": line_number, "text": value, "reason": "before first section"})
            continue

        if nested_match:
            if current_topic is None:
                current_topic = new_topic(None, line_number)
                current_section["topics"].append(current_topic)
            current_subtopic = {
                "title": nested_match.group(1).strip(),
                "items": [],
                "source_line": line_number,
            }
            current_topic["subtopics"].append(current_subtopic)
            continue

        if numbered_match:
            current_topic = new_topic(
                numbered_match.group(2).strip(),
                line_number,
                int(numbered_match.group(1)),
            )
            current_section["topics"].append(current_topic)
            current_subtopic = None
            continue

        refs = references_in(value)
        if is_reference_only(value):
            container = active_container()
            if container and container["items"]:
                container["items"][-1]["references"].extend(refs)
            else:
                topic = ensure_null_topic(line_number)
                topic["items"].append(new_item(None, refs, line_number))
            continue

        if refs:
            container = active_container()
            if container is None:
                container = ensure_null_topic(line_number)
            container["items"].append(
                new_item(remove_references(value), refs, line_number)
            )
            continue

        # A reference-free line following a numbered heading is content by
        # definition for this source (the numbered cross-reference entries).
        if current_topic is not None and looks_like_content(value, current_topic.get("number")):
            container = active_container() or ensure_null_topic(line_number)
            container["items"].append(new_item(value, [], line_number))
            continue

        # Plain headings close an explicit ### nesting level.  A reference-
        # free explanatory line is retained as an item instead of discarded.
        if current_subtopic is not None:
            current_subtopic = None
        if current_topic is not None and looks_like_content(value, None):
            current_topic["items"].append(new_item(value, [], line_number))
            continue

        current_topic = new_topic(value, line_number)
        current_section["topics"].append(current_topic)

    chapter_index = next(
        (i for i, line in enumerate(lines[start:], start) if CHAPTER_RE.match(line.strip())),
        len(lines),
    )
    last_content_index = chapter_index - 1
    while last_content_index >= start and not lines[last_content_index].strip():
        last_content_index -= 1
    source_meta = {
        "file": "extracted.md",
        "line_start": start_line,
        "line_end": last_content_index + 1,
    }
    return source_meta, sections, unclassified, normalizations


def clean_for_output(value: Any) -> Any:
    """Drop only parser bookkeeping fields from the published JSON."""
    if isinstance(value, list):
        return [clean_for_output(v) for v in value]
    if isinstance(value, dict):
        return {
            key: clean_for_output(item)
            for key, item in value.items()
            if key != "source_line"
        }
    return value


def report(
    dataset: dict[str, Any],
    unclassified: list[dict[str, Any]],
    normalizations: list[dict[str, Any]],
) -> None:
    sections = dataset["sections"]
    topics = [topic for section in sections for topic in section["topics"]]
    items = []
    for topic in topics:
        items.extend(topic["items"])
        for subtopic in topic["subtopics"]:
            items.extend(subtopic["items"])
    numbered = [
        topic
        for topic in topics
        if topic.get("number") is not None
    ]
    zero_items = [
        (section["title"], topic["title"])
        for section in sections
        for topic in section["topics"]
        if not topic["items"]
    ]
    null_titles = [
        (section["title"], topic.get("source_line"))
        for section in sections
        for topic in section["topics"]
        if topic["title"] is None
    ]
    print(f"sections: {len(sections)}")
    print(f"topics: {len(topics)}")
    print(f"items: {len(items)}")
    print(f"topics with zero items: {len(zero_items)}")
    for section, title in zero_items:
        print(f"  ZERO {section} :: {title!r}")
    print(f"topics with null titles: {len(null_titles)}")
    print(f"numbered headings detected: {len(numbered)}")
    print("numbered values: " + ", ".join(str(topic["number"]) for topic in numbered))
    print(f"source lines that could not be classified: {len(unclassified)}")
    for entry in unclassified:
        print(f"  UNCLASSIFIED line {entry['line']}: {entry['text']}")
    print(f"explicit source normalizations: {len(normalizations)}")
    for entry in normalizations:
        print(f"  NORMALIZED line {entry['line']}: {entry['from']} -> {entry['to']}")


def main() -> None:
    parser = argparse.ArgumentParser()
    root = Path(__file__).resolve().parents[2]
    parser.add_argument("--source", type=Path, default=root / "scripts/data-pipeline/extracted.md")
    parser.add_argument("--output", type=Path, default=root / "public/data/topic_content.json")
    parser.add_argument("--start-line", type=int, default=2793)
    args = parser.parse_args()

    source_text = args.source.read_text(encoding="utf-8")
    source_meta, sections, unclassified, normalizations = parse_source(
        source_text, args.start_line
    )
    dataset = {"source": source_meta, "sections": sections}
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(
        json.dumps(clean_for_output(dataset), ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    report(dataset, unclassified, normalizations)


if __name__ == "__main__":
    main()
