"use client";

import { useEffect } from "react";
import { usePrefs } from "./PrefsProvider";
import type { AyahGroup } from "@/lib/types";

export function ReaderProgressTracker({
  surah,
  groups,
}: {
  surah: number;
  groups: AyahGroup[];
}) {
  const { saveProgress } = usePrefs();

  useEffect(() => {
    const articles = Array.from(
      document.querySelectorAll<HTMLElement>("[data-verses]")
    );
    if (articles.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (!visible) return;
        const versesAttr = (visible.target as HTMLElement).dataset.verses;
        if (!versesAttr) return;
        const verses = versesAttr.split("-").map(Number);
        const groupIndex = groups.findIndex(
          (g) => g.verses[0] === verses[0]
        );
        if (groupIndex === -1) return;
        saveProgress({ surah, groupIndex, verses });
      },
      { rootMargin: "-30% 0px -50% 0px", threshold: [0, 0.5, 1] }
    );

    articles.forEach((a) => observer.observe(a));
    return () => observer.disconnect();
  }, [surah, groups, saveProgress]);

  return null;
}
