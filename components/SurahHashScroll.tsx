"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import { usePrefs } from "./PrefsProvider";

const MAX_ATTEMPTS = 10;
const MAX_CORRECTIONS = 2;
const POSITION_TOLERANCE = 32;
const MANUAL_SCROLL_TOLERANCE = 64;

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

function expectedTop(element: HTMLElement): number {
  const scrollMarginTop = parseFloat(
    window.getComputedStyle(element).scrollMarginTop,
  );
  return Number.isFinite(scrollMarginTop) ? scrollMarginTop : 0;
}

function isPositioned(element: HTMLElement): boolean {
  return Math.abs(element.getBoundingClientRect().top - expectedTop(element)) <=
    POSITION_TOLERANCE;
}

export function SurahHashScroll() {
  const { prefs } = usePrefs();
  const activeHashRef = useRef<string | null>(null);
  const lastPositionedScrollYRef = useRef<number | null>(null);
  const generationRef = useRef(0);

  function cancelPending() {
    generationRef.current += 1;
  }

  function positionHashTarget(id: string) {
    const generation = ++generationRef.current;
    let attempts = 0;
    let corrections = 0;
    let frame = 0;
    let delayedRetry = 0;
    let finished = false;

    const finish = () => {
      if (finished) return;
      finished = true;
      cancelAnimationFrame(frame);
      window.clearTimeout(delayedRetry);
    };

    const attempt = () => {
      if (finished || generationRef.current !== generation) return;
      attempts += 1;

      const target = findAyah(id);
      if (target && isPositioned(target)) {
        lastPositionedScrollYRef.current = window.scrollY;
        finish();
        return;
      }

      if (target && corrections < MAX_CORRECTIONS) {
        target.scrollIntoView({ block: "start", behavior: "auto" });
        corrections += 1;
      }

      if (attempts >= MAX_ATTEMPTS) {
        finish();
        return;
      }

      frame = requestAnimationFrame(attempt);
    };

    frame = requestAnimationFrame(attempt);
    delayedRetry = window.setTimeout(attempt, 180);

    if (document.fonts?.ready) {
      document.fonts.ready.then(() => {
        if (!finished && generationRef.current === generation) attempt();
      });
    }
  }

  useEffect(() => {
    const activateCurrentHash = () => {
      const id = hashId();
      cancelPending();
      activeHashRef.current = id;
      lastPositionedScrollYRef.current = null;
      if (id) positionHashTarget(id);
    };

    activateCurrentHash();
    window.addEventListener("hashchange", activateCurrentHash);

    return () => {
      window.removeEventListener("hashchange", activateCurrentHash);
      cancelPending();
    };
  }, []);

  useLayoutEffect(() => {
    const id = activeHashRef.current;
    const lastPositionedScrollY = lastPositionedScrollYRef.current;
    if (!id || lastPositionedScrollY === null || hashId() !== id) return;

    const scrollDelta = Math.abs(window.scrollY - lastPositionedScrollY);
    if (scrollDelta > MANUAL_SCROLL_TOLERANCE) {
      // The reader moved away from the hash target. Disarm width correction
      // until a new intentional hash navigation occurs.
      lastPositionedScrollYRef.current = null;
      return;
    }

    positionHashTarget(id);
  }, [prefs.readingWidth]);

  return null;
}
