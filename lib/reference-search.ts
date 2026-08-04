// Shared "N:M" verse-reference parsing and lookup, used by both
// SearchOverlay (the compact modal) and SearchPage (the dedicated /search
// page) so a query like "56:8" or "22.11" bypasses ranked search and
// jumps straight to the verse the same way in both places.
//
// No dependency on React - both callers wire this into their own
// useEffect/state, since their loading/rendering conventions differ
// slightly. This module only owns the parsing and the fetch+resolve.

import type { Surah } from "./types";

const NOTE_MARKER = /\u00a4(\d+)\u00a4/g;
const VERSE_REF_PATTERN = /^(\d{1,3})\s*[:.]\s*(\d{1,3})(?:\s*-\s*\d{1,3})?$/;

export interface VerseReference {
  surah: number;
  verse: number;
}

/**
 * Parses a query like "56:8", "22.11", or "2:183-184" into a Surah/verse
 * pair. Purely syntactic - does not check that the Surah number is in
 * range (1-114); callers that want to show a specific "out of range"
 * message (as opposed to falling through to a normal search) check that
 * separately, same as before this was extracted.
 */
export function parseVerseReference(query: string): VerseReference | null {
  const m = VERSE_REF_PATTERN.exec(query.trim());
  if (!m) return null;
  return { surah: Number(m[1]), verse: Number(m[2]) };
}

export interface ResolvedVerseReference {
  href: string;
  label: string;
  preview: string;
}

/**
 * Fetches the given Surah's data and resolves a verse reference to the
 * exact ayah-group it belongs to (verses may be clubbed - e.g. verse 183
 * might only exist as part of a 183-184 group, so the returned href
 * points at the group's first verse). Returns null if the fetch fails or
 * the verse doesn't exist in that Surah. Does not itself validate the
 * Surah number range - callers are expected to have already checked
 * 1-114, matching the behavior each caller already had before this was
 * extracted.
 */
export async function fetchVerseReference(
  ref: VerseReference,
  init?: RequestInit
): Promise<ResolvedVerseReference | null> {
  const res = await fetch(`/data/surah/${ref.surah}.json`, init);
  if (!res.ok) return null;
  const surah: Surah = await res.json();

  const match = surah.ayah_groups.find((g) => g.verses.includes(ref.verse));
  if (!match) return null;

  const verseLabel =
    match.verses.length > 1
      ? `${match.verses[0]}-${match.verses[match.verses.length - 1]}`
      : `${match.verses[0]}`;

  return {
    href: `/surah/${ref.surah}#${match.verses[0]}`,
    label: `${ref.surah}:${verseLabel}`,
    preview: match.tamil.replace(NOTE_MARKER, ""),
  };
}
