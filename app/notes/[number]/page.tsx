import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { SiteHeader } from "@/components/SiteHeader";
import { getNote, TOTAL_NOTES } from "@/lib/data";

export async function generateStaticParams() {
  return Array.from({ length: TOTAL_NOTES }, (_, i) => ({
    number: String(i + 1),
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ number: string }>;
}): Promise<Metadata> {
  const { number } = await params;
  const note = await getNote(Number(number));
  if (!note) return {};
  return { title: `${note.title} — குறிப்பு ${note.number}` };
}

export default async function NotePage({
  params,
}: {
  params: Promise<{ number: string }>;
}) {
  const { number } = await params;
  const num = Number(number);
  if (!Number.isInteger(num) || num < 1 || num > TOTAL_NOTES) notFound();

  const note = await getNote(num);
  if (!note) notFound();

  const prev = num > 1 ? num - 1 : null;
  const next = num < TOTAL_NOTES ? num + 1 : null;

  return (
    <>
      <SiteHeader />
      <main id="main" className="flex-1 py-10 sm:py-14">
        <div className="mx-auto max-w-2xl px-4 sm:px-6">
          <p
            className="text-xs uppercase tracking-wider mb-2"
            style={{ color: "var(--accent-2)" }}
          >
            குறிப்பு {note.number} · Explanatory Note
          </p>
          <h1
            className="font-display text-2xl sm:text-3xl italic mb-8"
            style={{ color: "var(--text)" }}
          >
            {note.title}
          </h1>

          <div className="space-y-4">
            {note.paragraphs.map((p, i) => (
              <p
                key={i}
                className="font-tamil-text"
                style={{ fontSize: "18px", lineHeight: 1.9, color: "var(--text)" }}
              >
                {p}
              </p>
            ))}
          </div>

          <nav
            className="mt-12 flex items-center justify-between gap-4 border-t pt-6"
            style={{ borderColor: "var(--border)" }}
          >
            {prev ? (
              <Link href={`/notes/${prev}`} className="text-sm" style={{ color: "var(--accent-2)" }}>
                ← Note {prev}
              </Link>
            ) : (
              <span />
            )}
            {next ? (
              <Link href={`/notes/${next}`} className="text-sm" style={{ color: "var(--accent-2)" }}>
                Note {next} →
              </Link>
            ) : (
              <span />
            )}
          </nav>
        </div>
      </main>
    </>
  );
}
