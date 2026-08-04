// Reusable search engine for the Quran app. Deliberately has no dependency
// on React - it's plain data-fetching and string-matching logic that any
// UI (overlay, page, future command palette, etc.) can call into.
//
// V2: four composable result types (Surah, verse, introduction, note).
// Each `search*` function is pure (data in, results out) so different
// consumers can supply data however is efficient for their environment -
// see `search()` below (browser, cached fetch) vs the API route (server,
// direct filesystem access) for the two current examples.

import type { Note, SearchEntry, SurahMeta } from "./types";
import { SURAH_METADATA } from "./surah-metadata";

const SEARCH_INDEX_URL = "/data/search-index.json";
const SURAH_INDEX_URL = "/data/index.json";

// ---------------------------------------------------------------------
// Index loading with a module-level cache. Each URL is fetched at most
// once per page session; subsequent calls (including from different
// components) reuse the same in-flight promise or resolved data.
// ---------------------------------------------------------------------

let searchIndexPromise: Promise<SearchEntry[]> | null = null;
let surahIndexPromise: Promise<SurahMeta[]> | null = null;

export function loadSearchIndex(): Promise<SearchEntry[]> {
  if (!searchIndexPromise) {
    searchIndexPromise = fetch(SEARCH_INDEX_URL)
      .then((r) => {
        if (!r.ok) throw new Error(`Failed to load search index: ${r.status}`);
        return r.json();
      })
      .catch((err) => {
        searchIndexPromise = null; // allow retry on next call
        throw err;
      });
  }
  return searchIndexPromise;
}

export function loadSurahIndex(): Promise<SurahMeta[]> {
  if (!surahIndexPromise) {
    surahIndexPromise = fetch(SURAH_INDEX_URL)
      .then((r) => {
        if (!r.ok) throw new Error(`Failed to load Surah index: ${r.status}`);
        return r.json();
      })
      .catch((err) => {
        surahIndexPromise = null;
        throw err;
      });
  }
  return surahIndexPromise;
}

/** Clears the module-level cache. Exposed for tests; not needed in app code. */
export function clearSearchCache(): void {
  searchIndexPromise = null;
  surahIndexPromise = null;
}

// ---------------------------------------------------------------------
// Scoring
// ---------------------------------------------------------------------

export const SCORE = {
  EXACT_SURAH_NUMBER: 1000,
  EXACT_NAME: 900,
  STARTS_WITH: 700,
  WHOLE_WORD: 500,
  CONTAINS: 300,
} as const;

type ScoreKind = "number" | "name" | "text";

function normalize(s: string): string {
  return s.trim().toLowerCase();
}

function isWholeWordMatch(haystack: string, needle: string): boolean {
  return haystack
    .split(/\s+/)
    .some((word) => normalize(word) === normalize(needle));
}

/**
 * Scores how well `query` matches `field`, given what kind of field it is.
 * - "number": binary - exact match only (a Surah number either is or
 *   isn't the one you typed; there's no meaningful "contains" for it).
 * - "name": the two highest tiers apply (a name can be typed in full).
 * - "text": verse text - realistically never matched exactly by a short
 *   query, so it only ever lands in the lower three tiers.
 * Returns 0 when there is no match at all.
 */
export function calculateScore(
  query: string,
  field: string,
  kind: ScoreKind
): number {
  const q = normalize(query);
  const f = normalize(field);
  if (!q || !f) return 0;

  if (kind === "number") {
    return q === f ? SCORE.EXACT_SURAH_NUMBER : 0;
  }

  if (q === f) {
    return kind === "name" ? SCORE.EXACT_NAME : SCORE.STARTS_WITH;
  }
  if (f.startsWith(q)) return SCORE.STARTS_WITH;
  if (isWholeWordMatch(field, query)) return SCORE.WHOLE_WORD;
  if (f.includes(q)) return SCORE.CONTAINS;
  return 0;
}

// ---------------------------------------------------------------------
// Snippets
// ---------------------------------------------------------------------

/**
 * Returns a contextual snippet around the first occurrence of `query` in
 * `text` - roughly `context` characters on each side, with an ellipsis
 * wherever the snippet was truncated. Falls back to a plain leading
 * truncation if `query` isn't found in `text` at all.
 */
