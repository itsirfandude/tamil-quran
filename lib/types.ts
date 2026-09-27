export interface AyahGroup {
  verses: number[];
  tamil: string;
  arabic: string;
  notes: number[];
}

export interface Note {
  number: number;
  title: string;
  paragraphs: string[];
}

export interface NoteIndexEntry {
  number: number;
  title: string;
}

export interface IntroSection {
  title: string;
  paragraphs: string[];
}

export interface SurahIntroduction {
  name_meaning: string | null;
  paragraphs: string[];
}

export interface Surah {
  number: number;
  name_tamil: string;
  stated_total_verses: number | null;
  introduction: SurahIntroduction;
  ayah_groups: AyahGroup[];
}

export interface SurahMeta {
  number: number;
  name_tamil: string;
  total_verses: number | null;
  total_groups: number;
}

export interface SearchEntry {
  surah: number;
  verses: number[];
  tamil: string;
}

export type ThemeId =
  | "classic"
  | "dark"
  | "sepia"
  | "night-blue"
  | "emerald"
  | "contrast";

export interface ReaderPrefs {
  theme: ThemeId;
  tamilFontSize: number; // px
  arabicFontSize: number; // px
  lineHeight: number; // unitless multiplier
  showArabic: boolean;
  showTamil: boolean;
  readingWidth: "narrow" | "normal" | "wide";
}

export const DEFAULT_PREFS: ReaderPrefs = {
  theme: "dark",
  tamilFontSize: 21,
  arabicFontSize: 30,
  lineHeight: 1.9,
  showArabic: true,
  showTamil: true,
  readingWidth: "normal",
};

export interface Bookmark {
  key: string; // `${surah}:${verses.join('-')}`
  surah: number;
  verses: number[];
  note?: string;
  createdAt: number;
}

export interface ReadingProgress {
  surah: number;
  groupIndex: number;
  verses: number[];
  updatedAt: number;
}

export interface HadithCollection {
  slug: string;
  title: {
    latin: string;
    tamil: string;
  };
  stated_description?: string;
  stated_total?: number;
  source?: {
    url: string;
    attribution?: string;
    retrieved_at?: string;
    copyright_notice?: string;
  };
}

export interface HadithIndexEntry {
  number: number;
  primary_reference?: string;
  source_url?: string;
  collection_page_status?: string;
}

export interface HadithReference {
  label: string;
  url: string;
}

export interface HadithRecord {
  collection_slug: string;
  number: number;
  references: HadithReference[];
  primary_source_reference?: string;
  tamil: { blocks: string[] };
  arabic: {
    text_blocks?: string[];
    chapter_blocks?: string[];
    isnad_blocks?: string[];
  };
  source_context?: {
    chapter_blocks?: string[];
    narrator_blocks?: string[];
    source_reference_blocks?: string[];
    additional_note_blocks?: string[];
    cross_reference_blocks?: string[];
  };
  collection_page_status?: string;
  provenance?: {
    source_url?: string;
    collection_url?: string;
    retrieved_at?: string;
  };
  source_membership_label?: string;
}
