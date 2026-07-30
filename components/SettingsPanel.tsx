"use client";

import { useEffect, useRef } from "react";
import { usePrefs } from "./PrefsProvider";
import type { ThemeId } from "@/lib/types";

const THEMES: { id: ThemeId; label: string; swatch: string; swatchAccent: string }[] = [
  { id: "dark", label: "OLED Black", swatch: "#000000", swatchAccent: "#d9bb78" },
  { id: "night-blue", label: "Night Blue", swatch: "#060d1c", swatchAccent: "#c9a24b" },
  { id: "emerald", label: "Emerald", swatch: "#06130e", swatchAccent: "#d6b65a" },
  { id: "classic", label: "Classic Paper", swatch: "#f2ecdc", swatchAccent: "#2b4c7e" },
  { id: "sepia", label: "Sepia", swatch: "#ebdcc0", swatchAccent: "#8b4a2b" },
  { id: "contrast", label: "High Contrast", swatch: "#000000", swatchAccent: "#ffd400" },
];

export function SettingsPanel({ onClose }: { onClose: () => void }) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        onClose();
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [onClose]);

  const {
    prefs,
    setTheme,
    setTamilFontSize,
    setArabicFontSize,
    setLineHeight,
    toggleArabic,
    toggleTamil,
    setReadingWidth,
  } = usePrefs();

  return (
    <div
      ref={panelRef}
      role="dialog"
      aria-label="Reading settings"
      className="ink-raised absolute right-0 top-full mt-2 w-80 max-w-[90vw] rounded-2xl p-5 z-50"
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-sm tracking-wide" style={{ color: "var(--text)" }}>
          Reading settings
        </h2>
        <button
          onClick={onClose}
          aria-label="Close settings"
          className="text-xs opacity-70 hover:opacity-100"
          style={{ color: "var(--text-muted)" }}
        >
          Close
        </button>
      </div>

      <fieldset className="mb-5">
        <legend className="text-xs uppercase tracking-wider mb-2" style={{ color: "var(--text-muted)" }}>
          Theme
        </legend>
        <div className="grid grid-cols-3 gap-2">
          {THEMES.map((t) => (
            <button
              key={t.id}
              onClick={() => setTheme(t.id)}
              aria-pressed={prefs.theme === t.id}
              className="flex flex-col items-center gap-1 rounded-lg p-2 border transition-transform hover:scale-[1.03]"
              style={{
                borderColor: prefs.theme === t.id ? "var(--accent-2)" : "var(--border)",
              }}
            >
              <span
                className="h-6 w-full rounded-md border flex items-center justify-center"
                style={{ background: t.swatch, borderColor: "var(--border)" }}
              >
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ background: t.swatchAccent }}
                />
              </span>
              <span className="text-[10px] leading-tight text-center" style={{ color: "var(--text-muted)" }}>
                {t.label}
              </span>
            </button>
          ))}
        </div>
      </fieldset>

      <div className="mb-4">
        <SliderRow
          label="Tamil size"
          value={prefs.tamilFontSize}
          min={14}
          max={36}
          onChange={setTamilFontSize}
        />
        <SliderRow
          label="Arabic size"
          value={prefs.arabicFontSize}
          min={18}
          max={48}
          onChange={setArabicFontSize}
        />
        <SliderRow
          label="Line spacing"
          value={prefs.lineHeight}
          min={1.4}
          max={2.6}
          step={0.1}
          onChange={setLineHeight}
        />
      </div>

      <fieldset className="mb-4">
        <legend className="text-xs uppercase tracking-wider mb-2" style={{ color: "var(--text-muted)" }}>
          Show
        </legend>
        <div className="flex gap-2">
          <ToggleChip active={prefs.showArabic} onClick={toggleArabic} label="Arabic" />
          <ToggleChip active={prefs.showTamil} onClick={toggleTamil} label="Tamil" />
        </div>
      </fieldset>

      <fieldset>
        <legend className="text-xs uppercase tracking-wider mb-2" style={{ color: "var(--text-muted)" }}>
          Reading width
        </legend>
        <div className="flex gap-2">
          {(["narrow", "normal", "wide"] as const).map((w) => (
            <ToggleChip
              key={w}
              active={prefs.readingWidth === w}
              onClick={() => setReadingWidth(w)}
              label={w[0].toUpperCase() + w.slice(1)}
            />
          ))}
        </div>
      </fieldset>
    </div>
  );
}

function SliderRow({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (n: number) => void;
}) {
  return (
    <div className="mb-2">
      <div className="flex items-center justify-between text-xs mb-1" style={{ color: "var(--text-muted)" }}>
        <span>{label}</span>
        <span>{value}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full accent-current"
        style={{ color: "var(--accent-2)" }}
        aria-label={label}
      />
    </div>
  );
}

function ToggleChip({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className="text-xs px-3 py-1.5 rounded-full border transition-colors"
      style={{
        borderColor: active ? "var(--accent-2)" : "var(--border)",
        color: active ? "var(--accent-2)" : "var(--text-muted)",
        background: active ? "var(--selection)" : "transparent",
      }}
    >
      {label}
    </button>
  );
}
