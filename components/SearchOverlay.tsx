"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { VerseResult, SearchResult } from "@/lib/search";
import {
  parseVerseReference,
  fetchVerseReference,
  type ResolvedVerseReference,
} from "@/lib/reference-search";

interface SurahJumpResult {
  href: string;
  label: string;
}

export function SearchOverlay({ onClose }: { onClose: () => void }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<VerseResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [reference, setReference] =
    useState<ResolvedVerseReference | null>(null);
  const [referenceLoading, setReferenceLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;
    const previousRootOverflow = root.style.overflow;
    const previousBodyOverflow = body.style.overflow;

    root.style.overflow = "hidden";
    body.style.overflow = "hidden";

    const viewport = window.visualViewport;

    const updateViewportHeight = () => {
      const height = viewport?.height ?? window.innerHeight;
      root.style.setProperty("--search-viewport-height", `${height}px`);
    };

    updateViewportHeight();
    viewport?.addEventListener("resize", updateViewportHeight);
    window.addEventListener("resize", updateViewportHeight);
    inputRef.current?.focus();

    return () => {
      viewport?.removeEventListener("resize", updateViewportHeight);
      window.removeEventListener("resize", updateViewportHeight);
      root.style.removeProperty("--search-viewport-height");
      root.style.overflow = previousRootOverflow;
      body.style.overflow = previousBodyOverflow;
    };
  }, []);

  const trimmed = query.trim();

  const bareSurah = /^(\d{1,3})$/.exec(trimmed);
  const verseRef = parseVerseReference(trimmed);

  const bareSurahValid =
    bareSurah &&
    Number(bareSurah[1]) >= 1 &&
    Number(bareSurah[1]) <= 114
      ? Number(bareSurah[1])
      : null;

  useEffect(() => {
    if (bareSurah || verseRef) {
      // These values mirror the derived reference state before the next
      // search request is allowed to update it.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setResults([]);
      setLoading(false);
      return;
    }

    if (trimmed.length < 2) {
      setResults([]);
      setLoading(false);
      return;
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
          setResults(
            data.filter((r): r is VerseResult => r.type === "verse"),
          );
          setLoading(false);
        })
        .catch((error: unknown) => {
          if (
            error instanceof DOMException &&
            error.name === "AbortError"
          ) {
            return;
          }

          setResults([]);
          setLoading(false);
        });
    }, 250);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trimmed, !!bareSurah, !!verseRef]);

  useEffect(() => {
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

    setReferenceLoading(true);
    setReference(null);

    fetchVerseReference(verseRef, { signal: controller.signal })
      .then((resolved) => {
        setReference(resolved);
        setReferenceLoading(false);
      })
      .catch((error: unknown) => {
        if (
          error instanceof DOMException &&
          error.name === "AbortError"
        ) {
          return;
        }

        setReference(null);
        setReferenceLoading(false);
      });

    return () => controller.abort();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [verseRef?.surah, verseRef?.verse]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }

    window.addEventListener("keydown", onKey);

    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const bareSurahResult: SurahJumpResult | null = bareSurahValid
    ? {
        href: `/surah/${bareSurahValid}`,
        label: `Surah ${bareSurahValid}`,
      }
    : null;

  return (
    <div
      className="fixed inset-x-0 top-0 z-50 flex items-start justify-center overflow-hidden p-4 sm:p-8"
      style={{
        height: "var(--search-viewport-height, 100dvh)",
        background: "rgba(0,0,0,0.55)",
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Search the Quran"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="ink-raised mt-4 flex max-h-full w-full max-w-2xl flex-col overflow-hidden rounded-2xl sm:mt-16">
        {/* Search input */}
        <div
          className="flex items-center gap-3 border-b p-4"
          style={{ borderColor: "var(--border)" }}
        >
          <SearchIcon />

          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="தமிழில் தேடுக..."
            className="flex-1 bg-transparent font-tamil-text text-base outline-none"
            style={{
              color: "var(--text)",
              fontSize: "17px",
            }}
            aria-label="Search Tamil translation"
          />

          <button
            onClick={onClose}
            className="hidden rounded border px-2 py-1 text-xs sm:inline-flex"
            style={{
              borderColor: "var(--border)",
              color: "var(--text-muted)",
            }}
          >
            Esc
          </button>
        </div>

        {/* Tamil search hint */}
        <div
          className="border-b px-4 py-3"
          style={{ borderColor: "var(--border)" }}
        >
          <p
            className="font-tamil-text text-sm"
            style={{ color: "var(--text-muted)" }}
          >
            ஸூரா அல்லது வசன எண்ணை உள்ளிடலாம் (எ.கா. 2:255)
          </p>
        </div>

        {/* Advanced search */}
        <div
          className="flex items-center justify-end border-b px-4 py-2"
          style={{ borderColor: "var(--border)" }}
        >
          <Link
            href="/search"
            onClick={onClose}
            className="text-sm font-medium hover:underline"
            style={{ color: "var(--accent-2)" }}
          >
            மேம்பட்ட தேடல் →
          </Link>
        </div>

        {/* Results */}
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          {bareSurahResult && (
            <Link
              href={bareSurahResult.href}
              onClick={onClose}
              className="block border-b px-4 py-3 transition-colors hover:bg-black/5"
              style={{ borderColor: "var(--border)" }}
            >
              <div
                className="text-xs"
                style={{ color: "var(--accent-2)" }}
              >
                {bareSurahResult.label} · Go to Surah
              </div>
            </Link>
          )}

          {verseRef && referenceLoading && (
            <p
              className="p-6 text-sm"
              style={{ color: "var(--text-muted)" }}
            >
              Loading…
            </p>
          )}

          {verseRef && !referenceLoading && reference && (
            <Link
              href={reference.href}
              onClick={onClose}
              className="block border-b px-4 py-3 transition-colors hover:bg-black/5"
              style={{ borderColor: "var(--border)" }}
            >
              <div
                className="mb-1 text-xs"
                style={{ color: "var(--accent-2)" }}
              >
                {reference.label} · Jump to verse
              </div>

              {reference.preview && (
                <p
                  className="font-tamil-text text-sm leading-relaxed"
                  style={{ color: "var(--text)" }}
                >
                  {reference.preview}
                </p>
              )}
            </Link>
          )}

          {verseRef && !referenceLoading && !reference && (
            <p
              className="p-6 text-sm"
              style={{ color: "var(--text-muted)" }}
            >
              No verse {verseRef.verse} found in Surah {verseRef.surah}.
            </p>
          )}

          {bareSurah && !bareSurahResult && (
            <p
              className="p-6 text-sm"
              style={{ color: "var(--text-muted)" }}
            >
              Surah numbers are 1–114. For a specific verse, try 2:183.
            </p>
          )}

          {!bareSurah && !verseRef && loading && (
            <p
              className="p-6 text-sm"
              style={{ color: "var(--text-muted)" }}
            >
              Searching…
            </p>
          )}

          {!bareSurah &&
            !verseRef &&
            !loading &&
            trimmed.length >= 2 &&
            results.length === 0 && (
              <p
                className="p-6 text-sm"
                style={{ color: "var(--text-muted)" }}
              >
                No verses found for &ldquo;{query}&rdquo;.
              </p>
            )}

          <ul>
            {results.map((r) => {
              const idx = r.snippet
                .toLowerCase()
                .indexOf(trimmed.toLowerCase());

              const before =
                idx === -1 ? r.snippet : r.snippet.slice(0, idx);

              const match =
                idx === -1
                  ? ""
                  : r.snippet.slice(idx, idx + trimmed.length);

              const after =
                idx === -1
                  ? ""
                  : r.snippet.slice(idx + trimmed.length);

              return (
                <li key={`${r.surah}-${r.verses.join("-")}`}>
                  <Link
                    href={r.href}
                    onClick={onClose}
                    className="block border-b px-4 py-3 transition-colors hover:bg-black/5"
                    style={{ borderColor: "var(--border)" }}
                  >
                    <div
                      className="mb-1 text-xs"
                      style={{ color: "var(--accent-2)" }}
                    >
                      {r.label}
                    </div>

                    <p
                      className="font-tamil-text text-sm leading-relaxed"
                      style={{ color: "var(--text)" }}
                    >
                      {before}

                      {match && (
                        <mark
                          style={{
                            background: "var(--selection)",
                            color: "var(--text)",
                          }}
                        >
                          {match}
                        </mark>
                      )}

                      {after}
                    </p>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
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
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}
