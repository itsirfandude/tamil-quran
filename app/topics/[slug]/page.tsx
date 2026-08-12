import { notFound } from "next/navigation";
import Link from "next/link";

import {
  getTopicContent,
  getTopicContentMap,
  getTopics,
} from "@/lib/data";
import { LongPageNavigation } from "@/components/LongPageNavigation";

type TopicItem = {
  text?: string;
  references?: string[];
};

type TopicSubtopic = {
  title: string;
  items?: TopicItem[];
};

type Topic = {
  id?: number;
  number?: number | null;
  title: string | null;
  items?: TopicItem[];
  subtopics?: TopicSubtopic[];
};

type TopicSection = {
  title: string;
  topics: Topic[];
};

type TopicContent = {
  sections: TopicSection[];
};

export default async function TopicPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const groups = await getTopics();
  const content = (await getTopicContent()) as TopicContent;
  const contentMap = await getTopicContentMap();

  let selectedGroup: (typeof groups)[number] | undefined;
  let selectedItem: (typeof groups)[number]["items"][number] | undefined;

  for (const group of groups) {
    for (const item of group.items) {
      if (item.slug === slug) {
        selectedGroup = group;
        selectedItem = item;
        break;
      }
      const child = item.children?.find((entry) => entry.slug === slug);
      if (child) {
        selectedGroup = group;
        selectedItem = child;
        break;
      }
    }
    if (selectedItem) break;
  }

  if (!selectedGroup || !selectedItem) {
    notFound();
  }

  const mapping = contentMap.entries[slug];
  if (!mapping) notFound();

  const contentSection = content.sections.find(
    (section) => section.title === mapping.section,
  );

  if (!contentSection) {
    notFound();
  }

  if (mapping.mode === "parent" || mapping.mode === "container") {
    const children = selectedItem.children ?? [];

    return (
      <main id="main" className="long-page-content flex-1 py-10 sm:py-14">
        <div className="topic-reading mx-auto max-w-2xl px-5 sm:px-6">
          <header className="mb-12">
            <p
              className="topic-section-label font-tamil-text mb-3 text-xs"
              style={{ color: "var(--accent-2)" }}
            >
              {selectedGroup.title}
            </p>

            <h1
              className="topic-page-title font-tamil-text text-3xl leading-[1.45] sm:text-4xl"
              style={{ color: "var(--text)" }}
            >
              {selectedItem.title}
            </h1>

            <div
              className="mt-7 h-px w-12"
              style={{ background: "var(--accent-2)" }}
            />
          </header>

          <nav aria-label={selectedItem.title}>
            <div
              className="overflow-hidden rounded-2xl border"
              style={{ borderColor: "var(--border)" }}
            >
              {children.map((child) => (
                <Link
                  key={child.slug}
                  href={`/topics/${child.slug}`}
                  className="font-tamil-text flex items-center justify-between gap-4 border-b px-5 py-4 text-[17px] leading-[1.8] last:border-b-0 transition-opacity hover:opacity-70 sm:px-6"
                  style={{
                    borderColor: "var(--border)",
                    color: "var(--text)",
                  }}
                >
                  <span>{child.title}</span>
                  <span
                    className="shrink-0 text-lg"
                    style={{ color: "var(--accent-2)" }}
                    aria-hidden="true"
                  >
                    →
                  </span>
                </Link>
              ))}
            </div>
          </nav>
          <LongPageNavigation />
        </div>
      </main>
    );
  }

  const topics =
    mapping.mode === "topic"
      ? contentSection.topics.filter(
          (topic) => topic.title === mapping.sourceTopic,
        )
      : mapping.mode === "topics"
        ? contentSection.topics.filter((topic) =>
            topic.title !== null && mapping.sourceTopics?.includes(topic.title),
          )
      : contentSection.topics;

  if ((mapping.mode === "topic" || mapping.mode === "topics") && topics.length === 0) {
    notFound();
  }

  const quranTransitionText = "திருக்குர்ஆன் இறைவேதம் என்பதற்கான சான்றுகள்";

  return (
    <main id="main" className="long-page-content flex-1 py-10 sm:py-14">
      <div className="topic-reading mx-auto max-w-2xl px-5 sm:px-6">
        <header className="mb-12">
          <p
            className="topic-section-label font-tamil-text mb-3 text-xs"
            style={{ color: "var(--accent-2)" }}
          >
            {selectedGroup.title}
          </p>

          <h1
            className="topic-page-title font-tamil-text text-3xl leading-[1.45] sm:text-4xl"
            style={{ color: "var(--text)" }}
          >
            {selectedItem.title}
          </h1>

          <div
            className="mt-7 h-px w-12"
            style={{ background: "var(--accent-2)" }}
          />
        </header>

        <article>
          {topics.map((topic, topicIndex) => {
            const renderedItems = [
              ...(topic.items ?? []).map((item) => ({
                item,
                subtopicTitle: null as string | null,
              })),
              ...(topic.subtopics ?? []).flatMap((subtopic) =>
                (subtopic.items ?? []).map((item) => ({
                  item,
                  subtopicTitle: subtopic.title,
                })),
              ),
            ].filter(({ item }) => item.text?.trim());

            if (renderedItems.length === 0) return null;

            return (
              <section
                key={`${selectedItem.slug}-${topicIndex}`}
                className="topic-section mb-12 last:mb-0 sm:mb-14"
              >
                {!(topicIndex === 0 && topic.title === selectedItem.title) && (
                  <h2
                    className="topic-heading font-tamil-text mb-7 text-xl leading-[1.55] sm:text-2xl"
                    style={{ color: "var(--accent-2)" }}
                  >
                    {topic.number != null ? `${topic.number}. ` : ""}
                    {topic.title ?? ""}
                  </h2>
                )}

                {renderedItems.map(({ item, subtopicTitle }, flatIndex) => (
                  <div key={`${selectedItem.slug}-${topicIndex}-${flatIndex}`}>
                    {item.text === quranTransitionText && (
                      <h2
                        className="topic-heading font-tamil-text mb-7 mt-12 text-xl leading-[1.55] sm:mt-14 sm:text-2xl"
                        style={{ color: "var(--accent-2)" }}
                        aria-label="திருக்குர்ஆன்"
                      >
                        திருக்குர்ஆன்
                      </h2>
                    )}
                    {subtopicTitle && (
                      <h3
                        className="topic-subheading font-tamil-text mb-4 mt-10 text-lg leading-[1.6]"
                        style={{ color: "var(--accent-2)" }}
                      >
                        {subtopicTitle}
                      </h3>
                    )}
                    <div
                      className="topic-item mb-9 last:mb-0 sm:mb-10"
                    >
                      <p
                        className="topic-body font-tamil-text text-[16px] leading-[1.95] sm:text-[16.5px]"
                        style={{ color: "var(--text)" }}
                      >
                        {item.text}
                      </p>

                      {item.references && item.references.length > 0 && (
                        <p
                          className="topic-references mt-3 text-xs leading-6"
                          style={{ color: "var(--text-muted)" }}
                        >
                          {item.references.join(", ")}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </section>
            );
          })}
        </article>
      </div>
      <LongPageNavigation />
    </main>
  );
}
