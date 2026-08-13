"use client";

import { useEffect, useId, useRef, useState } from "react";
import { NOTE_MARKER } from "./TamilWithNotes";
import {
  AyahImageCardGenerator,
  type AyahImageCardGeneratorHandle,
} from "./AyahImageCardGenerator";
import type { AyahGroup } from "@/lib/types";

export function AyahShareMenu({
  surah,
  surahName,
  group,
}: {
  surah: number;
  surahName: string;
  group: AyahGroup;
}) {
  const [open, setOpen] = useState(false);
  const [linkFeedback, setLinkFeedback] = useState<"shared" | "copied" | "failed" | null>(null);
  const [textFeedback, setTextFeedback] = useState<"copied" | "failed" | null>(null);
  const menuId = useId();
  const shareButtonRef = useRef<HTMLButtonElement>(null);
  const firstOptionRef = useRef<HTMLButtonElement>(null);
  const imageGeneratorRef = useRef<AyahImageCardGeneratorHandle>(null);
  const feedbackTimerRefs = useRef({ link: null as number | null, text: null as number | null });

  useEffect(() => {
    const timers = feedbackTimerRefs.current;
    return () => {
      if (timers.link) window.clearTimeout(timers.link);
      if (timers.text) window.clearTimeout(timers.text);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    firstOptionRef.current?.focus();
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") closeMenu();
    }
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [open]);

  function closeMenu() {
    setOpen(false);
    shareButtonRef.current?.focus();
  }

  function verseLabel() {
    return group.verses.length > 1
      ? `${group.verses[0]}-${group.verses[group.verses.length - 1]}`
      : `${group.verses[0]}`;
  }

  function verseUrl() {
    return `${window.location.origin}/surah/${surah}#${group.verses[0]}`;
  }

  async function shareLink() {
    const url = verseUrl();
    if (navigator.share) {
      try {
        await navigator.share({ title: `${surahName} ${verseLabel()}`, url });
        showLinkFeedback("shared");
        closeMenu();
        return;
      } catch {
        /* Preserve the existing clipboard fallback after share cancellation/failure. */
      }
    }
    const copied = await copyToClipboard(url);
    showLinkFeedback(copied ? "copied" : "failed");
  }

  async function copyText() {
    const text = [
      group.arabic,
      group.tamil.replace(NOTE_MARKER, ""),
      `(${surahName} ${surah}:${verseLabel()})`,
    ].join("\n\n");
    const copied = await copyToClipboard(text);
    showTextFeedback(copied ? "copied" : "failed");
  }

  function showLinkFeedback(next: "shared" | "copied" | "failed") {
    setLinkFeedback(next);
    if (feedbackTimerRefs.current.link) window.clearTimeout(feedbackTimerRefs.current.link);
    feedbackTimerRefs.current.link = window.setTimeout(() => setLinkFeedback(null), 2500);
  }

  function showTextFeedback(next: "copied" | "failed") {
    setTextFeedback(next);
    if (feedbackTimerRefs.current.text) window.clearTimeout(feedbackTimerRefs.current.text);
    feedbackTimerRefs.current.text = window.setTimeout(() => setTextFeedback(null), 2500);
  }

  return (
    <div className="relative">
      <button
        ref={shareButtonRef}
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label="Share ayah"
        aria-expanded={open}
        aria-controls={menuId}
        title="Share ayah"
        className="inline-flex h-11 w-11 items-center justify-center rounded-full transition-colors hover:opacity-100 focus-visible:outline-2 focus-visible:outline-offset-2"
        style={{ color: "var(--text-muted)", opacity: 0.75 }}
      >
        <ShareIcon />
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-label="Close share options"
            className="fixed inset-0 z-40 cursor-default bg-black/20 sm:bg-transparent"
            onClick={closeMenu}
          />
          <div
            id={menuId}
            role="menu"
            aria-label="Share options"
            className="ink-raised fixed bottom-0 left-0 right-0 z-50 rounded-t-2xl p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] sm:absolute sm:bottom-auto sm:left-auto sm:right-0 sm:top-full sm:mt-2 sm:w-56 sm:rounded-2xl sm:p-2"
          >
            <button
              ref={firstOptionRef}
              type="button"
              role="menuitem"
              onClick={shareLink}
              className="flex min-h-11 w-full items-center rounded-lg px-3 text-left text-sm hover:bg-[color:var(--selection)] focus-visible:outline-2 focus-visible:outline-offset-[-2px]"
              style={{ color: "var(--text)" }}
            >
              <LinkIcon />
              <span className="ml-3">
                {linkFeedback === "shared"
                  ? "Shared"
                  : linkFeedback === "copied"
                    ? "Link copied"
                    : linkFeedback === "failed"
                      ? "Link copy failed"
                    : "Share link"}
              </span>
            </button>
            <button
              type="button"
              role="menuitem"
              onClick={copyText}
              className="flex min-h-11 w-full items-center rounded-lg px-3 text-left text-sm hover:bg-[color:var(--selection)] focus-visible:outline-2 focus-visible:outline-offset-[-2px]"
              style={{ color: textFeedback === "copied" ? "var(--accent-2)" : "var(--text)" }}
            >
              <CopyIcon />
              <span className="ml-3">{textFeedback === "copied" ? "Copied" : "Copy text"}</span>
            </button>
            {textFeedback === "failed" && (
              <p role="alert" className="px-3 py-1 text-xs" style={{ color: "var(--accent-2)" }}>
                Copy failed. Please try again.
              </p>
            )}
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                imageGeneratorRef.current?.createImage();
                closeMenu();
              }}
              className="flex min-h-11 w-full items-center rounded-lg px-3 text-left text-sm hover:bg-[color:var(--selection)] focus-visible:outline-2 focus-visible:outline-offset-[-2px]"
              style={{ color: "var(--text)" }}
            >
              <ImageIcon />
              <span className="ml-3">Share as image</span>
            </button>
          </div>
        </>
      )}

      <AyahImageCardGenerator
        ref={imageGeneratorRef}
        surah={surah}
        surahName={surahName}
        group={group}
      />
    </div>
  );
}

async function copyToClipboard(text: string) {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fall through to the legacy user-gesture copy path.
    }
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.top = "0";
  textarea.style.left = "-9999px";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();
  textarea.setSelectionRange(0, textarea.value.length);

  try {
    return document.execCommand("copy");
  } catch {
    return false;
  } finally {
    document.body.removeChild(textarea);
  }
}

function ShareIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <circle cx="18" cy="5" r="2.5" />
      <circle cx="6" cy="12" r="2.5" />
      <circle cx="18" cy="19" r="2.5" />
      <path d="M8.3 10.7 15.7 6.6M8.3 13.3l7.4 4.1" />
    </svg>
  );
}

function LinkIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M10 13a5 5 0 0 0 7.1.1l2-2a5 5 0 0 0-7.1-7.1l-1.1 1.1" />
      <path d="M14 11a5 5 0 0 0-7.1-.1l-2 2A5 5 0 0 0 12 20l1.1-1.1" />
    </svg>
  );
}

function CopyIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <rect x="8" y="8" width="12" height="12" rx="2" />
      <path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" />
    </svg>
  );
}

function ImageIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <circle cx="8.5" cy="9" r="1.5" />
      <path d="m4 17 5-5 3.5 3.5 2.5-2.5 5 5" />
    </svg>
  );
}
