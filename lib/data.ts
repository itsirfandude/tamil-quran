import "server-only";
import { promises as fs } from "fs";
import path from "path";
import type { IntroSection, Note, Surah, SurahMeta } from "./types";

const DATA_DIR = path.join(process.cwd(), "public", "data");

export async function getSurahIndex(): Promise<SurahMeta[]> {
  const raw = await fs.readFile(path.join(DATA_DIR, "index.json"), "utf-8");
  return JSON.parse(raw);
}

export async function getSurah(number: number): Promise<Surah | null> {
  try {
    const raw = await fs.readFile(
      path.join(DATA_DIR, "surah", `${number}.json`),
      "utf-8"
    );
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function getNote(number: number): Promise<Note | null> {
  try {
    const raw = await fs.readFile(
      path.join(DATA_DIR, "notes", `${number}.json`),
      "utf-8"
    );
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export const TOTAL_NOTES = 521;

export async function getIntroSections(): Promise<IntroSection[]> {
  const raw = await fs.readFile(path.join(DATA_DIR, "intro.json"), "utf-8");
  return JSON.parse(raw);
}

export const TOTAL_SURAHS = 114;
