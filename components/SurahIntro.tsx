"use client";

import { useState } from "react";
import type { SurahIntroduction } from "@/lib/types";

// Surahs with more than this many paragraphs (Surah 9's 14-paragraph
// explanation of its missing Bismillah is the extreme case) start
// collapsed so the introduction doesn't push the actual verses too far
// down the page.
const COLLAPSE_THRESHOLD = 2;

export function SurahIntro({ introduction }: { introduction: SurahIntroduction }) {
  const { name_meaning, paragraphs } = introduction;
  const [expanded, setExpanded] = useState(paragraphs.length <= COLLAPSE_THRESHOLD);

  if (!name_meaning && paragraphs.length === 0) return null;

  const shouldCollapse = paragraphs.length > COLLAPSE_THRESHOLD;
  const visibleParagraphs =
    shouldCollapse && !expanded ? paragraphs.slice(0, 1) : paragraphs;

  return (
    <div className="mb-10">
      {name_meaning && (
        <p
          className="font-tamil-text text-center mb-4"
          style={{ fontSize: "16px", lineHeight: 1.6, color: "var(--text-muted)" }}
        >
          {name_meaning}
        </p>
      )}

      {paragraphs.length > 0 && (
        <div
          className="mx-auto max-w-xl border-t pt-5"
          style={{ borderColor: "var(--border)" }}
        >
          <div className="space-y-3">
            {visibleParagraphs.map((p, i) => (
              <p
                key={i}
                className="font-tamil-text"
                style={{ color: "var(--text)" }}
              >
                {p}
              </p>
            ))}
          </div>

          {shouldCollapse && (
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              aria-expanded={expanded}
              className="mt-3 text-xs font-ui"
              style={{ color: "var(--accent-2)" }}
            >
              {expanded
                ? "less"
                : `more (${paragraphs.length - 1} more paragraph${paragraphs.length - 1 === 1 ? "" : "s"})`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
