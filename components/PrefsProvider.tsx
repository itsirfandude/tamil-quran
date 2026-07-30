"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type {
  Bookmark,
  ReaderPrefs,
  ReadingProgress,
  ThemeId,
} from "@/lib/types";
import { DEFAULT_PREFS } from "@/lib/types";

const PREFS_KEY = "tq_prefs_v1";
const BOOKMARKS_KEY = "tq_bookmarks_v1";
const PROGRESS_KEY = "tq_progress_v1";

interface PrefsContextValue {
  prefs: ReaderPrefs;
  setTheme: (t: ThemeId) => void;
  setTamilFontSize: (n: number) => void;
  setArabicFontSize: (n: number) => void;
  setLineHeight: (n: number) => void;
  toggleArabic: () => void;
  toggleTamil: () => void;
  setReadingWidth: (w: ReaderPrefs["readingWidth"]) => void;

  bookmarks: Bookmark[];
  isBookmarked: (key: string) => boolean;
  toggleBookmark: (b: Omit<Bookmark, "createdAt">) => void;

  progress: ReadingProgress | null;
  saveProgress: (p: Omit<ReadingProgress, "updatedAt">) => void;
}

const PrefsContext = createContext<PrefsContextValue | null>(null);

export function PrefsProvider({ children }: { children: React.ReactNode }) {
  const [prefs, setPrefs] = useState<ReaderPrefs>(DEFAULT_PREFS);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [progress, setProgress] = useState<ReadingProgress | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const p = localStorage.getItem(PREFS_KEY);
      if (p) setPrefs({ ...DEFAULT_PREFS, ...JSON.parse(p) });
      const b = localStorage.getItem(BOOKMARKS_KEY);
      if (b) setBookmarks(JSON.parse(b));
      const pr = localStorage.getItem(PROGRESS_KEY);
      if (pr) setProgress(JSON.parse(pr));
    } catch {
      /* ignore corrupt storage */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    document.documentElement.setAttribute("data-theme", prefs.theme);
    document.documentElement.style.setProperty(
      "--tamil-size",
      `${prefs.tamilFontSize}px`
    );
    document.documentElement.style.setProperty(
      "--arabic-size",
      `${prefs.arabicFontSize}px`
    );
    document.documentElement.style.setProperty(
      "--tamil-leading",
      `${prefs.lineHeight}`
    );
    document.documentElement.style.setProperty(
      "--arabic-leading",
      `${prefs.lineHeight + 0.2}`
    );
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  }, [prefs, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(bookmarks));
  }, [bookmarks, hydrated]);

  useEffect(() => {
    if (!hydrated || !progress) return;
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
  }, [progress, hydrated]);

  const setTheme = useCallback(
    (theme: ThemeId) => setPrefs((p) => ({ ...p, theme })),
    []
  );
  const setTamilFontSize = useCallback(
    (n: number) =>
      setPrefs((p) => ({
        ...p,
        tamilFontSize: Math.min(36, Math.max(14, n)),
      })),
    []
  );
  const setArabicFontSize = useCallback(
    (n: number) =>
      setPrefs((p) => ({
        ...p,
        arabicFontSize: Math.min(48, Math.max(18, n)),
      })),
    []
  );
  const setLineHeight = useCallback(
    (n: number) =>
      setPrefs((p) => ({ ...p, lineHeight: Math.min(2.6, Math.max(1.4, n)) })),
    []
  );
  const toggleArabic = useCallback(
    () => setPrefs((p) => ({ ...p, showArabic: !p.showArabic })),
    []
  );
  const toggleTamil = useCallback(
    () => setPrefs((p) => ({ ...p, showTamil: !p.showTamil })),
    []
  );
  const setReadingWidth = useCallback(
    (readingWidth: ReaderPrefs["readingWidth"]) =>
      setPrefs((p) => ({ ...p, readingWidth })),
    []
  );

  const isBookmarked = useCallback(
    (key: string) => bookmarks.some((b) => b.key === key),
    [bookmarks]
  );

  const toggleBookmark = useCallback((b: Omit<Bookmark, "createdAt">) => {
    setBookmarks((prev) => {
      const exists = prev.find((x) => x.key === b.key);
      if (exists) return prev.filter((x) => x.key !== b.key);
      return [...prev, { ...b, createdAt: Date.now() }];
    });
  }, []);

  const saveProgress = useCallback((p: Omit<ReadingProgress, "updatedAt">) => {
    setProgress({ ...p, updatedAt: Date.now() });
  }, []);

  const value = useMemo<PrefsContextValue>(
    () => ({
      prefs,
      setTheme,
      setTamilFontSize,
      setArabicFontSize,
      setLineHeight,
      toggleArabic,
      toggleTamil,
      setReadingWidth,
      bookmarks,
      isBookmarked,
      toggleBookmark,
      progress,
      saveProgress,
    }),
    [
      prefs,
      setTheme,
      setTamilFontSize,
      setArabicFontSize,
      setLineHeight,
      toggleArabic,
      toggleTamil,
      setReadingWidth,
      bookmarks,
      isBookmarked,
      toggleBookmark,
      progress,
      saveProgress,
    ]
  );

  return (
    <PrefsContext.Provider value={value}>{children}</PrefsContext.Provider>
  );
}

export function usePrefs() {
  const ctx = useContext(PrefsContext);
  if (!ctx) throw new Error("usePrefs must be used within PrefsProvider");
  return ctx;
}
