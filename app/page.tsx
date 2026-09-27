import Link from "next/link";
import { ContinueReading } from "@/components/ContinueReading";
import { SurahGrid } from "@/components/SurahGrid";
import { TamilWithNotes } from "@/components/TamilWithNotes";
import { getSurah, getSurahIndex } from "@/lib/data";
import { getHadithCollection, getHadithIndex, getHadithRecord } from "@/lib/hadith";

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
  const hadithCollection = await getHadithCollection("arbaeen-nawawi");
  const hadithIndex = hadithCollection
    ? await getHadithIndex(hadithCollection.slug)
    : null;
  const dailyHadithEntry = hadithIndex?.length
    ? hadithIndex[doy % hadithIndex.length]
    : null;
  const dailyHadith = dailyHadithEntry && hadithCollection
    ? await getHadithRecord(hadithCollection.slug, dailyHadithEntry.number)
    : null;

  return (
    <>
      
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
  style={{
    fontSize: "clamp(24px, 4vw, 32px)",
    lineHeight: 1.5,
    color: "var(--text)",
  }}
>
  திருக்குர்ஆனை தமிழில்
  <br />
  தெளிவாகவும் துல்லியமாகவும்
  <br />
  படியுங்கள்
</h1>

<p
  className="mt-5 font-tamil-text"
  style={{
    color: "var(--text-muted)",
    fontSize: "17px",
    lineHeight: 1.8,
  }}
>
  மூலத்தின் தூய்மை மாறாமல், அன்றாட வாசிப்பிற்காக வடிவமைக்கப்பட்டது.
</p>

<div
  className="mt-8 flex flex-wrap items-center justify-center gap-3 text-sm font-tamil-text"
  style={{ color: "var(--text-muted)" }}
>
 <span>அரபி மூலத்துடன்</span>

<span
  aria-hidden="true"
  style={{ color: "var(--border)" }}
>
  |
</span>

<span>வசனம் வாரியாக</span>

<span
  aria-hidden="true"
  style={{ color: "var(--border)" }}
>
  |
</span>

<span>521 விளக்கக் குறிப்புகளுடன்</span>
</div>

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
        <TamilWithNotes text={dailyGroup.tamil} />
      </p>
      <p className="text-xs" style={{ color: "var(--text-muted)" }}>
        {dailySurah.name_tamil} · {dailySurah.number}:{dailyGroup.verses.join(",")}
      </p>
    </Link>
  </section>
)}

          {hadithCollection && (
            <section aria-labelledby="hadith-heading">
              <div className="mb-4 flex items-baseline justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-wider" style={{ color: "var(--accent-2)" }}>இஸ்லாமிய நூலகம்</p>
                  <h2 id="hadith-heading" className="mt-1 font-display text-xl" style={{ color: "var(--text)" }}>ஹதீஸ்</h2>
                </div>
                <Link href="/hadith" className="shrink-0 text-sm" style={{ color: "var(--accent-2)" }}>
                  {hadithCollection.stated_total ?? hadithIndex?.length ?? 0} ஹதீஸ்களைப் பார்க்க →
                </Link>
              </div>
              <Link href="/hadith" className="ink-card block rounded-2xl p-6 sm:p-7">
                <p className="font-tamil-text" style={{ fontSize: "21px", color: "var(--text)" }}>{hadithCollection.title.tamil}</p>
                <p className="mt-2 text-sm" style={{ color: "var(--text-muted)" }}>{hadithCollection.stated_total ?? hadithIndex?.length ?? 0} ஹதீஸ்கள்</p>
              </Link>
              {dailyHadith && dailyHadithEntry && (
                <Link
                  href={`/hadith/${hadithCollection.slug}/${dailyHadithEntry.number}`}
                  className="mt-3 block border-l-2 py-1 pl-4"
                  style={{ borderColor: "var(--accent-2)" }}
                >
                  <p className="text-xs uppercase tracking-wider" style={{ color: "var(--accent-2)" }}>இன்றைய ஹதீஸ்</p>
                  <p className="mt-1 line-clamp-2 font-tamil-text" style={{ fontSize: "17px", lineHeight: 1.65, color: "var(--text)" }}>
                    {dailyHadith.tamil.blocks.find((block) => block.trim())}
                  </p>
                  <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>ஹதீஸ் {dailyHadithEntry.number} {dailyHadithEntry.primary_reference ? `· ${dailyHadithEntry.primary_reference}` : ""}</p>
                </Link>
              )}
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
