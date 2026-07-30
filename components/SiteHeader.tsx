"use client";

import { useState } from "react";
import Link from "next/link";
import { SettingsPanel } from "./SettingsPanel";
import { SearchOverlay } from "./SearchOverlay";

export function SiteHeader() {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded focus:px-3 focus:py-2"
        style={{ background: "var(--bg-raised)", color: "var(--text)" }}
      >
        Skip to content
      </a>
      <header
        className="sticky top-0 z-40 border-b backdrop-blur"
        style={{
          background: "color-mix(in srgb, var(--bg) 88%, transparent)",
          borderColor: "var(--border)",
        }}
      >
        <div className="mx-auto max-w-5xl px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <span
              className="font-display italic text-xl sm:text-2xl"
              style={{ color: "var(--text)" }}
            >
              திருக்குர்ஆன்
            </span>
          </Link>

          <nav className="flex items-center gap-1 sm:gap-2">
            <Link
              href="/about"
              className="hidden sm:inline-flex items-center h-9 px-3 rounded-full text-sm hover:opacity-100"
              style={{ color: "var(--text-muted)" }}
            >
              அறிமுகம்
            </Link>
            <button
              onClick={() => setSearchOpen(true)}
              aria-label="Search"
              className="h-9 w-9 flex items-center justify-center rounded-full hover:opacity-100"
              style={{ color: "var(--text-muted)" }}
            >
              <SearchIcon />
            </button>
            <Link
              href="/bookmarks"
              aria-label="Bookmarks"
              className="h-9 w-9 flex items-center justify-center rounded-full hover:opacity-100"
              style={{ color: "var(--text-muted)" }}
            >
              <BookmarkNavIcon />
            </Link>
            <div className="relative">
              <button
                onClick={() => setSettingsOpen((v) => !v)}
                aria-label="Reading settings"
                aria-expanded={settingsOpen}
                className="h-9 w-9 flex items-center justify-center rounded-full hover:opacity-100"
                style={{ color: "var(--text-muted)" }}
              >
                <SettingsIcon />
              </button>
              {settingsOpen && (
                <SettingsPanel onClose={() => setSettingsOpen(false)} />
              )}
            </div>
          </nav>
        </div>
      </header>
      {searchOpen && <SearchOverlay onClose={() => setSearchOpen(false)} />}
    </>
  );
}

function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}

function BookmarkNavIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M6 3h12a1 1 0 0 1 1 1v17l-7-4.5L5 21V4a1 1 0 0 1 1-1Z" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" />
    </svg>
  );
}
