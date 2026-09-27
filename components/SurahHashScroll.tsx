"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import { usePrefs } from "./PrefsProvider";

function hashId(): string | null {
  const rawHash = window.location.hash.slice(1);
  if (!rawHash) return null;

  let id: string;
  try {
    id = decodeURIComponent(rawHash);
  } catch {
    return null;
  }

  return /^\d+$/.test(id) ? id : null;
}

function findAyah(id: string): HTMLElement | null {
  const element = document.getElementById(id);
  if (!(element instanceof HTMLElement)) return null;
  if (element.tagName !== "ARTICLE") return null;
  if (!element.closest("main#main")) return null;
  if (!element.hasAttribute("data-verses")) return null;
  return element;
}

type ReadingAnchor = {
  element: HTMLElement;
  top: number;
};

function currentReadingAnchor(): ReadingAnchor | null {
  const y = window.innerHeight * 0.35;
  const element = document
    .elementFromPoint(window.innerWidth / 2, y)
    ?.closest<HTMLElement>("main#main article[data-verses]");
  if (!element) return null;

  return { element, top: element.getBoundingClientRect().top };
}

function positionHashTarget(id: string) {
  const target = findAyah(id);
  if (!target) return;

  target.scrollIntoView({ block: "start", behavior: "instant" });
}

export function SurahHashScroll() {
  const { prefs } = usePrefs();
  const readingAnchorRef = useRef<ReadingAnchor | null>(null);
  const readingWidthRef = useRef(prefs.readingWidth);

  useEffect(() => {
    const activateCurrentHash = () => {
      const id = hashId();
      if (id) positionHashTarget(id);
    };

    const captureReadingAnchor = () => {
      const anchor = currentReadingAnchor();
      if (anchor) readingAnchorRef.current = anchor;
    };

    activateCurrentHash();
    captureReadingAnchor();
    window.addEventListener("hashchange", activateCurrentHash);
    window.addEventListener("scroll", captureReadingAnchor, { passive: true });

    return () => {
      window.removeEventListener("hashchange", activateCurrentHash);
      window.removeEventListener("scroll", captureReadingAnchor);
    };
  }, []);

  useLayoutEffect(() => {
    if (readingWidthRef.current === prefs.readingWidth) return;
    readingWidthRef.current = prefs.readingWidth;

    const anchor = readingAnchorRef.current;
    if (!anchor || !anchor.element.isConnected) return;

    const delta = anchor.element.getBoundingClientRect().top - anchor.top;
    if (Math.abs(delta) > 0.5) {
      window.scrollBy({ top: delta, left: 0, behavior: "instant" });
    }

    const updatedAnchor = currentReadingAnchor();
    if (updatedAnchor) readingAnchorRef.current = updatedAnchor;
  }, [prefs.readingWidth]);

  return null;
}