export function createSnippet(
  text: string,
  query: string,
  context = 40
): string {
  const q = normalize(query);
  const idx = q ? normalize(text).indexOf(q) : -1;

  if (idx === -1) {
    return text.length > context * 2
      ? `${text.slice(0, context * 2).trimEnd()}…`
      : text;
  }

  const start = Math.max(0, idx - context);
  const end = Math.min(text.length, idx + query.length + context);
  const prefix = start > 0 ? "…" : "";
  const suffix = end < text.length ? "…" : "";
  return prefix + text.slice(start, end) + suffix;
}

// ---------------------------------------------------------------------
// Result model (V2)
// ---------------------------------------------------------------------
// An explicit `type` discriminant per result, rather than boolean flags -
// TypeScript narrows the fields available on each variant, and the UI can
// switch on `result.type` to pick a card layout.

export type SearchResultType = "surah" | "verse" | "introduction" | "note";

interface SearchResultBase {
  score: number;
  href: string;
}

export interface SurahResult extends SearchResultBase {
  type: "surah";
  surah: number;
  nameTamil: string;
  nameEnglish: string | null;
  nameArabic: string | null;
}

export interface VerseResult extends SearchResultBase {
  type: "verse";
  surah: number;
  surahName: string;
  verses: number[];
  label: string;
  snippet: string;
}

export interface IntroductionResult extends SearchResultBase {
  type: "introduction";
  surah: number;
  surahName: string;
  snippet: string;
}

export interface NoteResult extends SearchResultBase {
  type: "note";
  note: number;
  title: string;
  snippet: string;
}

export type SearchResult =
  | SurahResult
  | VerseResult
  | IntroductionResult
  | NoteResult;

// Tie-break priority when two results share the same score - a Surah
// match should lead even if, e.g., a verse happens to score identically.
// Only matters for equal scores; the score itself is still primary.
const TYPE_PRIORITY: Record<SearchResultType, number> = {
  surah: 3,
  verse: 2,
  introduction: 1,
  note: 0,
};

/** Sorts results by score descending, using TYPE_PRIORITY to break ties. */
export function rankResults(results: SearchResult[]): SearchResult[] {
  return [...results].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return TYPE_PRIORITY[b.type] - TYPE_PRIORITY[a.type];
  });
}

function verseLabel(verses: number[]): string {
  return verses.length > 1
    ? `${verses[0]}-${verses[verses.length - 1]}`
    : `${verses[0]}`;
}

// ---------------------------------------------------------------------
// Pure matchers - each takes already-loaded data and returns ranked
// results for just that type. Callers (the browser-facing `search()`
// below, or a server route with its own data-loading strategy) compose
// whichever subset of these they have data for, then call rankResults().
// ---------------------------------------------------------------------

/** Matches Surah number or name (Tamil/English/Arabic). */
export function searchSurahs(
  query: string,
  surahIndex: SurahMeta[]
): SurahResult[] {
  const results: SurahResult[] = [];
  const metaById = new Map(SURAH_METADATA.map((m) => [m.number, m]));

  for (const s of surahIndex) {
    const meta = metaById.get(s.number);
    const numberScore = calculateScore(query, String(s.number), "number");
    const nameFields = [s.name_tamil, meta?.nameEnglish, meta?.nameArabic].filter(
      (v): v is string => Boolean(v)
    );
    const nameScore = Math.max(
      0,
      ...nameFields.map((f) => calculateScore(query, f, "name"))
    );
    const score = Math.max(numberScore, nameScore);
    if (score > 0) {
      results.push({
        type: "surah",
        score,
        surah: s.number,
        nameTamil: s.name_tamil,
        nameEnglish: meta?.nameEnglish ?? null,
        nameArabic: meta?.nameArabic ?? null,
        href: `/surah/${s.number}`,
      });
    }
  }
  return results;
}

/** Matches Tamil verse text. `surahNameById` supplies the display name
 * shown alongside each verse (e.g. "Al-Baqarah · 2:255"). */
