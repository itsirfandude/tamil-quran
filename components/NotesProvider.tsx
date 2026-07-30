"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import Link from "next/link";
import type { Note } from "@/lib/types";

interface NotesContextValue {
  openNote: (number: number) => void;
}

const NotesContext = createContext<NotesContextValue | null>(null);

export function NotesProvider({ children }: { children: React.ReactNode }) {
  const [activeNumber, setActiveNumber] = useState<number | null>(null);
  const [note, setNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(false);

  const openNote = useCallback((number: number) => {
    setActiveNumber(number);
  }, []);

  useEffect(() => {
    if (activeNumber == null) return;
    setLoading(true);
    setNote(null);
    fetch(`/data/notes/${activeNumber}.json`)
      .then((r) => r.json())
      .then((data: Note) => setNote(data))
      .finally(() => setLoading(false));
  }, [activeNumber]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setActiveNumber(null);
    }
    if (activeNumber != null) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [activeNumber]);

  const value = useMemo(() => ({ openNote }), [openNote]);

  return (
    <NotesContext.Provider value={value}>
      {children}
      {activeNumber != null && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6"
          style={{ background: "rgba(0,0,0,0.6)" }}
          role="dialog"
          aria-modal="true"
          aria-label={note ? note.title : "Explanatory note"}
          onClick={(e) => {
            if (e.target === e.currentTarget) setActiveNumber(null);
          }}
        >
          <div
            className="ink-raised w-full sm:max-w-lg max-h-[85vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl p-6 sm:p-8"
          >
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <p
                  className="text-xs uppercase tracking-wider mb-1"
                  style={{ color: "var(--accent-2)" }}
                >
                  குறிப்பு {activeNumber} · Note
                </p>
                <h2
                  className="font-display text-xl italic"
                  style={{ color: "var(--text)" }}
                >
                  {loading ? "…" : note?.title}
                </h2>
              </div>
              <button
                onClick={() => setActiveNumber(null)}
                aria-label="Close note"
                className="shrink-0 h-8 w-8 flex items-center justify-center rounded-full"
                style={{ color: "var(--text-muted)" }}
              >
                ✕
              </button>
            </div>

            {loading && (
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                ஏற்றுகிறது…
              </p>
            )}

            {!loading && note && (
              <div className="space-y-3">
                {note.paragraphs.map((p, i) => (
                  <p
                    key={i}
                    className="font-tamil-text"
                    style={{
                      fontSize: "17px",
                      lineHeight: 1.8,
                      color: "var(--text)",
                    }}
                  >
                    {p}
                  </p>
                ))}
                <Link
                  href={`/notes/${activeNumber}`}
                  className="inline-block mt-2 text-xs"
                  style={{ color: "var(--accent-2)" }}
                  onClick={() => setActiveNumber(null)}
                >
                  Permalink to this note →
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </NotesContext.Provider>
  );
}

export function useNotes() {
  const ctx = useContext(NotesContext);
  if (!ctx) throw new Error("useNotes must be used within NotesProvider");
  return ctx;
}
