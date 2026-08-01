import Link from "next/link";
import type { SurahMeta } from "@/lib/types";

export function SurahGrid({ surahs }: { surahs: SurahMeta[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {surahs.map((s) => (
        <Link
          key={s.number}
          href={`/surah/${s.number}`}
          className="ink-card flex items-center gap-4 rounded-xl px-4 py-3.5"
        >
          <span
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border font-ui text-sm"
            style={{ borderColor: "var(--accent-2)", color: "var(--accent-2)" }}
          >
            {s.number}
          </span>
          <span className="min-w-0 flex-1">
            <span
              className="block font-tamil-text truncate"
              style={{ fontSize: "17px", lineHeight: 1.3, color: "var(--text)" }}
            >
              {s.name_tamil || `அத்தியாயம் ${s.number}`}
            </span>
            <span className="block text-xs" style={{ color: "var(--text-muted)" }}>
              {s.total_verses} வசனங்கள்
            </span>
          </span>
        </Link>
      ))}
    </div>
  );
}