export function searchVerses(
  query: string,
  searchIndex: SearchEntry[],
  surahNameById: Map<number, string>
): VerseResult[] {
  const results: VerseResult[] = [];
  for (const entry of searchIndex) {
    const score = calculateScore(query, entry.tamil, "text");
    if (score > 0) {
      results.push({
        type: "verse",
        score,
        surah: entry.surah,
        surahName: surahNameById.get(entry.surah) ?? `Surah ${entry.surah}`,
        verses: entry.verses,
        label: `${entry.surah}:${verseLabel(entry.verses)}`,
        snippet: createSnippet(entry.tamil, query),
        href: `/surah/${entry.surah}#${entry.verses[0]}`,
      });
    }
  }
  return results;
}

/** Input shape for introduction search - deliberately narrow (not the
 * full Surah type) so callers only need to supply what matching needs. */
export interface IntroductionEntry {
  surah: number;
  surahName: string;
  nameMeaning: string | null;
  paragraphs: string[];
}

/** Matches Surah introduction text (name meaning + explanatory paragraphs).
 * `nameMeaning` is a short label (comparable to a Surah name) - if it were
 * scored the same way as the long-form `paragraphs` text, it would
 * trivially satisfy STARTS_WITH in a way genuine prose rarely does,
 * unfairly outranking real body-text and verse matches. So it's capped
 * at WHOLE_WORD; the paragraphs carry the full tier range, same as verse
 * text, so the two are compared on equal footing. */
export function searchIntroductions(
  query: string,
  entries: IntroductionEntry[]
): IntroductionResult[] {
  const results: IntroductionResult[] = [];
  for (const entry of entries) {
    const bodyScore = entry.paragraphs.length
      ? calculateScore(query, entry.paragraphs.join(" "), "text")
      : 0;
    const nameScore = entry.nameMeaning
      ? Math.min(calculateScore(query, entry.nameMeaning, "text"), SCORE.WHOLE_WORD)
      : 0;
    const score = Math.max(bodyScore, nameScore);
    if (score > 0) {
      const combined = [entry.nameMeaning, ...entry.paragraphs]
        .filter(Boolean)
        .join(" ");
      results.push({
        type: "introduction",
        score,
        surah: entry.surah,
        surahName: entry.surahName,
        snippet: createSnippet(combined, query),
        href: `/surah/${entry.surah}`,
      });
    }
  }
  return results;
}

/** Matches explanatory-note title + body text. Same reasoning as
 * searchIntroductions above: the title is short and would trivially win
 * STARTS_WITH, so it's capped at WHOLE_WORD while the body (long-form,
 * comparable to verse text) carries the full tier range. */
export function searchNotes(query: string, notes: Note[]): NoteResult[] {
  const results: NoteResult[] = [];
  for (const note of notes) {
    const bodyScore = calculateScore(query, note.paragraphs.join(" "), "text");
    const titleScore = Math.min(
      calculateScore(query, note.title, "text"),
      SCORE.WHOLE_WORD
    );
    const score = Math.max(bodyScore, titleScore);
    if (score > 0) {
      const combined = [note.title, ...note.paragraphs].join(" ");
      results.push({
        type: "note",
        score,
        note: note.number,
        title: note.title,
        snippet: createSnippet(combined, query),
        href: `/notes/${note.number}`,
      });
    }
  }
  return results;
}

/**
 * Runs a search across Surah numbers/names and Tamil verse text - the two
 * data sources efficiently available in the browser via cached fetch.
 * (Introduction and note search are server-side only for now: matching
 * them requires 114 and 521 separate small files respectively, which
 * isn't practical to fetch individually from the browser. The API route
 * has both via direct filesystem access and includes them.)
 */
export async function search(query: string): Promise<SearchResult[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const [searchIndex, surahIndex] = await Promise.all([
    loadSearchIndex(),
    loadSurahIndex(),
  ]);

  const surahNameById = new Map(surahIndex.map((s) => [s.number, s.name_tamil]));

  return rankResults([
    ...searchSurahs(trimmed, surahIndex),
    ...searchVerses(trimmed, searchIndex, surahNameById),
  ]);
}
