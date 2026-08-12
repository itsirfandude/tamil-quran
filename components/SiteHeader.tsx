"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { SettingsPanel } from "./SettingsPanel";
import { SearchOverlay } from "./SearchOverlay";

export function SiteHeader() {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const ignoreMenuClick = useRef(false);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setMobileMenuOpen(false);
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  function closeMobileMenu() {
    setMobileMenuOpen(false);
  }

  function toggleMobileMenu() {
    setMobileMenuOpen((open) => {
      if (open) setSettingsOpen(false);
      return !open;
    });
  }


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
          background: "var(--bg)",
          borderColor: "var(--border)",
        }}
      >
        <div className="relative mx-auto flex min-h-16 max-w-5xl items-center justify-between gap-3 px-4 sm:px-6">
          <Link
  href="/"
  aria-label="திருக்குர்ஆன் முகப்பு"
  className="flex min-w-0 shrink items-center gap-2 sm:gap-3"
>
  <img
    src="/icons/icon-192x192.png"
    alt=""
    aria-hidden="true"
    className="h-11 w-11 shrink-0 rounded-lg object-cover"
  />

  <span
    className="min-w-0 truncate font-display text-xl font-medium sm:text-2xl"
    style={{ color: "var(--text)" }}
  >
    திருக்குர்ஆன்
  </span>
</Link>

          <nav className="hidden items-center gap-1 sm:flex sm:gap-2">

             <Link
              href="/about"
              className="hidden h-9 items-center rounded-full px-3 text-sm sm:inline-flex"
              style={{ color: "var(--text-muted)" }}
            >
              அறிமுகம்
            </Link>


            <Link

    href="/topics"

    className="hidden h-9 items-center rounded-full px-3 text-sm sm:inline-flex"

    style={{ color: "var(--text-muted)" }}

  >

    பொருள் அட்டவணை

  </Link>


              <Link

    href="/notes"

    className="hidden h-9 items-center rounded-full px-3 text-sm sm:inline-flex"

    style={{ color: "var(--text-muted)" }}

  >

    விளக்கங்கள்

  </Link>

            <button
              onClick={() => setSearchOpen(true)}
              aria-label="Search"
              className="flex h-9 w-9 items-center justify-center rounded-full"
              style={{ color: "var(--text-muted)" }}
            >
              <SearchIcon />
            </button>

            <Link
              href="/bookmarks"
              aria-label="Bookmarks"
              className="flex h-9 w-9 items-center justify-center rounded-full"
              style={{ color: "var(--text-muted)" }}
            >
              <BookmarkNavIcon />
            </Link>

            <div className="relative">
              <button
                onClick={() => setSettingsOpen((v) => !v)}
                aria-label="Reading settings"
                aria-expanded={settingsOpen}
                className="flex h-9 w-9 items-center justify-center rounded-full"
                style={{ color: "var(--text-muted)" }}
              >
                <SettingsIcon />
              </button>

            </div>
          </nav>

          <div className="flex shrink-0 items-center gap-0 sm:hidden">
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                setSearchOpen(true);
              }}
              aria-label="Search"
              className="flex h-11 w-11 items-center justify-center rounded-full"
              style={{ color: "var(--text-muted)" }}
            >
              <SearchIcon />
            </button>

            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                setSettingsOpen((v) => !v);
              }}
              aria-label="Reading settings"
              aria-expanded={settingsOpen}
              className="flex h-11 w-11 items-center justify-center rounded-full"
              style={{ color: "var(--text-muted)" }}
            >
              <SettingsIcon />
            </button>

            <button
              type="button"
              onPointerDown={(event) => {
                ignoreMenuClick.current = false;
                if (event.pointerType === "touch") {
                  event.preventDefault();
                  ignoreMenuClick.current = true;
                  toggleMobileMenu();
                }
              }}
              onPointerCancel={() => {
                ignoreMenuClick.current = false;
              }}
              onClick={() => {
                if (ignoreMenuClick.current) {
                  ignoreMenuClick.current = false;
                  return;
                }
                toggleMobileMenu();
              }}
              aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-navigation"
              className="flex h-11 w-11 touch-manipulation select-none items-center justify-center rounded-full"
              style={{ color: "var(--text)" }}
            >
              <MenuIcon open={mobileMenuOpen} />
            </button>
          </div>

          {settingsOpen && !mobileMenuOpen && (
            <div className="absolute right-4 top-full z-50 w-80 max-w-[calc(100vw-2rem)] sm:right-0 sm:top-0 sm:max-w-[90vw]">
              <SettingsPanel onClose={() => setSettingsOpen(false)} />
            </div>
          )}
        </div>

        <div
          id="mobile-navigation"
          hidden={!mobileMenuOpen}
          className="border-t px-4 pb-4 pt-2 sm:hidden"
          style={{ borderColor: "var(--border)" }}
        >
            <nav aria-label="Mobile navigation" className="flex flex-col">
              <MobileNavLink href="/topics" onClick={closeMobileMenu}>
                பொருள் அட்டவணை
              </MobileNavLink>
              <MobileNavLink href="/notes" onClick={closeMobileMenu}>
                குறிப்புகள்
              </MobileNavLink>
              <MobileNavLink href="/about" onClick={closeMobileMenu}>
                அறிமுகம்
              </MobileNavLink>
              <MobileNavLink href="/bookmarks" onClick={closeMobileMenu}>
                குறிக்கப்பட்டவை
              </MobileNavLink>
            </nav>
        </div>
      </header>

      {searchOpen && (
        <SearchOverlay onClose={() => setSearchOpen(false)} />
      )}
    </>
  );
}

function MobileNavLink({
  href,
  onClick,
  children,
}: {
  href: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="flex min-h-11 items-center rounded-lg px-3 font-tamil-text text-base"
      style={{ color: "var(--text-muted)" }}
    >
      {children}
    </Link>
  );
}

function MenuIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      aria-hidden="true"
    >
      {open ? <path d="m6 6 12 12M18 6 6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}

function BookmarkNavIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
    >
      <path d="M6 3h12a1 1 0 0 1 1 1v17l-7-4.5L5 21V4a1 1 0 0 1 1-1Z" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" />
    </svg>
  );
}
