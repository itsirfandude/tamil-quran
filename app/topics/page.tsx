import Link from "next/link";

import { getTopics } from "@/lib/data";

export const metadata = {
  title: "பொருள் அட்டவணை · திருக்குர்ஆன்",
};

export default async function TopicsPage() {
  const groups = await getTopics();

  return (
    <main id="main" className="flex-1 py-10 sm:py-14">
      <div className="mx-auto max-w-3xl px-5 sm:px-6">
        <header className="mb-12">
          <p
            className="font-tamil-text mb-3 text-xs"
            style={{ color: "var(--accent-2)" }}
          >
            பொருள் அட்டவணை
          </p>

          <h1
            className="font-tamil-text text-3xl leading-[1.35] sm:text-4xl"
            style={{ color: "var(--text)" }}
          >
            தலைப்புகளின் பட்டியல்
          </h1>

          <div
            className="mt-7 h-px w-12"
            style={{ background: "var(--accent-2)" }}
          />
        </header>

        <div className="space-y-12">
          {groups.map((group) => {
            const isSingleSameTitleItem =
              group.items.length === 1 &&
              group.items[0].title === group.title;

            if (isSingleSameTitleItem) {
              const item = group.items[0];

              return (
                <Link
                  key={group.title}
                  href={`/topics/${item.slug}`}
                  className="font-tamil-text flex items-center justify-between gap-4 rounded-2xl border px-5 py-5 text-[17px] leading-[1.8] transition-opacity hover:opacity-70 sm:px-6"
                  style={{
                    borderColor: "var(--border)",
                    color: "var(--text)",
                  }}
                >
                  <span>{item.title}</span>

                  <span
                    className="shrink-0 text-lg"
                    style={{ color: "var(--accent-2)" }}
                    aria-hidden="true"
                  >
                    →
                  </span>
                </Link>
              );
            }

            return (
              <section key={group.title}>
                <h2
                  className="font-tamil-text mb-5 text-xl font-semibold leading-[1.6] sm:text-2xl"
                  style={{ color: "var(--accent-2)" }}
                >
                  {group.title}
                </h2>

                <div
                  className="overflow-hidden rounded-2xl border"
                  style={{ borderColor: "var(--border)" }}
                >
                  {group.items.map((item) => (
                    <div
                      key={item.slug}
                      className="border-b last:border-b-0"
                      style={{ borderColor: "var(--border)" }}
                    >
                      <Link
                        href={`/topics/${item.slug}`}
                        className="font-tamil-text flex items-center justify-between gap-4 px-5 py-4 text-[17px] leading-[1.8] transition-opacity hover:opacity-70 sm:px-6"
                        style={{ color: "var(--text)" }}
                      >
                        <span>{item.title}</span>

                        <span
                          className="shrink-0 text-lg"
                          style={{ color: "var(--accent-2)" }}
                          aria-hidden="true"
                        >
                          →
                        </span>
                      </Link>
                    </div>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </main>
  );
}