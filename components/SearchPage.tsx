"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { VerseBadge } from "./VerseBadge";
import type {
  SearchResult,
  SurahResult,
  VerseResult,
  IntroductionResult,
  NoteResult,
} from "@/lib/search";
import {
  parseVerseReference,
  fetchVerseReference,
  type ResolvedVerseReference,
} from "@/lib/reference-search";

interface ReferenceState {
  key: string;
  value: ResolvedVerseReference | null;
}

const DEBOUNCE_MS = 200;

/** Wraps the first occurrence of `query` within an already-truncated
 * snippet in <mark>, via plain JSX - no dangerouslySetInnerHTML. */
function HighlightedSnippet({ text, query }: { text: string; query: string }) {
  const q = query.trim();
  const idx = q ? text.toLowerCase().indexOf(q.toLowerCase()) : -1;
  if (idx === -1) return <>{text}</>;

  const before = text.slice(0, idx);
  const match = text.slice(idx, idx + q.length);
  const after = text.slice(idx + q.length);

  return (
    <>
      {before}
      {/* Slightly softened vs. the full --selection color used elsewhere,
          since a page full of result cards reads better with a lighter
          touch than a single inline highlight does. */}
      <mark
        style={{
          background: "color-mix(in srgb, var(--selection) 65%, transparent)",
          color: "var(--text)",
        }}
      >
        {match}
      </mark>
      {after}
    </>
  );
}

function CardShell({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <li>
      <Link href={href} className="ink-card flex items-start gap-3 rounded-xl px-4 py-3.5">
        {children}
      </Link>
    </li>
  );
}

function SurahCard({ result }: { result: SurahResult }) {
  return (
    <CardShell href={result.href}>
      <span aria-hidden="true" className="text-lg leading-none mt-0.5">
        📖
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate" style={{ fontSize: "16px", color: "var(--text)" }}>
          {result.nameTamil}
        </span>
        <span className="block text-xs mt-0.5" style={{ color: "var(--accent-2)" }}>
          Surah {result.surah}
        </span>
      </span>
    </CardShell>
  );
}

function VerseCard({ result, query }: { result: VerseResult; query: string }) {
  return (
    <CardShell href={result.href}>
      <span aria-hidden="true" className="text-lg leading-none mt-0.5">
        📍
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-baseline gap-1.5 mb-1">
          <VerseBadge verses={result.verses} />
          <span className="text-sm" style={{ color: "var(--text)" }}>
            {result.surahName} · {result.label}
          </span>
        </span>
        <span
          className="font-tamil-text block text-sm leading-relaxed"
          style={{ color: "var(--text-muted)" }}
        >
          <HighlightedSnippet text={result.snippet} query={query} />
        </span>
      </span>
    </CardShell>
  );
}

function IntroductionCard({
  result,
  query,
}: {
  result: IntroductionResult;
  query: string;
}) {
  return (
    <CardShell href={result.href}>
      <span aria-hidden="true" className="text-lg leading-none mt-0.5">
        📚
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-xs mb-0.5" style={{ color: "var(--accent-2)" }}>
          Introduction
        </span>
        <span className="block text-sm mb-1" style={{ color: "var(--text)" }}>
          {result.surahName}
        </span>
        <span
          className="font-tamil-text block text-sm leading-relaxed"
          style={{ color: "var(--text-muted)" }}
        >
          <HighlightedSnippet text={result.snippet} query={query} />
        </span>
      </span>
    </CardShell>
  );
}

function NoteCard({ result, query }: { result: NoteResult; query: string }) {
  return (
    <CardShell href={result.href}>
      <span aria-hidden="true" className="text-lg leading-none mt-0.5">
        📝
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm mb-1" style={{ color: "var(--text)" }}>
          Footnote {result.note}
        </span>
        <span
          className="font-tamil-text block text-sm leading-relaxed"
          style={{ color: "var(--text-muted)" }}
        >
          <HighlightedSnippet text={result.snippet} query={query} />
        </span>
      </span>
    </CardShell>
  );
}

function ResultCard({ result, query }: { result: SearchResult; query: string }) {
  switch (result.type) {
    case "surah":
      return <SurahCard result={result} />;
    case "verse":
      return <VerseCard result={result} query={query} />;
    case "introduction":
      return <IntroductionCard result={result} query={query} />;
    case "note":
      return <NoteCard result={result} query={query} />;
  }
}

function resultKey(result: SearchResult): string {
  switch (result.type) {
    case "surah":
      return `surah-${result.surah}`;
    case "verse":
      return `verse-${result.surah}-${result.verses.join("-")}`;
    case "introduction":
      return `intro-${result.surah}`;
    case "note":
      return `note-${result.note}`;
  }
}

