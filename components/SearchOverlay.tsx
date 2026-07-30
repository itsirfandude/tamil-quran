"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { SearchEntry } from "@/lib/types";

export function SearchOverlay({ onClose }: { onClose: () => void }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const trimmed = query.trim();

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
  }, [query]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

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
      <div
        className="ink-raised w-full max-w-2xl rounded-2xl overflow-hidden mt-16"
      >
        <div className="flex items-center gap-3 p-4 border-b" style={{ borderColor: "var(--border)" }}>
          <SearchIcon />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="தமிழில் தேடுங்கள்... (search in Tamil)"
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
          {loading && (
            <p className="p-6 text-sm" style={{ color: "var(--text-muted)" }}>
              Searching…
            </p>
          )}
          {!loading && query.trim().length >= 2 && results.length === 0 && (
            <p className="p-6 text-sm" style={{ color: "var(--text-muted)" }}>
              No verses found for &ldquo;{query}&rdquo;.
            </p>
          )}
          {!loading && query.trim().length < 2 && (
            <p className="p-6 text-sm" style={{ color: "var(--text-muted)" }}>
              Type at least 2 characters to search the Tamil translation.
            </p>
          )}
          <ul>
            {results.map((r) => {
              const idx = r.tamil.indexOf(query.trim());
              const before = r.tamil.slice(Math.max(0, idx - 40), idx);
              const match = r.tamil.slice(idx, idx + query.trim().length);
              const after = r.tamil.slice(
                idx + query.trim().length,
                idx + query.trim().length + 60
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
                      <mark
                        style={{ background: "var(--selection)", color: "var(--text)" }}
                      >
                        {match}
                      </mark>
                      {after}
                      {idx + query.trim().length + 60 < r.tamil.length && "…"}
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
