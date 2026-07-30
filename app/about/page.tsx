import { SiteHeader } from "@/components/SiteHeader";
import { getIntroSections } from "@/lib/data";

export const metadata = { title: "அறிமுகம் · Introduction — திருக்குர்ஆன்" };

// Glossary entries in the source read as a short term line followed by its
// explanation. A short paragraph with no sentence-ending punctuation reads
// naturally as a term heading rather than prose.
function looksLikeTerm(p: string) {
  return p.length <= 60 && !/[.!?]['"]?$/.test(p.trim());
}

export default async function AboutPage() {
  const sections = await getIntroSections();

  return (
    <>
      <SiteHeader />
      <main id="main" className="flex-1 py-10 sm:py-14">
        <div className="mx-auto max-w-2xl px-4 sm:px-6">
          <p
            className="text-xs uppercase tracking-wider mb-2"
            style={{ color: "var(--accent-2)" }}
          >
            அறிமுகம்
          </p>
          <h1
            className="font-display text-2xl sm:text-3xl italic mb-10"
            style={{ color: "var(--text)" }}
          >
            Introduction
          </h1>

          <nav className="mb-12 flex flex-col gap-2" aria-label="Sections">
            {sections.map((s, i) => (
              <a
                key={i}
                href={`#section-${i}`}
                className="font-tamil-text text-sm"
                style={{ fontSize: "15px", color: "var(--accent-2)" }}
              >
                {s.title}
              </a>
            ))}
          </nav>

          <div className="space-y-16">
            {sections.map((s, i) => (
              <section key={i} id={`section-${i}`} className="scroll-mt-24">
                <h2
                  className="font-display text-xl italic mb-5"
                  style={{ color: "var(--text)" }}
                >
                  {s.title}
                </h2>
                <div className="space-y-4">
                  {s.paragraphs.map((p, j) =>
                    looksLikeTerm(p) ? (
                      <p
                        key={j}
                        className="font-tamil-text font-semibold pt-2"
                        style={{
                          fontSize: "18px",
                          color: "var(--accent-2)",
                        }}
                      >
                        {p}
                      </p>
                    ) : (
                      <p
                        key={j}
                        className="font-tamil-text"
                        style={{
                          fontSize: "17px",
                          lineHeight: 1.9,
                          color: "var(--text)",
                        }}
                      >
                        {p}
                      </p>
                    )
                  )}
                </div>
              </section>
            ))}
          </div>
        </div>
      </main>
    </>
  );
}
