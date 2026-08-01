"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { SearchEntry, Surah } from "@/lib/types";

const NOTE_MARKER = /\u00a4(\d+)\u00a4/g;

interface ReferenceResult {
  href: string;
  label: string;
  preview?: string;
}

export function SearchOverlay({ onClose }: { onClose: () => void }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [reference, setReference] = useState<ReferenceResult | null>(null);
  const [referenceLoading, setReferenceLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const trimmed = query.trim();

  const bareSurah = /^(\d{1,3})$/.exec(trimmed);
  const verseRef = /^(\d{1,3})\s*[:.]\s*(\d{1,3})(?:\s*-\s*\d{1,3})?$/.exec(
    trimmed
  );

  const bareSurahValid =
    bareSurah && Number(bareSurah[1]) >= 1 && Number(bareSurah[1]) <= 114
      ? Number(bareSurah[1])
      : null;

  useEffect(() => {
    if (bareSurah || verseRef) {
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
        .then((data: SearchEntry[]) => {
          setResults(data);
          setLoading(false);
        })
        .catch((error: unknown) => {
          if (error instanceof DOMException && error.name === "AbortError") return;
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
      setReference(null);
      setReferenceLoading(false);
      return;
    }
    const surahNum = Number(verseRef[1]);
    const verseNum = Number(verseRef[2]);
    if (surahNum < 1 || surahNum > 114) {
      setReference(null);
      setReferenceLoading(false);
      return;
    }

    const controller = new AbortController();
    setReferenceLoading(true);
    setReference(null);

    fetch(`/data/surah/${surahNum}.json`, { signal: controller.signal })
      .then((r) => {
        if (!r.ok) throw new Error("Surah fetch failed");
        return r.json();
      })
      .then((surah: Surah) => {
        const match = surah.ayah_groups.find((g) =>
          g.verses.includes(verseNum)
        );
        if (match) {
          const verseLabel =
            match.verses.length > 1
              ? `${match.verses[0]}-${match.verses[match.verses.length - 1]}`
              : `${match.verses[0]}`;
          setReference({
            href: `/surah/${surahNum}#${match.verses[0]}`,
            label: `${surahNum}:${verseLabel}`,
            preview: match.tamil.replace(NOTE_MARKER, ""),
          });
        } else {
          setReference(null);
        }
        setReferenceLoading(false);
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setReference(null);
        setReferenceLoading(false);
      });

    return () => controller.abort();
  }, [verseRef?.[0]]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const bareSurahResult: ReferenceResult | null = bareSurahValid
    ? { href: `/surah/${bareSurahValid}`, label: `Surah ${bareSurahValid}` }
    : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center p-4 sm:p-8"
      style={{ background: "rgba(0,0,0,0.55)" }}
      role="dialog"
      aria-modal="true"
      aria-label="Search the Quran"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="ink-raised w-full max-w-2xl rounded-2xl overflow-hidden mt-16">
        <div className="flex items-center gap-3 p-4 border-b" style={{ borderColor: "var(--border)" }}>
          <SearchIcon />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="தமிழில் தேடுங்கள் அல்லது 2:183 எனத் தேடுங்கள்... (search Tamil, or try 2:183)"
            className="flex-1 bg-transparent outline-none font-tamil-text text-base"
            style={{ color: "var(--text)", fontSize: "17px" }}
            aria-label="Search Tamil translation"
          />
          <button
            onClick={onClose}
            className="text-xs px-2 py-1 rounded border"
            style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}
          >
            Esc
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto">
          {bareSurahResult && (
            <Link
              href={bareSurahResult.href}
              onClick={onClose}
              className="block px-4 py-3 border-b hover:bg-black/5 transition-colors"
              style={{ borderColor: "var(--border)" }}
            >
              <div className="text-xs" style={{ color: "var(--accent-2)" }}>
                {bareSurahResult.label} · Go to Surah
              </div>
            </Link>
          )}

          {verseRef && referenceLoading && (
            <p className="p-6 text-sm" style={{ color: "var(--text-muted)" }}>
              Loading…
            </p>
          )}

          {verseRef && !referenceLoading && reference && (
            <Link
              href={reference.href}
              onClick={onClose}
              className="block px-4 py-3 border-b hover:bg-black/5 transition-colors"
              style={{ borderColor: "var(--border)" }}
            >
              <div className="text-xs mb-1" style={{ color: "var(--accent-2)" }}>
                {reference.label} · Jump to verse
              </div>
              {reference.preview && (
                <p className="font-tamil-text text-sm leading-relaxed" style={{ color: "var(--text)" }}>
                  {reference.preview}
                </p>
              )}
            </Link>
          )}

          {verseRef && !referenceLoading && !reference && (
            <p className="p-6 text-sm" style={{ color: "var(--text-muted)" }}>
              No verse {verseRef[2]} found in Surah {verseRef[1]}.
            </p>
          )}

          {bareSurah && !bareSurahResult && (
            <p className="p-6 text-sm" style={{ color: "var(--text-muted)" }}>
              Surah numbers are 1–114. For a specific verse, try 2:183.
            </p>
          )}

          {!bareSurah && !verseRef && loading && (
            <p className="p-6 text-sm" style={{ color: "var(--text-muted)" }}>
              Searching…
            </p>
          )}
          {!bareSurah &&
            !verseRef &&
            !loading &&
            trimmed.length >= 2 &&
            results.length === 0 && (
              <p className="p-6 text-sm" style={{ color: "var(--text-muted)" }}>
                No verses found for &ldquo;{query}&rdquo;.
              </p>
            )}
          {!bareSurah && !verseRef && trimmed.length < 2 && (
            <p className="p-6 text-sm" style={{ color: "var(--text-muted)" }}>
              Type at least 2 characters to search the Tamil translation, or
              try a reference like 2:183 or just 96.
            </p>
          )}
          <ul>
            {results.map((r) => {
              const idx = r.tamil.indexOf(trimmed);
              const before = r.tamil.slice(Math.max(0, idx - 40), idx);
              const match = r.tamil.slice(idx, idx + trimmed.length);
              const after = r.tamil.slice(
                idx + trimmed.length,
                idx + trimmed.length + 60
              );
              const verseLabel =
                r.verses.length > 1
                  ? `${r.verses[0]}-${r.verses[r.verses.length - 1]}`
                  : `${r.verses[0]}`;
              return (
                <li key={`${r.surah}-${r.verses.join("-")}`}>
                  <Link
                    href={`/surah/${r.surah}#${r.verses[0]}`}
                    onClick={onClose}
                    className="block px-4 py-3 border-b hover:bg-black/5 transition-colors"
                    style={{ borderColor: "var(--border)" }}
                  >
                    <div className="text-xs mb-1" style={{ color: "var(--accent-2)" }}>
                      {r.surah}:{verseLabel}
                    </div>
                    <p className="font-tamil-text text-sm leading-relaxed" style={{ color: "var(--text)" }}>
                      {idx > 0 && "…"}
                      {before}
                      <mark style={{ background: "var(--selection)", color: "var(--text)" }}>
                        {match}
                      </mark>
                      {after}
                      {idx + trimmed.length + 60 < r.tamil.length && "…"}
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
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.8">
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}
