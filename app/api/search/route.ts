import "server-only";

import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import {
  rankResults,
  searchSurahs,
  searchVerses,
  searchIntroductions,
  searchNotes,
  type IntroductionEntry,
} from "@/lib/search";
import type { Note, SearchEntry, Surah, SurahMeta } from "@/lib/types";

const DATA_DIR = path.join(process.cwd(), "public", "data");
const TOTAL_SURAHS = 114;
const TOTAL_NOTES = 521;
const RESULT_LIMIT = 60;

// Each data source is read directly off disk once per server instance and
// cached as a promise, the same pattern the original route used for
// search-index.json. The matching/ranking logic itself lives entirely in
// lib/search.ts and is shared with the browser-facing search() - only the
// data-loading mechanism is server-specific (fs vs fetch), which is a
// legitimate environment difference, not duplicated search logic.

let searchIndexPromise: Promise<SearchEntry[]> | null = null;
function getSearchIndex() {
  if (!searchIndexPromise) {
    searchIndexPromise = fs
      .readFile(path.join(DATA_DIR, "search-index.json"), "utf8")
      .then((content) => JSON.parse(content) as SearchEntry[]);
  }
  return searchIndexPromise;
}

let surahIndexPromise: Promise<SurahMeta[]> | null = null;
function getSurahIndex() {
  if (!surahIndexPromise) {
    surahIndexPromise = fs
      .readFile(path.join(DATA_DIR, "index.json"), "utf8")
      .then((content) => JSON.parse(content) as SurahMeta[]);
  }
  return surahIndexPromise;
}

// Introduction text lives only in the per-Surah files (not duplicated
// into search-index.json), so this reads all 114 once and keeps just
// what's needed for matching - not the full ayah_groups.
let introEntriesPromise: Promise<IntroductionEntry[]> | null = null;
function getIntroductionEntries() {
  if (!introEntriesPromise) {
    introEntriesPromise = Promise.all(
      Array.from({ length: TOTAL_SURAHS }, (_, i) =>
        fs
          .readFile(path.join(DATA_DIR, "surah", `${i + 1}.json`), "utf8")
          .then((content) => JSON.parse(content) as Surah)
      )
    ).then((surahs) =>
      surahs.map((s) => ({
        surah: s.number,
        surahName: s.name_tamil,
        nameMeaning: s.introduction.name_meaning,
        paragraphs: s.introduction.paragraphs,
      }))
    );
  }
  return introEntriesPromise;
}

let notesPromise: Promise<Note[]> | null = null;
function getNotes() {
  if (!notesPromise) {
    notesPromise = Promise.all(
      Array.from({ length: TOTAL_NOTES }, (_, i) =>
        fs
          .readFile(path.join(DATA_DIR, "notes", `${i + 1}.json`), "utf8")
          .then((content) => JSON.parse(content) as Note)
      )
    );
  }
  return notesPromise;
}

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q")?.trim() ?? "";

  const isNumericQuery = /^\d+$/.test(query);
  if (!isNumericQuery && query.length < 2) {
    return NextResponse.json([]);
  }

  const [searchIndex, surahIndex, introEntries, notes] = await Promise.all([
    getSearchIndex(),
    getSurahIndex(),
    getIntroductionEntries(),
    getNotes(),
  ]);

  const surahNameById = new Map(surahIndex.map((s) => [s.number, s.name_tamil]));

  const results = rankResults([
    ...searchSurahs(query, surahIndex),
    ...searchIntroductions(query, introEntries),
    ...searchNotes(query, notes),
    ...searchVerses(query, searchIndex, surahNameById),
  ]).slice(0, RESULT_LIMIT);

  return NextResponse.json(results, {
    headers: {
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
