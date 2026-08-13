"use client";

import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";
import type { AyahGroup } from "@/lib/types";
import { generateAyahImage } from "@/lib/ayah-image";

export interface AyahImageCardGeneratorHandle {
  createImage: () => void;
}

export const AyahImageCardGenerator = forwardRef<
  AyahImageCardGeneratorHandle,
  {
  surah: number;
  surahName: string;
  group: AyahGroup;
  }
>(function AyahImageCardGenerator({ surah, surahName, group }, ref) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [imageBlob, setImageBlob] = useState<Blob | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  useEffect(() => {
    if (!previewUrl) return;
    closeButtonRef.current?.focus();
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") closePreview();
    }
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [previewUrl]);

  const createImage = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const blob = await generateAyahImage({ surah, surahName, group });
      setImageBlob(blob);
      setPreviewUrl(URL.createObjectURL(blob));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Image generation failed.");
    } finally {
      setBusy(false);
    }
  }, [busy, group, surah, surahName]);

  useImperativeHandle(ref, () => ({ createImage }), [createImage]);

  function closePreview() {
    setPreviewUrl(null);
    setImageBlob(null);
  }

  function downloadImage() {
    if (!previewUrl) return;
    const link = document.createElement("a");
    link.href = previewUrl;
    link.download = `quran-${surah}-${group.verses[0]}.png`;
    link.click();
  }

  async function shareImage() {
    if (!imageBlob) return;
    const file = new File([imageBlob], `quran-${surah}-${group.verses[0]}.png`, {
      type: "image/png",
    });
    if (navigator.share && navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ title: `${surahName} ${surah}:${group.verses[0]}`, files: [file] });
        return;
      } catch {
        // User cancellation should leave the preview open.
      }
    }
    downloadImage();
  }

  return (
    <>
      {error && (
        <p className="mt-2 text-xs" role="alert" style={{ color: "var(--accent-2)" }}>
          {error}
        </p>
      )}

      {previewUrl && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/75 p-4 sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-label="Ayah image preview"
          onClick={(event) => {
            if (event.target === event.currentTarget) closePreview();
          }}
        >
          <div className="ink-raised flex max-h-[95dvh] w-full max-w-lg flex-col gap-4 overflow-y-auto rounded-2xl p-4 sm:p-5">
            <div className="flex items-center justify-between gap-4">
              <h2 className="font-display text-lg" style={{ color: "var(--text)" }}>
                Ayah image
              </h2>
              <button
                ref={closeButtonRef}
                type="button"
                onClick={closePreview}
                className="min-h-11 min-w-11 rounded-full text-sm"
                style={{ color: "var(--text-muted)" }}
                aria-label="Close image preview"
              >
                ✕
              </button>
            </div>
            {/* Blob URLs are intentionally rendered directly; next/image cannot optimize them. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl}
              alt={`${surahName} ${surah}:${group.verses[0]} ayah image`}
              className="mx-auto max-h-[70dvh] w-auto rounded-lg"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={shareImage}
                className="min-h-11 flex-1 rounded-full border px-4 text-sm"
                style={{ borderColor: "var(--accent-2)", color: "var(--accent-2)" }}
              >
                Share
              </button>
              <button
                type="button"
                onClick={downloadImage}
                className="min-h-11 flex-1 rounded-full border px-4 text-sm"
                style={{ borderColor: "var(--border)", color: "var(--text)" }}
              >
                Save image
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
});
