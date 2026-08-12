import { notFound } from "next/navigation";
import Link from "next/link";

import { aboutSections } from "@/lib/about";
import { getIntroSections } from "@/lib/data";
import { LongPageNavigation } from "@/components/LongPageNavigation";

interface Props {
  params: Promise<{
    slug: string;
  }>;
  searchParams: Promise<{
    expand?: string;
  }>;
}

function isSubheading(p: string) {
  return /^#{1,6}\s+/.test(p.trim());
}

function cleanSubheading(p: string) {
  return p.trim().replace(/^#{1,6}\s+/, "");
}

function isBullet(p: string) {
  return /^[\u200B\u200C\u200D\uFEFF]*எ(?:\s+|$)/.test(p.trim());
}

function cleanBullet(p: string) {
  return p
    .trim()
    .replace(/^[\u200B\u200C\u200D\uFEFF]*எ(?:\s+|$)/, "")
    .trim();
}

function cleanFormatting(p: string) {
  return p.replace(/\*\*/g, "").replace(/__/g, "").trim();
}

function isGlossaryReference(p: string) {
  const text = p.trim();
  return text.startsWith("(") && text.endsWith(")");
}
function isGlossaryTerm(p: string) {
  const text = p.trim();

  if (!text || isGlossaryReference(text)) {
    return false;
  }

  // Cross-references belong to the preceding term.
  if (
    /\d/.test(text) ||
    /பார்க்கவும்|பார்க்க|காண்க|காணலாம்|அறிய|விபரம்|தகவல்/.test(text)
  ) {
    return false;
  }

  // Glossary terms are short standalone labels.
  return (
    text.length <= 80 &&
    !/[.!?;:…]$/.test(text) &&
    !/[.!?;:…]["'”’]$/.test(text)
  );
}

function groupGlossaryTerms(paragraphs: readonly string[]) {
  const terms: {
    title: string;
    paragraphs: string[];
    reference?: string;
  }[] = [];

  let current: {
    title: string;
    paragraphs: string[];
    reference?: string;
  } | null = null;

  for (const paragraph of paragraphs) {
    const text = paragraph.trim();

    if (!text) continue;

    // New glossary term = new card
    if (isGlossaryTerm(text)) {
      current = {
        title: text,
        paragraphs: [],
      };

      terms.push(current);
      continue;
    }

    if (!current) continue;

    // Reference belongs to the current term
    if (isGlossaryReference(text)) {
      current.reference = text;
      continue;
    }

    // Normal explanation belongs to the current term
    current.paragraphs.push(text);
  }

  return terms;
}

const sourceTitleMap: Record<string, string> = {
  "வாசிப்பதற்கு முன்": "வாசிப்பதற்கு முன்",
  "இந்நூலைப் பயன்படுத்தும் முறை":
    "இந்நூலைப் பயன்படுத்தும் முறை",
  "இம்மொழிபெயர்ப்பு பற்றி":
    "இம்மொழிபெயர்ப்பு பற்றி...",
  "இது இறை வேதம்":
    "இது இறை வேதம்",
  "இறைவேதம் என்பதற்கான சான்றுகள்":
    "இறைவேதம் என்பதற்கான சான்றுகள்",
  "திருக்குர்ஆன் அருளப்பட்ட வரலாறு":
    "திருக்குர்ஆன் எவ்வாறு அருளப்பட்டது?",
  "திருக்குர்ஆன் தொகுக்கப்பட்ட வரலாறு":
    "திருக்குர்ஆன் தொகுக்கப்பட்ட வரலாறு",
};

const topicGroups = [
  {
    title: "கொள்கை (அகீதா)",
    items: [
      {
        title: "அல்லாஹ்வை நம்புதல்",
        slug: "allah",
        sourceHeading: "அல்லாஹ்வை நம்புதல்",
      },
      {
        title: "வானவர்களை நம்புதல்",
        slug: "angels",
        sourceHeading: "வானவர்களை நம்புதல்",
      },
      {
        title: "வேதங்களை நம்புதல்",
        slug: "scriptures",
        sourceHeading: "வேதங்களை நம்புதல்",
        children: [
          {
            title: "முந்தைய வேதங்கள்",
            slug: "previous-scriptures",
            sourceHeading: "முந்தைய வேதங்கள்",
          },
        ],
      },
      {
        title: "தூதர்களை நம்புதல்",
        slug: "messengers",
        sourceHeading: "தூதர்களை நம்புதல்",
      },
      {
        title: "இறுதி நாளை நம்புதல்",
        slug: "last-day",
        sourceHeading: "இறுதி நாளை நம்புதல்",
      },
      {
        title: "விதியை நம்புதல்",
        slug: "destiny",
        sourceHeading: "விதியை நம்புதல்",
      },
      {
        title: "இதர நம்பிக்கைகள்",
        slug: "other-beliefs",
        sourceHeading: "இதர நம்பிக்கைகள்",
      },
    ],
  },

  {
    title: "வணக்கங்கள்",
    items: [
      {
        title: "தொழுகை",
        slug: "prayer",
        sourceHeading: "தொழுகை",
      },
      {
        title: "நோன்பு",
        slug: "fasting",
        sourceHeading: "நோன்பு",
      },
      {
        title: "ஸகாத்",
        slug: "zakat",
        sourceHeading: "ஸகாத்",
      },
      {
        title: "ஹஜ்",
        slug: "hajj",
        sourceHeading: "ஹஜ்",
      },
      {
        title: "இதர வணக்கங்கள்",
        slug: "other-worship",
        sourceHeading: "இதர வணக்கங்கள்",
      },
    ],
  },

  {
    title: "வரலாறு",
    items: [
      {
        title: "நபிமார்கள்",
        slug: "prophets",
        sourceHeading: "நபிமார்கள்",
      },
      {
        title: "நல்லோர் - தீயோர்",
        slug: "good-and-evil",
        sourceHeading: "நல்லோர் - தீயோர்",
      },
      {
        title: "இடங்கள்",
        slug: "places",
        sourceHeading: "இடங்கள்",
      },
      {
        title: "உயிரினங்கள்",
        slug: "creatures",
        sourceHeading: "உயிரினங்கள்",
      },
    ],
  },

  {
    title: "பண்புகள்",
    items: [
      {
        title: "நல்ல பண்புகள்",
        slug: "good-character",
        sourceHeading: "நல்ல பண்புகள்",
      },
      {
        title: "தீய பண்புகள்",
        slug: "bad-character",
        sourceHeading: "தீய பண்புகள்",
      },
    ],
  },

  {
    title: "பொருளாதாரம்",
    items: [
      {
        title: "பொருளாதாரம்",
        slug: "economy",
        sourceHeading: "பொருளாதாரம்",
      },
    ],
  },

  {
    title: "பெரும் பாவங்கள்",
    items: [
      {
        title: "பெரும் பாவங்கள்",
        slug: "major-sins",
        sourceHeading: "பெரும் பாவங்கள்",
      },
    ],
  },

  {
    title: "அரசியல்",
    items: [
      {
        title: "அரசியல்",
        slug: "politics",
        sourceHeading: "அரசியல்",
      },
    ],
  },

  {
    title: "குற்றவியல் சட்டங்கள்",
    items: [
      {
        title: "குற்றவியல் சட்டங்கள்",
        slug: "criminal-law",
        sourceHeading: "குற்றவியல் சட்டங்கள்",
      },
    ],
  },

  {
    title: "கல்வி",
    items: [
      {
        title: "கல்வி",
        slug: "education",
        sourceHeading: "கல்வி",
      },
    ],
  },

  {
    title: "குடும்பவியல்",
    items: [
      {
        title: "குடும்பவியல்",
        slug: "family",
        sourceHeading: "குடும்பவியல்",
      },
    ],
  },
] as const;

type TopicItem = {
  title: string;
  slug: string;
  sourceHeading: string;
  children?: readonly {
    title: string;
    slug: string;
    sourceHeading: string;
  }[];
};

type TopicGroup = {
  title: string;
  items: readonly TopicItem[];
};

export default async function AboutArticlePage({
  params,
  searchParams,
}: Props) {
  const { slug } = await params;
  const { expand } = await searchParams;
  const topicItem = (topicGroups as readonly TopicGroup[])
  .flatMap((group) => group.items)
    .find(
      (item) =>
        item.slug === slug ||
        item.children?.some((child) => child.slug === slug)
    );

  if (topicItem) {
    const selectedItem =
      topicItem.slug === slug
        ? topicItem
        : topicItem.children?.find((child) => child.slug === slug) ??
          topicItem;

    const sections = await getIntroSections();

    const content = sections.find(
      (section) =>
        section.title.trim() === selectedItem.sourceHeading.trim()
    );

    if (!content) {
      notFound();
    }

    const group = (topicGroups as readonly TopicGroup[]).find((candidate) =>
      candidate.items.some(
        (item) =>
          item.slug === selectedItem.slug ||
          item.children?.some(
            (child) => child.slug === selectedItem.slug
          )
      )
    );

    return (
      <main className="long-page-content mx-auto max-w-3xl px-5 pb-20 pt-8 sm:px-6 sm:pt-12">
        <Link
          href="/about"
          className="group mb-12 inline-flex items-center gap-2 text-sm transition-opacity hover:opacity-70"
          style={{ color: "var(--text-muted)" }}
        >
          <span
            className="transition-transform group-hover:-translate-x-1"
            aria-hidden="true"
          >
            ←
          </span>
          அறிமுகம்
        </Link>

        <header className="mb-10">
          <p
            className="font-tamil-text mb-4 text-xs tracking-[0.28em]"
            style={{ color: "var(--accent-2)" }}
          >
            {group?.title ?? "பொருள் அட்டவணை"}
          </p>

          <h1
            className="font-tamil-text text-3xl leading-[1.35] sm:text-4xl"
            style={{ color: "var(--accent-2)" }}
          >
            {selectedItem.title}
          </h1>

          <div
            className="mt-7 h-px w-12"
            style={{ background: "var(--accent-2)" }}
          />
        </header>

        <article className="max-w-2xl">
          <div className="space-y-5">
            {content.paragraphs.map((paragraph, index) =>
              isBullet(paragraph) ? (
                <div
                  key={index}
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
                    {cleanFormatting(cleanBullet(paragraph))}
                  </p>
                </div>
              ) : isSubheading(paragraph) ? (
                <h3
                  key={index}
                  className="font-tamil-text pt-5 text-lg font-semibold leading-[1.7]"
                  style={{ color: "var(--accent-2)" }}
                >
                  {cleanFormatting(cleanSubheading(paragraph))}
                </h3>
              ) : (
                <p
                  key={index}
                  className="font-tamil-text text-[17px] leading-[2]"
                  style={{ color: "var(--text)" }}
                >
                  {cleanFormatting(paragraph)}
                </p>
              )
            )}
          </div>
        </article>

        <nav
          className="mt-20 border-t pt-6"
          style={{ borderColor: "var(--border)" }}
        >
          <Link
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
          </Link>
        </nav>
        <LongPageNavigation />
      </main>
    );
  }
  /*
   * ============================================================
   * கலைச் சொற்கள்
   * ============================================================
   */

  if (slug === "tamil-terms" || slug === "arabic-terms") {
    const sections = await getIntroSections();

    const glossary = sections.find(
      (section) => section.title.trim() === "கலைச் சொற்கள்"
    );

    if (!glossary) {
      notFound();
    }

    const arabicMarker = "அரபு கலைச் சொற்கள்";

    const arabicStart = glossary.paragraphs.findIndex(
      (paragraph) => paragraph.trim() === arabicMarker
    );

    if (arabicStart === -1) {
      notFound();
    }

    const paragraphs =
      slug === "tamil-terms"
        ? glossary.paragraphs.slice(0, arabicStart)
        : glossary.paragraphs.slice(arabicStart + 1);

    const terms = groupGlossaryTerms(paragraphs);
    const expandAll = expand === "all";

    const title =
      slug === "tamil-terms"
        ? "தமிழ் கலைச் சொற்கள்"
        : "அரபு கலைச் சொற்கள்";

    const description =
      slug === "tamil-terms"
        ? "இஸ்லாமிய நம்பிக்கை சார்ந்த முக்கியமான தமிழ்ச் சொற்களின் விளக்கங்கள்."
        : "இந்தத் தமிழாக்கத்தில் இடம்பெறும் அரபுச் சொற்களுக்கான விளக்கங்கள்.";

    return (
      <main className="long-page-content mx-auto max-w-3xl px-5 pb-20 pt-8 sm:px-6 sm:pt-12">
        <Link
          href="/about"
          className="group mb-12 inline-flex items-center gap-2 text-sm transition-opacity hover:opacity-70"
          style={{ color: "var(--text-muted)" }}
        >
          <span
            className="transition-transform group-hover:-translate-x-1"
            aria-hidden="true"
          >
            ←
          </span>

          அறிமுகம்
        </Link>

        <header className="mb-10">
          <p
            className="font-tamil-text mb-4 text-xs"
            style={{ color: "var(--accent-2)" }}
          >
            கலைச் சொற்கள்
          </p>

          <h1
            className="font-tamil-text max-w-2xl text-3xl leading-[1.35] sm:text-4xl"
            style={{ color: "var(--accent-2)" }}
          >
            {title}
          </h1>

          <p
            className="font-tamil-text mt-5 max-w-2xl text-[16px] leading-[2]"
            style={{ color: "var(--text-muted)" }}
          >
            {description}
          </p>

          <div
            className="mt-7 h-px w-12"
            style={{ background: "var(--accent-2)" }}
          />
        </header>

        <div
          className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b pb-4"
          style={{ borderColor: "var(--border)" }}
        >
          <p
            className="font-tamil-text text-sm"
            style={{ color: "var(--text-muted)" }}
          >
            {terms.length} கலைச் சொற்கள்
          </p>

          <div className="flex items-center gap-2">
            {!expandAll ? (
              <Link
                href={`/about/${slug}?expand=all`}
                className="font-tamil-text rounded-full border px-4 py-2 text-sm transition-opacity hover:opacity-70"
                style={{
                  borderColor: "var(--border)",
                  color: "var(--accent-2)",
                }}
              >
                அனைத்தையும் பார்க்க
              </Link>
            ) : (
              <Link
                href={`/about/${slug}?expand=none`}
                className="font-tamil-text rounded-full border px-4 py-2 text-sm transition-opacity hover:opacity-70"
                style={{
                  borderColor: "var(--border)",
                  color: "var(--accent-2)",
                }}
              >
                அனைத்தையும் மூட
              </Link>
            )}
          </div>
        </div>

        <article className="max-w-2xl">
          <div
            className="overflow-hidden rounded-2xl border"
            style={{ borderColor: "var(--border)" }}
          >
            {terms.map((term, i) => (
              <details
                key={`${term.title}-${i}`}
                open={expandAll}
                className="group border-b last:border-b-0"
                style={{ borderColor: "var(--border)" }}
              >
                <summary
                  className="font-tamil-text flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-5 text-lg font-semibold leading-[1.6] sm:px-6"
                  style={{ color: "var(--text)" }}
                >
                  <span>
                    {cleanFormatting(cleanBullet(term.title))}
                  </span>

                  <span
                    className="shrink-0 text-xl font-normal transition-transform group-open:rotate-45"
                    style={{ color: "var(--accent-2)" }}
                    aria-hidden="true"
                  >
                    +
                  </span>
                </summary>

                <div className="px-5 pb-6 sm:px-6">
                  <div
                    className="mb-5 h-px w-8"
                    style={{ background: "var(--accent-2)" }}
                  />

                  <div className="space-y-4">
                   {term.paragraphs.map((paragraph, paragraphIndex) =>
  isBullet(paragraph) ? (
    <div
      key={paragraphIndex}
      className="flex gap-3 font-tamil-text text-[16px] leading-[2]"
      style={{ color: "var(--text)" }}
    >
      <span
        className="shrink-0 pt-[0.1em]"
        style={{ color: "var(--accent-2)" }}
        aria-hidden="true"
      >
        •
      </span>

      <p>{cleanFormatting(cleanBullet(paragraph))}</p>
    </div>
  ) : (
    <p
      key={paragraphIndex}
      className="font-tamil-text text-[16px] leading-[2]"
      style={{ color: "var(--text)" }}
    >
      {cleanFormatting(paragraph)}
    </p>
  )
)}
                  </div>

                  {term.reference && (
                    <p
                      className="font-tamil-text mt-5 border-t pt-4 text-sm leading-[1.9]"
                      style={{
                        borderColor: "var(--border)",
                        color: "var(--text-muted)",
                      }}
                    >
                      {cleanFormatting(
                        cleanBullet(term.reference)
                      )}
                    </p>
                  )}
                </div>
              </details>
            ))}
          </div>
        </article>

        <nav
          className="mt-20 border-t pt-6"
          style={{ borderColor: "var(--border)" }}
          aria-label="அறிமுகம் வழிசெலுத்தல்"
        >
          <Link
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
          </Link>
        </nav>
        <LongPageNavigation />
      </main>
    );
  }

  /*
   * ============================================================
   * Existing introduction-card behavior
   * ============================================================
   */

  const card = aboutSections.find((s) => s.slug === slug);

  if (!card) {
    notFound();
  }

  const sections = await getIntroSections();

  const sourceTitle = sourceTitleMap[card.title];

  if (!sourceTitle) {
    notFound();
  }

  const content = sections.find(
    (s) => s.title.trim() === sourceTitle.trim()
  );

  if (!content) {
    notFound();
  }

  return (
    <main className="long-page-content mx-auto max-w-3xl px-5 pb-20 pt-8 sm:px-6 sm:pt-12">
      <Link
        href="/about"
        className="group mb-12 inline-flex items-center gap-2 text-sm transition-opacity hover:opacity-70"
        style={{ color: "var(--text-muted)" }}
      >
        <span
          className="transition-transform group-hover:-translate-x-1"
          aria-hidden="true"
        >
          ←
        </span>

        அறிமுகம்
      </Link>

      <header className="mb-12">
        <div
          className="mb-5 text-xs tracking-[0.28em]"
          style={{ color: "var(--accent-2)" }}
        >
          {String(card.order).padStart(2, "0")}
        </div>

        <h1
          className="font-tamil-text max-w-2xl text-3xl leading-[1.35] sm:text-4xl"
          style={{ color: "var(--accent-2)" }}
        >
          {card.title}
        </h1>

        <div
          className="mt-7 h-px w-12"
          style={{ background: "var(--accent-2)" }}
        />
      </header>

      <article className="max-w-2xl">
        <div className="space-y-5">
          {content.paragraphs.map((p, i) =>
            isBullet(p) ? (
              <div
                key={i}
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
            ) : isSubheading(p) ? (
              <h3
                key={i}
                className="font-tamil-text pt-5 text-lg font-semibold leading-[1.7]"
                style={{ color: "var(--accent-2)" }}
              >
                {cleanFormatting(cleanSubheading(p))}
              </h3>
            ) : (
              <p
                key={i}
                className="font-tamil-text text-[17px] leading-[2]"
                style={{ color: "var(--text)" }}
              >
                {cleanFormatting(p)}
              </p>
            )
          )}
        </div>
      </article>

      <nav
        className="mt-20 border-t pt-6"
        style={{ borderColor: "var(--border)" }}
        aria-label="அறிமுகம் வழிசெலுத்தல்"
      >
        <Link
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
        </Link>
      </nav>
      <LongPageNavigation />
    </main>
  );
}