function ReferenceCard({ reference }: { reference: ResolvedVerseReference }) {
  return (
    <li>
      <a
        href={reference.href}
        className="ink-card flex items-start gap-3 rounded-xl px-4 py-3.5"
      >
        <span aria-hidden="true" className="text-lg leading-none mt-0.5">
          📍
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-xs mb-1" style={{ color: "var(--accent-2)" }}>
            {reference.label} · Jump to verse
          </span>
          <span
            className="font-tamil-text block text-sm leading-relaxed"
            style={{ color: "var(--text)" }}
          >
            {reference.preview}
          </span>
        </span>
      </a>
    </li>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-16">
      <p className="font-display text-xl italic mb-4" style={{ color: "var(--text)" }}>
        திருக்குர்ஆனில் தேடுங்கள்
      </p>
      <p className="text-sm mb-2" style={{ color: "var(--text-muted)" }}>
        தேடலாம்:
      </p>
      <ul className="text-sm space-y-1" style={{ color: "var(--text-muted)" }}>
        <li>ஸூரா பெயர்</li>
        <li>ஸூரா எண்</li>
        <li>தமிழ் மொழிபெயர்ப்பு</li>
      </ul>
    </div>
  );
}

function NoResultsState({ query }: { query: string }) {
  return (
    <div className="text-center py-16">
      <p style={{ color: "var(--text-muted)" }}>No verses found for</p>
      <p className="font-tamil-text mt-1" style={{ color: "var(--text)" }}>
        &ldquo;{query}&rdquo;
      </p>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="text-center py-16" aria-live="polite">
      <p className="text-sm" style={{ color: "var(--text-muted)" }}>
        தேடுகிறது…
      </p>
    </div>
  );
}

export function SearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [reference, setReference] = useState<ReferenceState | null>(null);
  const [referenceLoading, setReferenceLoading] = useState(false);
  const referenceRequestId = useRef(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const trimmed = query.trim();

  // "56:8" / "22:11" - a specific verse reference. This bypasses ranked
  // search entirely and jumps straight to the verse, exactly as
  // SearchOverlay already does for the same pattern.
  const verseRef = parseVerseReference(trimmed);
  const referenceKey = verseRef ? `${verseRef.surah}:${verseRef.verse}` : null;

  useEffect(() => {
    if (verseRef) {
      return; // render gates on !verseRef before reading results/loading
    }
    if (!trimmed) {
      return; // render gates on `trimmed` directly; nothing to reset
    }

    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setLoading(true);
      fetch(`/api/search?q=${encodeURIComponent(trimmed)}`, {
        signal: controller.signal,
      })
        .then((r) => {
          if (!r.ok) throw new Error("Search failed");
          return r.json();
        })
        .then((data: SearchResult[]) => {
          setResults(data);
          setLoading(false);
        })
        .catch((error: unknown) => {
          if (error instanceof DOMException && error.name === "AbortError") return;
          setResults([]);
          setLoading(false);
        });
    }, DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trimmed, !!verseRef]);

  useEffect(() => {
    const requestId = ++referenceRequestId.current;

    if (!verseRef) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setReference(null);
      setReferenceLoading(false);
      return;
    }
    if (verseRef.surah < 1 || verseRef.surah > 114) {
      setReference(null);
      setReferenceLoading(false);
      return;
    }

    const controller = new AbortController();
    const key = `${verseRef.surah}:${verseRef.verse}`;
    setReferenceLoading(true);
    setReference(null);

    fetchVerseReference(verseRef, { signal: controller.signal })
      .then((resolved) => {
        if (requestId !== referenceRequestId.current) return;
        setReference({ key, value: resolved });
        setReferenceLoading(false);
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        if (requestId !== referenceRequestId.current) return;
        setReference(null);
        setReferenceLoading(false);
      });

    return () => controller.abort();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [verseRef?.surah, verseRef?.verse]);

  const displayedReference =
    reference?.key === referenceKey ? reference.value : null;
  const currentReferenceLoading =
    Boolean(verseRef &&
      verseRef.surah >= 1 &&
      verseRef.surah <= 114 &&
      (referenceLoading || reference?.key !== referenceKey));

  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6">
      <form role="search" onSubmit={(e) => e.preventDefault()} className="mb-8">
        <label htmlFor="quran-search-input" className="sr-only">
          Search the Quran
        </label>
        <div className="ink-card flex items-center gap-3 rounded-xl px-4 py-3">
          <SearchIcon />
          <input
            id="quran-search-input"
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="தமிழில் தேடுக..."
            className="flex-1 bg-transparent outline-none font-tamil-text"
            style={{ color: "var(--text)", fontSize: "17px" }}
            autoComplete="off"
          />
        </div>
      </form>

      <div>
        {!trimmed && <EmptyState />}

        {verseRef && currentReferenceLoading && <LoadingState />}
        {verseRef && !currentReferenceLoading && displayedReference && (
          <ul className="space-y-3" aria-label="Search results">
            <ReferenceCard reference={displayedReference} />
          </ul>
        )}
        {verseRef && !currentReferenceLoading && !displayedReference && (
          <NoResultsState query={trimmed} />
        )}

        {!verseRef && trimmed && loading && <LoadingState />}
        {!verseRef && trimmed && !loading && results.length === 0 && (
          <NoResultsState query={trimmed} />
        )}
        {!verseRef && trimmed && !loading && results.length > 0 && (
          <ul className="space-y-3" aria-label="Search results">
            {results.map((r) => (
              <ResultCard key={resultKey(r)} result={r} query={trimmed} />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function SearchIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="var(--text-muted)"
      strokeWidth="1.8"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}
