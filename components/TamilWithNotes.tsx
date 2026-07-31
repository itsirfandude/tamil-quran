"use client";

import { useNotes } from "./NotesProvider";

export const NOTE_MARKER = /\u00a4(\d+)\u00a4/g;

export function TamilWithNotes({ text }: { text: string }) {
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