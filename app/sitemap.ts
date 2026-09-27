import type { MetadataRoute } from "next";
import { TOTAL_SURAHS } from "@/lib/data";
import { getHadithIndex } from "@/lib/hadith";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = "https://example.com";
  const surahs: MetadataRoute.Sitemap = Array.from(
    { length: TOTAL_SURAHS },
    (_, i) => ({
      url: `${base}/surah/${i + 1}`,
      changeFrequency: "yearly",
      priority: 0.8,
    })
  );
  const hadithIndex = await getHadithIndex("arbaeen-nawawi");
  const hadith: MetadataRoute.Sitemap = [
    { url: `${base}/hadith`, changeFrequency: "monthly", priority: 0.7 },
    ...(hadithIndex ?? []).map((entry) => ({
      url: `${base}/hadith/arbaeen-nawawi/${entry.number}`,
      changeFrequency: "yearly" as const,
      priority: 0.6,
    })),
  ];
  return [{ url: base, changeFrequency: "daily", priority: 1 }, ...surahs, ...hadith];
}
