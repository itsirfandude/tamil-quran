"use client";

import { useState } from "react";
import { usePrefs } from "./PrefsProvider";
import { useNotes } from "./NotesProvider";
import { VerseBadge } from "./VerseBadge";
import type { AyahGroup } from "@/lib/types";

const NOTE_MARKER = /\u00a4(\d+)\u00a4/g;

function TamilWithNotes({ text }: { text: string }) {
  const { openNote } = useNotes();
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  const re = new RegExp(NOTE_MARKER);
  let key = 0;

  while ((match = re.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    const noteNumber = match[1];
    parts.push(
      <button
        key={`note-${key++}`}
        type="button"
        onClick={() => openNote(Number(noteNumber))}
        className="inline-flex align-super text-[0.6em] leading-none font-ui font-semibold px-[0.3em] mx-[0.05em] rounded hover:underline"
        style={{ color: "var(--accent-2)" }}
        aria-label={`Explanatory note ${noteNumber}`}
      >
        {noteNumber}
      </button>
    );
    lastIndex = re.lastIndex;
  }
  if (lastIndex < text.length) parts.push(text.slice(lastIndex));

  return <>{parts}</>;
}

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
  const [copied, setCopied] = useState(false);
  const key = `${surah}:${group.verses.join("-")}`;
  const bookmarked = isBookmarked(key);
  const verseLabel =
    group.verses.length > 1
      ? `${group.verses[0]}-${group.verses[group.verses.length - 1]}`
      : `${group.verses[0]}`;

  async function handleCopy() {
    const plainText = group.tamil.replace(NOTE_MARKER, "");
    const text = `${plainText}\n\n(${surahName} ${surah}:${verseLabel})`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable */
    }
  }

  async function handleShare() {
    const url = `${window.location.origin}/surah/${surah}#${group.verses[0]}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: `${surahName} ${verseLabel}`, url });
        return;
      } catch {
        /* user cancelled */
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  }

  return (
    <article
      id={`${group.verses[0]}`}
      className="ink-card scroll-mt-24 rounded-2xl p-6 sm:p-8"
      data-verses={verseLabel}
    >
      <div className="flex items-center justify-between mb-4">
        <VerseBadge verses={group.verses} />
        <div className="flex items-center gap-1">
          <ActionButton label={copied ? "Copied" : "Copy"} onClick={handleCopy}>
            <CopyIcon />
          </ActionButton>
          <ActionButton label="Share" onClick={handleShare}>
            <ShareIcon />
          </ActionButton>
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

function CopyIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="8" y="8" width="12" height="12" rx="2" />
      <path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" />
    </svg>
  );
}

function ShareIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="18" cy="5" r="2.5" />
      <circle cx="6" cy="12" r="2.5" />
      <circle cx="18" cy="19" r="2.5" />
      <path d="M8.3 10.7 15.7 6.6M8.3 13.3l7.4 4.1" />
    </svg>
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
