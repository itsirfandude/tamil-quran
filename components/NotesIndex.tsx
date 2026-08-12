"use client";

import { useMemo, useState } from "react";
import type { NoteIndexEntry } from "@/lib/types";
import { IndexCard } from "@/components/IndexCard";

export function NotesIndex({ notes }: { notes: NoteIndexEntry[] }) {
  const [query, setQuery] = useState("");
  const trimmedQuery = query.trim().toLocaleLowerCase();

  const filteredNotes = useMemo(() => {
    if (!trimmedQuery) return notes;

    return notes.filter(
      (note) =>
        String(note.number).includes(trimmedQuery) ||
        note.title.toLocaleLowerCase().includes(trimmedQuery),
    );
  }, [notes, trimmedQuery]);

  return (
    <>
      <div className="mb-8">
        <label htmlFor="notes-search" className="sr-only">
          விளக்கங்களைத் தேடுங்கள்
        </label>

        <div
          className="flex items-center rounded-2xl border px-4"
          style={{
            borderColor: "var(--border)",
            background: "var(--surface)",
          }}
        >
          <SearchIcon />

          <input
            id="notes-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="விளக்கங்களைத் தேடுங்கள்..."
            className="font-tamil-text h-14 min-w-0 flex-1 bg-transparent px-3 text-base outline-none"
            style={{ color: "var(--text)" }}
          />

          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="px-2 text-sm"
              style={{ color: "var(--text-muted)" }}
              aria-label="தேடலை அழிக்க"
            >
              ×
            </button>
          )}
        </div>
      </div>

      <div className="mb-5 flex items-baseline justify-between">
        <h2 className="font-tamil-text text-lg" style={{ color: "var(--text)" }}>
          அனைத்து விளக்கங்கள்
        </h2>

        <span className="font-tamil-text text-sm" style={{ color: "var(--text-muted)" }}>
          {filteredNotes.length} / {notes.length} விளக்கங்கள்
        </span>
      </div>

      {filteredNotes.length > 0 ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filteredNotes.map((note) => (
            <IndexCard
              key={note.number}
              href={`/notes/${note.number}`}
              number={note.number}
              title={note.title}
            />
          ))}
        </div>
      ) : (
        <div
          className="rounded-2xl border p-6 text-center"
          style={{
            borderColor: "var(--border)",
            background: "var(--surface)",
          }}
        >
          <p className="font-tamil-text text-lg" style={{ color: "var(--text)" }}>
            விளக்கங்கள் எதுவும் கிடைக்கவில்லை.
          </p>
          <p className="font-tamil-text mt-2 text-sm" style={{ color: "var(--text-muted)" }}>
            வேறு சொல்லைப் பயன்படுத்திப் பாருங்கள்.
          </p>
        </div>
      )}
    </>
  );
}

function SearchIcon() {
  return (
    <svg
      width="19"
      height="19"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
      style={{ color: "var(--text-muted)" }}
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}
