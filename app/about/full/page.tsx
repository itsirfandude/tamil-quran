import { getIntroSections } from "@/lib/data";
import { LongPageNavigation } from "@/components/LongPageNavigation";

export const metadata = { title: "அறிமுகம் · திருக்குர்ஆன்" };

function isSubheading(p: string) {
  return /^#{1,6}\s+/.test(p.trim());
}

function cleanSubheading(p: string) {
  return p.trim().replace(/^#{1,6}\s+/, "");
}

function isBullet(p: string) {
  return /^எ\s+/.test(p.trim());
}

function cleanBullet(p: string) {
  return p.trim().replace(/^எ\s+/, "");
}

function cleanFormatting(p: string) {
  return p
    .replace(/\*\*/g, "")
    .replace(/__/g, "")
    .trim();
}

export default async function AboutPage() {
  const sections = await getIntroSections();

  return (
    <main id="main" className="long-page-content flex-1 py-10 sm:py-14">
      <div className="mx-auto max-w-3xl px-5 sm:px-6">
        <header className="mb-12">
          <p
            className="font-tamil-text mb-3 text-xs tracking-[0.28em]"
            style={{ color: "var(--accent-2)" }}
          >
            அறிமுகம்
          </p>

          <h1
            className="font-tamil-text text-3xl leading-[1.35] sm:text-4xl"
            style={{ color: "var(--text)" }}
          >
            முழு அறிமுகம்
          </h1>

          <div
            className="mt-7 h-px w-12"
            style={{ background: "var(--accent-2)" }}
          />
        </header>

        <nav
          className="mb-16 border-y py-6"
          style={{ borderColor: "var(--border)" }}
          aria-label="அறிமுகப் பகுதிகள்"
        >
          <div className="space-y-3">
            {sections.map((s, i) => (
              <a
                key={i}
                href={`#section-${i}`}
                className="group flex items-baseline gap-4 font-tamil-text text-sm transition-opacity hover:opacity-70"
                style={{ color: "var(--accent-2)" }}
              >
                <span
                  className="shrink-0 text-xs tracking-[0.2em]"
                  style={{ color: "var(--text-muted)" }}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>

                <span>{cleanFormatting(s.title)}</span>
              </a>
            ))}
          </div>
        </nav>

        <div className="space-y-20">
          {sections.map((s, i) => {
            const isGlossarySection =
              cleanFormatting(s.title) === "கலைச் சொற்கள்";

            return (
              <section
                key={i}
                id={`section-${i}`}
                className="scroll-mt-24"
              >
                <div className="mb-7 flex items-baseline gap-4">
                  <span
                    className="shrink-0 text-xs tracking-[0.2em]"
                    style={{ color: "var(--accent-2)" }}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>

                  <h2
                    className="font-tamil-text text-xl leading-[1.5] sm:text-2xl"
                    style={{ color: "var(--accent-2)" }}
                  >
                    {cleanFormatting(s.title)}
                  </h2>
                </div>

                <div className="max-w-2xl space-y-5">
                  {s.paragraphs.map((p, j) => {
                    const cleaned = cleanFormatting(p);

                    /*
                     * The canonical extracted source does not contain
                     * the heading "தமிழ்க் கலைச் சொற்கள்", but the content
                     * beginning with "இணை கற்பித்தல்" is the Tamil
                     * terminology portion. Restore the missing heading
                     * in the rendered UI without modifying intro.json.
                     */
                    if (isGlossarySection && j === 0) {
                      return (
                        <div key={j}>
                          <h3
                            id="tamil-terms"
                            className="font-tamil-text scroll-mt-24 pb-1 text-lg font-semibold leading-[1.7]"
                            style={{ color: "var(--accent-2)" }}
                          >
                            தமிழ்க் கலைச் சொற்கள்
                          </h3>

                          {isBullet(p) ? (
                            <div
                              className="mt-5 flex gap-3 font-tamil-text text-[17px] leading-[2]"
                              style={{ color: "var(--text)" }}
                            >
                              <span
                                className="shrink-0 pt-[0.1em]"
                                style={{ color: "var(--accent-2)" }}
                                aria-hidden="true"
                              >
                                •
                              </span>

                              <p>
                                {cleanFormatting(cleanBullet(p))}
                              </p>
                            </div>
                          ) : isSubheading(p) ? (
                            <h3
                              className="font-tamil-text mt-5 pt-1 text-lg font-semibold leading-[1.7]"
                              style={{ color: "var(--accent-2)" }}
                            >
                              {cleanFormatting(cleanSubheading(p))}
                            </h3>
                          ) : (
                            <p
                              className="font-tamil-text mt-5 text-[17px] leading-[2]"
                              style={{ color: "var(--text)" }}
                            >
                              {cleaned}
                            </p>
                          )}
                        </div>
                      );
                    }

                    /*
                     * This heading exists in the canonical extracted
                     * content and marks the transition into the Arabic
                     * terminology section.
                     */
                    if (
                      isGlossarySection &&
                      cleaned === "அரபு கலைச் சொற்கள்"
                    ) {
                      return (
                        <h3
                          key={j}
                          id="arabic-terms"
                          className="font-tamil-text scroll-mt-24 pt-8 text-lg font-semibold leading-[1.7]"
                          style={{ color: "var(--accent-2)" }}
                        >
                          {cleaned}
                        </h3>
                      );
                    }

                    if (isBullet(p)) {
                      return (
                        <div
                          key={j}
                          className="flex gap-3 font-tamil-text text-[17px] leading-[2]"
                          style={{ color: "var(--text)" }}
                        >
                          <span
                            className="shrink-0 pt-[0.1em]"
                            style={{ color: "var(--accent-2)" }}
                            aria-hidden="true"
                          >
                            •
                          </span>

                          <p>
                            {cleanFormatting(cleanBullet(p))}
                          </p>
                        </div>
                      );
                    }

                    if (isSubheading(p)) {
                      return (
                        <h3
                          key={j}
                          className="font-tamil-text pt-5 text-lg font-semibold leading-[1.7]"
                          style={{ color: "var(--accent-2)" }}
                        >
                          {cleanFormatting(cleanSubheading(p))}
                        </h3>
                      );
                    }

                    return (
                      <p
                        key={j}
                        className="font-tamil-text text-[17px] leading-[2]"
                        style={{ color: "var(--text)" }}
                      >
                        {cleaned}
                      </p>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>

        <div
          className="mt-20 border-t pt-6"
          style={{ borderColor: "var(--border)" }}
        >
          <a
            href="/about"
            className="group inline-flex items-center gap-2 text-sm transition-opacity hover:opacity-70"
            style={{ color: "var(--text-muted)" }}
          >
            <span
              className="transition-transform group-hover:-translate-x-1"
              aria-hidden="true"
            >
              ←
            </span>

            அறிமுகம்
          </a>
        </div>
      </div>
      <LongPageNavigation />
    </main>
  );
}
