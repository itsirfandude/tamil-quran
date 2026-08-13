"use client";

import { usePrefs } from "./PrefsProvider";
import { VerseBadge } from "./VerseBadge";
import { TamilWithNotes } from "./TamilWithNotes";
import { AyahShareMenu } from "./AyahShareMenu";
import type { AyahGroup } from "@/lib/types";

export function AyahCard({
  surah,
  surahName,
  group,
}: {
  surah: number;
  surahName: string;
  group: AyahGroup;
}) {
  const { prefs, isBookmarked, toggleBookmark } = usePrefs();
  const key = `${surah}:${group.verses.join("-")}`;
  const bookmarked = isBookmarked(key);
  const verseLabel =
    group.verses.length > 1
      ? `${group.verses[0]}-${group.verses[group.verses.length - 1]}`
      : `${group.verses[0]}`;

  return (
    <article
      id={`${group.verses[0]}`}
      className="ink-card scroll-mt-24 rounded-2xl p-6 sm:p-8"
      data-verses={verseLabel}
    >
      <div className="flex items-center justify-between mb-4">
        <VerseBadge verses={group.verses} />
        <div className="flex items-center gap-1">
          <AyahShareMenu
            surah={surah}
            surahName={surahName}
            group={group}
          />
          <ActionButton
            label={bookmarked ? "Remove bookmark" : "Bookmark"}
            onClick={() =>
              toggleBookmark({ key, surah, verses: group.verses })
            }
            active={bookmarked}
          >
            <BookmarkIcon filled={bookmarked} />
          </ActionButton>
        </div>
      </div>

      {prefs.showArabic && (
        <p
          className="font-arabic-text text-right mb-5"
          style={{ color: "var(--text)" }}
        >
          {group.arabic}
        </p>
      )}

      {prefs.showTamil && (
        <p className="font-tamil-text" style={{ color: "var(--text)" }}>
          <TamilWithNotes text={group.tamil} />
        </p>
      )}
    </article>
  );
}

function ActionButton({
  children,
  label,
  onClick,
  active,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="inline-flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:opacity-100"
      style={{
        color: active ? "var(--accent-2)" : "var(--text-muted)",
        opacity: active ? 1 : 0.75,
      }}
    >
      {children}
    </button>
  );
}

function BookmarkIcon({ filled }: { filled?: boolean }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path d="M6 3h12a1 1 0 0 1 1 1v17l-7-4.5L5 21V4a1 1 0 0 1 1-1Z" />
    </svg>
  );
}
