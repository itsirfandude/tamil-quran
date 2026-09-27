import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { HadithReader } from "@/components/HadithReader";
import { ReadingWidthWrapper } from "@/components/ReadingWidthWrapper";
import { getHadithCollection, getHadithIndex, getHadithRecord } from "@/lib/hadith";

const COLLECTION_SLUG = "arbaeen-nawawi";

export async function generateStaticParams() {
  const index = await getHadithIndex(COLLECTION_SLUG);
  return (index ?? []).map((entry) => ({ number: String(entry.number) }));
}

export async function generateMetadata({ params }: { params: Promise<{ number: string }> }): Promise<Metadata> {
  const { number } = await params;
  const record = await getHadithRecord(COLLECTION_SLUG, Number(number));
  if (!record) return {};
  return {
    title: `ஹதீஸ் ${record.number} — அல்அர்பஈன் நவவீ`,
    description: `அல்அர்பஈன் நவவீ, ஹதீஸ் ${record.number}.`,
  };
}

export default async function HadithRecordPage({ params }: { params: Promise<{ number: string }> }) {
  const { number } = await params;
  const parsedNumber = Number(number);
  if (!Number.isInteger(parsedNumber) || parsedNumber < 1) notFound();

  const [collection, index, record] = await Promise.all([
    getHadithCollection(COLLECTION_SLUG),
    getHadithIndex(COLLECTION_SLUG),
    getHadithRecord(COLLECTION_SLUG, parsedNumber),
  ]);
  if (!collection || !index || !record || !index.some((entry) => entry.number === parsedNumber)) notFound();

  const position = index.findIndex((entry) => entry.number === parsedNumber);
  const previousNumber = position > 0 ? index[position - 1].number : undefined;
  const nextNumber = position < index.length - 1 ? index[position + 1].number : undefined;

  return (
    <main id="main" className="flex-1 py-10 sm:py-14">
      <ReadingWidthWrapper widen>
        <HadithReader
          collectionSlug={collection.slug}
          collectionName={collection.title.tamil}
          record={record}
          previousNumber={previousNumber}
          nextNumber={nextNumber}
        />
      </ReadingWidthWrapper>
    </main>
  );
}
