import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { AyahCard } from "@/components/AyahCard";
import { SurahIntro } from "@/components/SurahIntro";
import { ReaderProgressTracker } from "@/components/ReaderProgressTracker";
import { ReadingWidthWrapper } from "@/components/ReadingWidthWrapper";
import { LongPageNavigation } from "@/components/LongPageNavigation";
import { getSurah, getSurahIndex, TOTAL_SURAHS } from "@/lib/data";

export async function generateStaticParams() {
  return Array.from({ length: TOTAL_SURAHS }, (_, i) => ({
    number: String(i + 1),
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ number: string }>;
}): Promise<Metadata> {
  const { number } = await params;
  const surah = await getSurah(Number(number));
  if (!surah) return {};
  return {
    title: `${surah.name_tamil} — திருக்குர்ஆன்`,
    description: `Surah ${surah.number}: ${surah.name_tamil}, Tamil translation with Arabic text.`,
  };
}

export default async function SurahPage({
  params,
}: {
  params: Promise<{ number: string }>;
}) {
  const { number } = await params;
  const num = Number(number);
  if (!Number.isInteger(num) || num < 1 || num > TOTAL_SURAHS) notFound();

  const [surah, index] = await Promise.all([getSurah(num), getSurahIndex()]);
  if (!surah) notFound();

  const prev = num > 1 ? index.find((s) => s.number === num - 1) : null;
  const next = num < TOTAL_SURAHS ? index.find((s) => s.number === num + 1) : null;

  return (
    <>
      <main id="main" className="flex-1 py-8 sm:py-10">
        <ReadingWidthWrapper widen>
          <div className="mb-8 text-center">
            <p className="text-xs uppercase tracking-wider mb-2" style={{ color: "var(--accent-2)" }}>
              அத்தியாயம் {surah.number}
            </p>
            <h1 className="font-display text-3xl sm:text-4xl italic" style={{ color: "var(--text)" }}>
              {surah.name_tamil}
            </h1>
            <p className="mt-2 text-sm" style={{ color: "var(--text-muted)" }}>
              {surah.stated_total_verses} வசனங்கள்
            </p>
          </div>

          <SurahIntro introduction={surah.introduction} />
        </ReadingWidthWrapper>

        <ReadingWidthWrapper>
          {surah.number !== 9 && (
            <p
              className="font-arabic-text text-center mb-10"
              style={{ fontSize: "clamp(24px,4vw,34px)", color: "var(--accent)" }}
              dir="rtl"
            >
              بِسۡمِ ٱللَّهِ ٱلرَّحۡمَٰنِ ٱلرَّحِيمِ
            </p>
          )}

          <div className="space-y-4 sm:space-y-5">
            {surah.ayah_groups.map((g) => (
              <AyahCard
                key={g.verses.join("-")}
                surah={surah.number}
                surahName={surah.name_tamil}
                group={g}
              />
            ))}
          </div>

          <nav
            className="mt-12 flex items-center justify-between gap-4 border-t pt-6"
            style={{ borderColor: "var(--border)" }}
            aria-label="Surah navigation"
          >
            {prev ? (
              <Link
                href={`/surah/${prev.number}`}
                className="text-sm flex-1"
                style={{ color: "var(--accent-2)" }}
              >
                ← {prev.name_tamil}
              </Link>
            ) : (
              <span />
            )}
            {next ? (
              <Link
                href={`/surah/${next.number}`}
                className="text-sm flex-1 text-right"
                style={{ color: "var(--accent-2)" }}
              >
                {next.name_tamil} →
              </Link>
            ) : (
              <span />
            )}
          </nav>
        </ReadingWidthWrapper>
      </main>
      <LongPageNavigation />
      <ReaderProgressTracker surah={surah.number} groups={surah.ayah_groups} />
    </>
  );
}
