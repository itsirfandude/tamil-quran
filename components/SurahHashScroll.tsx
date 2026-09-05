"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import { usePrefs } from "./PrefsProvider";

const POSITION_TOLERANCE = 32;

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
  const correctionAllowedRef = useRef(false);
  const targetPositionedRef = useRef(false);
  const positioningRef = useRef(false);
  const generationRef = useRef(0);

  function cancelPending() {
    generationRef.current += 1;
  }

  function positionHashTarget(id: string, waitForFonts = true) {
    if (!correctionAllowedRef.current) return;

    const generation = ++generationRef.current;
    const target = findAyah(id);
    if (!target) return;

    if (!isPositioned(target)) {
      positioningRef.current = true;
      target.scrollIntoView({ block: "start", behavior: "auto" });
      positioningRef.current = false;
    }
    targetPositionedRef.current = isPositioned(target);

    if (waitForFonts && document.fonts?.ready) {
      document.fonts.ready.then(() => {
        if (generationRef.current !== generation) return;
        if (!correctionAllowedRef.current) return;
        targetPositionedRef.current = false;
        positionHashTarget(id, false);
      });
    }
  }

  useEffect(() => {
    const activateCurrentHash = () => {
      const id = hashId();
      cancelPending();
      activeHashRef.current = id;
      correctionAllowedRef.current = Boolean(id);
      targetPositionedRef.current = false;
      if (id) positionHashTarget(id);
    };

    const handleScroll = () => {
      if (
        positioningRef.current ||
        !correctionAllowedRef.current ||
        !targetPositionedRef.current
      ) {
        return;
      }

      const id = activeHashRef.current;
      const target = id ? findAyah(id) : null;
      if (!target || !isPositioned(target)) {
        // The hash remains in the URL after a reader intentionally scrolls
        // away. Target geometry, not scrollY, determines whether width
        // changes may restore the old hash position.
        correctionAllowedRef.current = false;
        targetPositionedRef.current = false;
      }
    };

    activateCurrentHash();
    window.addEventListener("hashchange", activateCurrentHash);
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("hashchange", activateCurrentHash);
      window.removeEventListener("scroll", handleScroll);
      correctionAllowedRef.current = false;
      targetPositionedRef.current = false;
      cancelPending();
    };
  }, []);

  useLayoutEffect(() => {
    const id = activeHashRef.current;
    if (id && hashId() === id && correctionAllowedRef.current) {
      targetPositionedRef.current = false;
      positionHashTarget(id);
    }
  }, [prefs.readingWidth]);

  return null;
}
