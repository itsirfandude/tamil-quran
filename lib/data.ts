import "server-only";
import { promises as fs } from "fs";
import path from "path";
import type {
  IntroSection,
  Note,
  NoteIndexEntry,
  Surah,
  SurahMeta,
} from "./types";

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

export async function getNoteIndex(): Promise<NoteIndexEntry[]> {
  const raw = await fs.readFile(
    path.join(DATA_DIR, "notes-index.json"),
    "utf-8",
  );
  return JSON.parse(raw);
}

export async function getIntroSections(): Promise<IntroSection[]> {
  const raw = await fs.readFile(path.join(DATA_DIR, "intro.json"), "utf-8");
  return JSON.parse(raw);
}
export type TopicChild = {
  title: string;
  slug: string;
};

export type TopicItem = {
  title: string;
  slug: string;
  children?: TopicChild[];
};

export type TopicGroup = {
  title: string;
  items: TopicItem[];
};

export async function getTopics(): Promise<TopicGroup[]> {
  const raw = await fs.readFile(path.join(DATA_DIR, "topics.json"), "utf-8");
  return JSON.parse(raw);
}

export type TopicContentMapEntry = {
  section: string;
  mode: "section" | "topic" | "topics" | "parent" | "container";
  sourceTopic?: string;
  sourceTopics?: string[];
  children?: string[];
};

export type TopicContentMap = {
  version: number;
  entries: Record<string, TopicContentMapEntry>;
};

export async function getTopicContentMap(): Promise<TopicContentMap> {
  const raw = await fs.readFile(
    path.join(DATA_DIR, "topic_content_map.json"),
    "utf-8",
  );

  const map = JSON.parse(raw) as TopicContentMap;
  return {
    ...map,
    entries: Object.fromEntries(
      Object.entries(map.entries).map(([slug, entry]) => [
        slug,
        entry.mode === "container" ? { ...entry, mode: "parent" } : entry,
      ]),
    ),
  };
}

export async function getTopicContent() {
  const raw = await fs.readFile(
    path.join(DATA_DIR, "topic_content.json"),
    "utf-8",
  );

  return JSON.parse(raw);
}
export const TOTAL_SURAHS = 114;
