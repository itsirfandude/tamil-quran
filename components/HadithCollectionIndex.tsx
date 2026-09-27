import { HadithCard } from "@/components/HadithCard";
import { getHadithCollection, getHadithIndex, getHadithRecord } from "@/lib/hadith";
import { tamilHadithPreview } from "@/lib/hadith-presentation";

export async function HadithCollectionIndex({ slug }: { slug: string }) {
  const collection = await getHadithCollection(slug);
  const index = collection ? await getHadithIndex(slug) : null;
  if (!collection || !index) return null;

  const entries = await Promise.all(index.map(async (entry) => {
    const record = await getHadithRecord(slug, entry.number);
    return { entry, preview: record ? tamilHadithPreview(record.tamil.blocks) : "" };
  }));

  return (
    <section aria-labelledby={`${slug}-heading`}>
      <div className="mb-6 border-b pb-6" style={{ borderColor: "var(--border)" }}>
        <h2 id={`${slug}-heading`} className="font-tamil-text" style={{ fontSize: "24px", color: "var(--text)" }}>{collection.title.tamil}</h2>
        {collection.stated_description && <p className="mt-3 font-tamil-text" style={{ fontSize: "18px", color: "var(--text-muted)" }}>{collection.stated_description}</p>}
        <p className="mt-3 text-sm" style={{ color: "var(--text-muted)" }}>{collection.stated_total ?? entries.length} ஹதீஸ்கள்</p>
      </div>
      <div>{entries.map(({ entry, preview }) => <HadithCard key={entry.number} collectionSlug={slug} entry={entry} preview={preview} />)}</div>
    </section>
  );
}
