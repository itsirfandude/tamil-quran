import Link from "next/link";
import { displayHadithReference } from "@/lib/hadith-presentation";
import type { HadithIndexEntry } from "@/lib/types";

export function HadithCard({ collectionSlug, entry, preview }: {
  collectionSlug: string;
  entry: HadithIndexEntry;
  preview: string;
}) {
  return (
    <article className="grid grid-cols-[auto_minmax(0,1fr)_auto] gap-x-4 border-b px-1 py-5 last:border-b-0 sm:px-2" style={{ borderColor: "var(--border)" }}>
      <span className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-full border text-sm" style={{ borderColor: "var(--accent-2)", color: "var(--accent-2)" }}>
        {entry.number}
      </span>
      <Link href={`/hadith/${collectionSlug}/${entry.number}`} className="group min-w-0" aria-label={`ஹதீஸ் ${entry.number} வாசிக்க`}>
        <span className="block font-tamil-text" style={{ fontSize: "18px", lineHeight: 1.65, color: "var(--text)" }}>{preview}</span>
      </Link>
      <Link href={`/hadith/${collectionSlug}/${entry.number}`} aria-label={`ஹதீஸ் ${entry.number} வாசிக்க`} className="row-span-2 self-center text-lg" style={{ color: "var(--accent-2)" }}>
        <span aria-hidden="true">→</span>
      </Link>
      {entry.primary_reference && (
        <span className="col-start-2 mt-2 block text-xs" style={{ color: "var(--text-muted)" }}>
          {displayHadithReference(entry.primary_reference)}
        </span>
      )}
    </article>
  );
}
