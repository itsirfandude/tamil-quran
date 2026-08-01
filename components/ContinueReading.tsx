"use client";

import Link from "next/link";
import { usePrefs } from "./PrefsProvider";

export function ContinueReading({
  surahNames,
}: {
  surahNames: Record<number, string>;
}) {
  const { progress } = usePrefs();

  if (!progress) {
    return (
      <Link
        href="/surah/1"
        className="ink-card group flex items-center justify-between rounded-2xl p-6 sm:p-7 hover:-translate-y-0.5"
      >
        <div>
          <p className="text-xs uppercase tracking-wider mb-1" style={{ color: "var(--accent-2)" }}>
            Begin
          </p>
          <p className="font-display text-lg" style={{ color: "var(--text)" }}>
            அல்ஃபாத்திஹாவிலிருந்து தொடங்குங்கள்
          </p>
        </div>
        <ArrowIcon />
      </Link>
    );
  }

  const verseLabel =
    progress.verses.length > 1
      ? `${progress.verses[0]}-${progress.verses[progress.verses.length - 1]}`
      : `${progress.verses[0]}`;

  return (
    <Link
      href={`/surah/${progress.surah}#${progress.verses[0]}`}
      className="ink-card group flex items-center justify-between rounded-2xl p-6 sm:p-7 hover:-translate-y-0.5"
    >
      <div>
        <p className="text-xs uppercase tracking-wider mb-1" style={{ color: "var(--accent-2)" }}>
          தொடர்ந்து படிக்க · Continue
        </p>
        <p className="font-display text-lg" style={{ color: "var(--text)" }}>
          {surahNames[progress.surah] ?? `Surah ${progress.surah}`}
          <span className="opacity-60"> · {progress.surah}:{verseLabel}</span>
        </p>
      </div>
      <ArrowIcon />
    </Link>
  );
}

function ArrowIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="var(--accent-2)"
      strokeWidth="1.8"
      className="transition-transform group-hover:translate-x-1"
    >
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}
