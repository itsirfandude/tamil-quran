"use client";

import { useEffect, useState } from "react";

const USEFUL_SCROLL_DISTANCE = 320;
const EDGE_DISTANCE = 96;

export function LongPageNavigation() {
  const [isLongPage, setIsLongPage] = useState(false);
  const [canGoTop, setCanGoTop] = useState(false);
  const [canGoBottom, setCanGoBottom] = useState(false);

  useEffect(() => {
    function updateState() {
      const maxScroll = Math.max(
        0,
        document.documentElement.scrollHeight - window.innerHeight,
      );
      const scrollY = window.scrollY;

      setIsLongPage(maxScroll > USEFUL_SCROLL_DISTANCE);
      setCanGoTop(scrollY > EDGE_DISTANCE);
      setCanGoBottom(maxScroll - scrollY > EDGE_DISTANCE);
    }

    updateState();
    window.addEventListener("scroll", updateState, { passive: true });
    window.addEventListener("resize", updateState);

    const resizeObserver = new ResizeObserver(updateState);
    resizeObserver.observe(document.documentElement);

    return () => {
      window.removeEventListener("scroll", updateState);
      window.removeEventListener("resize", updateState);
      resizeObserver.disconnect();
    };
  }, []);

  if (!isLongPage || (!canGoTop && !canGoBottom)) return null;

  function scrollTo(position: "top" | "bottom") {
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    window.scrollTo({
      top: position === "top" ? 0 : document.documentElement.scrollHeight,
      behavior: reducedMotion ? "auto" : "smooth",
    });
  }

  return (
    <nav
      aria-label="Page navigation"
      className="long-page-navigation fixed z-30 flex flex-col gap-2"
    >
      {canGoTop && (
        <button
          type="button"
          onClick={() => scrollTo("top")}
          aria-label="மேலே செல்ல"
          className="ink-raised flex min-h-11 min-w-11 items-center justify-center rounded-full px-2 text-xs leading-none transition-opacity hover:opacity-80"
          style={{ color: "var(--accent-2)", opacity: 0.82 }}
        >
          ↑ மேலே
        </button>
      )}
      {canGoBottom && (
        <button
          type="button"
          onClick={() => scrollTo("bottom")}
          aria-label="கீழே செல்ல"
          className="ink-raised flex min-h-11 min-w-11 items-center justify-center rounded-full px-2 text-xs leading-none transition-opacity hover:opacity-80"
          style={{ color: "var(--accent-2)", opacity: 0.82 }}
        >
          ↓ கீழே
        </button>
      )}
    </nav>
  );
}
