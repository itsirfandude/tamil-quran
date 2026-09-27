"use client";

import Link from "next/link";
import { useState } from "react";
import { displayHadithReference, splitTamilHadithBlocks } from "@/lib/hadith-presentation";
import type { HadithRecord } from "@/lib/types";

function Blocks({ blocks, className, dir }: { blocks?: string[]; className: string; dir?: "rtl" }) {
  if (!blocks?.length) return null;
  return <div className={className} dir={dir}>{blocks.map((block, index) => <p key={index}>{block}</p>)}</div>;
}

function MetadataItem({ title, blocks }: { title: string; blocks?: string[] }) {
  if (!blocks?.length) return null;
  return (
    <div>
      <h2 className="mb-2 text-xs uppercase tracking-wider" style={{ color: "var(--accent-2)" }}>{title}</h2>
      <Blocks blocks={blocks} className="space-y-2 whitespace-pre-line break-words font-tamil-text" />
    </div>
  );
}

export function HadithReader({ collectionSlug, collectionName, record, previousNumber, nextNumber }: {
  collectionSlug: string;
  collectionName: string;
  record: HadithRecord;
  previousNumber?: number;
  nextNumber?: number;
}) {
  const [showArabic, setShowArabic] = useState(false);
  const arabicBlocks = [
    ...(record.arabic.chapter_blocks ?? []),
    ...(record.arabic.isnad_blocks ?? []),
    ...(record.arabic.text_blocks ?? []),
  ];
  const { hadithBlocks } = splitTamilHadithBlocks(record.tamil.blocks);
  const narratorBlocks = record.source_context?.narrator_blocks
    ?.map((block) => block.replace(/^\s*அறிவிப்பவர்\s*:\s*/u, "").trim())
    .filter(Boolean);
  const referenceLabels = record.references.map((reference) => displayHadithReference(reference.label));
  const hasBibliographicMetadata = Boolean(referenceLabels.length || record.primary_source_reference || narratorBlocks?.length || record.collection_page_status);

  return (
    <article>
      <header className="mb-10 text-center">
        <Link href={`/hadith/${collectionSlug}`} className="text-xs uppercase tracking-wider" style={{ color: "var(--accent-2)" }}>{collectionName}</Link>
        <h1 className="mt-3 font-display text-3xl italic sm:text-4xl" style={{ color: "var(--text)" }}>ஹதீஸ் {record.number}</h1>
      </header>

      <section className="border-t pt-8" style={{ borderColor: "var(--border)" }}>
        <Blocks blocks={hadithBlocks} className="space-y-5 whitespace-pre-line break-words font-tamil-text" />
      </section>

      {arabicBlocks.length > 0 && (
        <section className="mt-9" aria-label="Arabic Hadith">
          <button type="button" onClick={() => setShowArabic((visible) => !visible)} aria-expanded={showArabic} className="text-sm underline underline-offset-4" style={{ color: "var(--accent-2)" }}>
            {showArabic ? "அரபியை மறை" : "அரபியை காண்பி"}
          </button>
          {showArabic && (
            <div className="mt-5 rounded-xl border px-4 py-5 sm:px-6" style={{ borderColor: "var(--border)", backgroundColor: "var(--bg-card)" }}>
              <Blocks blocks={arabicBlocks} dir="rtl" className="space-y-6 whitespace-pre-line break-words text-right font-arabic-text" />
            </div>
          )}
        </section>
      )}

      {hasBibliographicMetadata && (
        <section className="mt-8 border-t pt-5" style={{ borderColor: "var(--border)" }}>
          <div className="grid gap-6 sm:grid-cols-2">
            {referenceLabels.length > 0 ? (
              <MetadataItem title="ஆதாரம்" blocks={[referenceLabels.join(" · ")]} />
            ) : record.primary_source_reference ? (
              <MetadataItem title="ஆதாரம்" blocks={[displayHadithReference(record.primary_source_reference)]} />
            ) : null}
            <MetadataItem title="அறிவிப்பாளர்" blocks={narratorBlocks} />
            {record.collection_page_status && <MetadataItem title="ஹதீஸ் தரம்" blocks={[record.collection_page_status]} />}
          </div>
        </section>
      )}

      {record.provenance?.source_url && (
        <section className="mt-8 border-t pt-5" style={{ borderColor: "var(--border)" }}>
          <a href={record.provenance.source_url} target="_blank" rel="noreferrer" className="text-sm underline underline-offset-4" style={{ color: "var(--accent-2)" }}>மூல இணைப்பு</a>
        </section>
      )}

      <nav className="mt-12 flex items-center justify-between gap-4 border-t pt-6" style={{ borderColor: "var(--border)" }} aria-label="Hadith navigation">
        {previousNumber ? <Link href={`/hadith/${collectionSlug}/${previousNumber}`} className="text-sm" style={{ color: "var(--accent-2)" }}>← முந்தைய ஹதீஸ்</Link> : <span />}
        <Link href={`/hadith/${collectionSlug}`} className="text-sm text-center" style={{ color: "var(--text-muted)" }}>தொகுப்புக்குத் திரும்ப</Link>
        {nextNumber ? <Link href={`/hadith/${collectionSlug}/${nextNumber}`} className="text-right text-sm" style={{ color: "var(--accent-2)" }}>அடுத்த ஹதீஸ் →</Link> : <span />}
      </nav>
    </article>
  );
}
