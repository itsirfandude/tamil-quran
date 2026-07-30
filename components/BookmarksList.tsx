"use client";

import Link from "next/link";
import { usePrefs } from "./PrefsProvider";

export function BookmarksList({
  surahNames,
}: {
  surahNames: Record<number, string>;
}) {
  const { bookmarks, toggleBookmark } = usePrefs();

  if (bookmarks.length === 0) {
    return (
      <div className="ink-card rounded-2xl p-8 text-center">
        <p style={{ color: "var(--text-muted)" }}>
          நீங்கள் இதுவரை எதையும் குறிக்கவில்லை.
        </p>
        <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
          Bookmark a verse while reading and it will appear here.
        </p>
        <Link
          href="/"
          className="inline-block mt-4 text-sm"
          style={{ color: "var(--accent-2)" }}
        >
          Go to Surahs →
        </Link>
      </div>
    );
  }

  const sorted = [...bookmarks].sort((a, b) => b.createdAt - a.createdAt);

  return (
    <ul className="space-y-3">
      {sorted.map((b) => {
        const verseLabel =
          b.verses.length > 1
            ? `${b.verses[0]}-${b.verses[b.verses.length - 1]}`
            : `${b.verses[0]}`;
        return (
          <li
            key={b.key}
            className="ink-card flex items-center justify-between rounded-xl px-4 py-3.5"
          >
            <Link href={`/surah/${b.surah}#${b.verses[0]}`} className="min-w-0 flex-1">
              <p className="font-tamil-text truncate" style={{ fontSize: "16px", color: "var(--text)" }}>
                {surahNames[b.surah] ?? `Surah ${b.surah}`}
              </p>
              <p className="text-xs" style={{ color: "var(--accent-2)" }}>
                {b.surah}:{verseLabel}
              </p>
            </Link>
            <button
              onClick={() => toggleBookmark(b)}
              aria-label="Remove bookmark"
              className="ml-3 text-xs px-3 py-1.5 rounded-full border"
              style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}
            >
              Remove
            </button>
          </li>
        );
      })}
    </ul>
  );
}
