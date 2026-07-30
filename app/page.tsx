import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { ContinueReading } from "@/components/ContinueReading";
import { SurahGrid } from "@/components/SurahGrid";
import { getSurah, getSurahIndex } from "@/lib/data";

export const revalidate = 86400;

function dayOfYear() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - start.getTime();
  return Math.floor(diff / 86400000);
}

export default async function HomePage() {
  const index = await getSurahIndex();
  const surahNames = Object.fromEntries(
    index.map((s) => [s.number, s.name_tamil])
  );

  const doy = dayOfYear();
  const dailySurahNumber = (doy % 114) + 1;
  const dailySurah = await getSurah(dailySurahNumber);
  const dailyGroup =
    dailySurah && dailySurah.ayah_groups.length > 0
      ? dailySurah.ayah_groups[doy % dailySurah.ayah_groups.length]
      : null;

  return (
    <>
      <SiteHeader />
      <main id="main" className="flex-1">
        {/* Hero */}
        <section className="border-b" style={{ borderColor: "var(--border)" }}>
          <div className="mx-auto max-w-5xl px-4 sm:px-6 py-14 sm:py-20 text-center relative">
            <div
              className="absolute inset-0 -z-10 paper-texture"
              aria-hidden="true"
            />
            <p
              className="font-arabic-text mb-6"
              style={{ fontSize: "clamp(28px, 5vw, 44px)", color: "var(--accent)" }}
              dir="rtl"
            >
              بِسۡمِ ٱللَّهِ ٱلرَّحۡمَٰنِ ٱلرَّحِيمِ
            </p>
            <h1
              className="font-tamil-text mx-auto max-w-2xl"
              style={{ fontSize: "clamp(22px, 4vw, 30px)", lineHeight: 1.5, color: "var(--text)" }}
            >
              திருக்குர்ஆனை தமிழில் தெளிவாகவும், துல்லியமாகவும் வாசியுங்கள்
            </h1>
            <p className="mt-3 text-sm" style={{ color: "var(--text-muted)" }}>
              Arabic text alongside an exact Tamil translation, verse by verse.
            </p>
            <div className="gold-rule mt-8" />
          </div>
        </section>

        <div className="mx-auto max-w-5xl px-4 sm:px-6 py-8 sm:py-10 space-y-10">
          <ContinueReading surahNames={surahNames} />

          {dailyGroup && dailySurah && (
            <section aria-labelledby="daily-ayah-heading">
              <h2
                id="daily-ayah-heading"
                className="text-xs uppercase tracking-wider mb-3"
                style={{ color: "var(--accent-2)" }}
              >
                இன்றைய வசனம் · Verse of the day
              </h2>
              <Link
                href={`/surah/${dailySurah.number}#${dailyGroup.verses[0]}`}
                className="ink-card block rounded-2xl p-6 sm:p-8 hover:-translate-y-0.5"
              >
                <p
                  className="font-arabic-text text-right mb-4"
                  style={{ fontSize: "24px", color: "var(--text)" }}
                >
                  {dailyGroup.arabic}
                </p>
                <p className="font-tamil-text mb-3" style={{ fontSize: "18px", color: "var(--text)" }}>
                  {dailyGroup.tamil}
                </p>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                  {dailySurah.name_tamil} · {dailySurah.number}:{dailyGroup.verses.join(",")}
                </p>
              </Link>
            </section>
          )}

          <section aria-labelledby="surah-grid-heading">
            <div className="flex items-baseline justify-between mb-4">
              <h2
                id="surah-grid-heading"
                className="font-display text-xl"
                style={{ color: "var(--text)" }}
              >
                அத்தியாயங்கள்
                <span className="ml-2 text-sm font-ui" style={{ color: "var(--text-muted)" }}>
                  114 Surahs
                </span>
              </h2>
            </div>
            <SurahGrid surahs={index} />
          </section>
        </div>
      </main>

      <footer
        className="border-t py-8 text-center text-xs"
        style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}
      >
        <p>
          திருக்குர்ஆன் தமிழாக்கம் {" "}
          <a
            href="https://onlinepj.in"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:no-underline"
          >
            அறிஞர் பி. ஜைனுல் ஆபிதீன் (PJ)
          </a>{" "}
          அவர்களின் அனுமதியுடன் பயன்படுத்தப்படுகிறது.
        </p>
      </footer>
    </>
  );
}
