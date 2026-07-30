import type { MetadataRoute } from "next";
import { TOTAL_SURAHS } from "@/lib/data";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://example.com";
  const surahs: MetadataRoute.Sitemap = Array.from(
    { length: TOTAL_SURAHS },
    (_, i) => ({
      url: `${base}/surah/${i + 1}`,
      changeFrequency: "yearly",
      priority: 0.8,
    })
  );
  return [{ url: base, changeFrequency: "daily", priority: 1 }, ...surahs];
}
