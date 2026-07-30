"use client";

import { usePrefs } from "./PrefsProvider";

const WIDTHS: Record<string, string> = {
  narrow: "42rem",
  normal: "52rem",
  wide: "64rem",
};

export function ReadingWidthWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const { prefs } = usePrefs();
  return (
    <div
      className="mx-auto px-4 sm:px-6"
      style={{ maxWidth: WIDTHS[prefs.readingWidth] }}
    >
      {children}
    </div>
  );
}
