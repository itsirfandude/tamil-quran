"use client";

import { usePrefs } from "./PrefsProvider";

const WIDTHS: Record<string, number> = {
  narrow: 42,
  normal: 52,
  wide: 64,
};

// Prose (the Surah introduction) reads more comfortably a little wider
// than the verse column - within the 10-15% range, not a fixed value,
// so it still scales with the reader's own width preference.
const WIDEN_FACTOR = 1.125;

export function ReadingWidthWrapper({
  children,
  widen = false,
}: {
  children: React.ReactNode;
  widen?: boolean;
}) {
  const { prefs } = usePrefs();
  const baseRem = WIDTHS[prefs.readingWidth];
  const rem = widen ? baseRem * WIDEN_FACTOR : baseRem;
  return (
    <div className="mx-auto px-4 sm:px-6" style={{ maxWidth: `${rem}rem` }}>
      {children}
    </div>
  );
}
