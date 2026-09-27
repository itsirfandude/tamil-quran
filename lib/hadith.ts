import "server-only";
import { promises as fs } from "fs";
import path from "path";
import type { HadithCollection, HadithIndexEntry, HadithRecord } from "./types";

const HADITH_DATA_DIR = path.join(process.cwd(), "public", "data", "hadith");

export async function getHadithCollections(): Promise<HadithCollection[]> {
  const raw = await fs.readFile(path.join(HADITH_DATA_DIR, "collections.json"), "utf-8");
  return JSON.parse(raw);
}

export async function getHadithCollection(slug: string): Promise<HadithCollection | null> {
  const collections = await getHadithCollections();
  return collections.find((collection) => collection.slug === slug) ?? null;
}

export async function getHadithIndex(slug: string): Promise<HadithIndexEntry[] | null> {
  try {
    const raw = await fs.readFile(path.join(HADITH_DATA_DIR, slug, "index.json"), "utf-8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function getHadithRecord(
  slug: string,
  number: number,
): Promise<HadithRecord | null> {
  try {
    const raw = await fs.readFile(path.join(HADITH_DATA_DIR, slug, `${number}.json`), "utf-8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
