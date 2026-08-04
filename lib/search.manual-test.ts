// Manual test script for lib/search.ts - run with:
//   npx tsx lib/search.manual-test.ts
// Requires a local static server serving ./public at localhost:8899
// (python3 -m http.server 8899, run from the public/ directory).
// Not part of the app build; delete freely.

import {
  search,
  calculateScore,
  createSnippet,
  rankResults,
  searchSurahs,
  searchVerses,
  searchIntroductions,
  searchNotes,
  SCORE,
  loadSearchIndex,
  loadSurahIndex,
  type SearchResult,
} from "./search";

const originalFetch = global.fetch;
(global as unknown as { fetch: typeof fetch }).fetch = ((
  input: RequestInfo | URL,
  init?: RequestInit
) => {
  const url = typeof input === "string" ? input : input.toString();
  return originalFetch(`http://localhost:8899${url}`, init);
}) as typeof fetch;

let pass = 0;
let fail = 0;

function check(label: string, condition: boolean, detail?: string) {
  if (condition) {
    pass++;
    console.log(`  ok  - ${label}`);
  } else {
    fail++;
    console.log(`  FAIL - ${label}${detail ? `  (${detail})` : ""}`);
  }
}

async function main() {
  console.log("=== calculateScore / createSnippet (unchanged from V1) ===");
  check(
    "exact Surah number scores 1000",
    calculateScore("96", "96", "number") === SCORE.EXACT_SURAH_NUMBER
  );
  check(
    "exact name match scores 900",
    calculateScore("Al-Fatihah", "Al-Fatihah", "name") === SCORE.EXACT_NAME
  );
  const snippet = createSnippet("...அல்லாஹ் மிகவும்...", "அல்லாஹ் மிகவும்", 15);
  check("snippet contains match", snippet.includes("அல்லாஹ் மிகவும்"));

  console.log("\n=== rankResults ===");
  const mixed: SearchResult[] = [
    { type: "verse", score: 700, surah: 1, surahName: "x", verses: [1], label: "1:1", snippet: "", href: "" },
    { type: "surah", score: 700, surah: 20, nameTamil: "x", nameEnglish: null, nameArabic: null, href: "" },
    { type: "note", score: 700, note: 1, title: "x", snippet: "", href: "" },
  ];
  const ranked = rankResults(mixed);
  check(
    "equal scores: surah ranks first, then verse (primary content), then note",
    ranked[0].type === "surah" && ranked[1].type === "verse" && ranked[2].type === "note",
    ranked.map((r) => r.type).join(",")
  );
  const scoreOverridesType: SearchResult[] = [
    { type: "verse", score: 900, surah: 1, surahName: "x", verses: [1], label: "1:1", snippet: "", href: "" },
    { type: "surah", score: 300, surah: 20, nameTamil: "x", nameEnglish: null, nameArabic: null, href: "" },
  ];
  check(
    "higher score always wins regardless of type",
    rankResults(scoreOverridesType)[0].type === "verse"
  );

  console.log("\n=== searchSurahs (pure, data-injected) ===");
  const surahIdx = await loadSurahIndex();
  const surahHits = searchSurahs("96", surahIdx);
  check(
    "'96' matches exactly Surah 96 with type 'surah'",
    surahHits.length === 1 && surahHits[0].surah === 96 && surahHits[0].type === "surah",
    JSON.stringify(surahHits)
  );
  const baqarahHits = searchSurahs("Al-Baqarah", surahIdx);
  check(
    "English name 'Al-Baqarah' matches Surah 2 with nameEnglish populated",
    baqarahHits.some((r) => r.surah === 2 && r.nameEnglish === "Al-Baqarah")
  );

  console.log("\n=== searchVerses (pure, data-injected) ===");
  const searchIdx = await loadSearchIndex();
  const nameById = new Map(surahIdx.map((s) => [s.number, "Al-Fatihah"])); // caller supplies whatever names it wants
  const verseHits = searchVerses("எல்லாப் புகழும்", searchIdx, nameById);
  check(
    "verse search finds 1:1 and attaches the surahName the caller supplied",
    verseHits.some((r) => r.surah === 1 && r.verses[0] === 1 && r.surahName === "Al-Fatihah"),
    JSON.stringify(verseHits[0])
  );

  console.log("\n=== searchIntroductions ===");
  const introEntries = [
    {
      surah: 96,
      surahName: "அல் அலக்",
      nameMeaning: "அல் அலக் - கருவுற்ற சினை முட்டை",
      paragraphs: ["இந்த அத்தியாயத்தின் இரண்டாவது வசனத்தில் அலக் என்ற சொல் இடம் பெற்றிருப்பதால்"],
    },
    { surah: 1, surahName: "அல் ஃபாத்திஹா", nameMeaning: null, paragraphs: [] },
  ];
  const introHits = searchIntroductions("கருவுற்ற", introEntries);
  check(
    "introduction search matches Surah 96's name-meaning text",
    introHits.length === 1 && introHits[0].surah === 96 && introHits[0].type === "introduction",
    JSON.stringify(introHits)
  );
  const introNoMatch = searchIntroductions("zzznotfound", introEntries);
  check("introduction search returns nothing for a non-match", introNoMatch.length === 0);
  const introEmptyEntry = searchIntroductions("ஃபாத்திஹா", introEntries);
  check(
    "an entry with no meaning/paragraphs never errors",
    Array.isArray(introEmptyEntry)
  );

  console.log("\n=== searchNotes ===");
  const noteEntries = [
    { number: 26, title: "பொருத்தமில்லாத வசன எண்கள்", paragraphs: ["இந்த மொழிபெயர்ப்பில் சில வசனங்கள் இணைக்கப்பட்டுள்ளன."] },
    { number: 1, title: "மறுமை நாள்", paragraphs: ["வானம், பூமி அழிக்கப்படும்."] },
  ];
  const noteHits = searchNotes("பொருத்தமில்லாத", noteEntries);
  check(
    "note search matches note 26's title and returns href /notes/26",
    noteHits.length === 1 && noteHits[0].note === 26 && noteHits[0].href === "/notes/26",
    JSON.stringify(noteHits)
  );

  const titleOnlyMatch = searchNotes("பொருத்தமில்லாத", [
    { number: 1, title: "பொருத்தமில்லாத தலைப்பு", paragraphs: ["unrelated body text"] },
  ]);
  check(
    "a query matching only a note's short title is capped at WHOLE_WORD, not STARTS_WITH",
    titleOnlyMatch[0]?.score === SCORE.WHOLE_WORD,
    String(titleOnlyMatch[0]?.score)
  );
  const bodySubstantialMatch = searchNotes("குறிப்பிட்ட", [
    { number: 2, title: "வேறு தலைப்பு", paragraphs: ["இது ஒரு குறிப்பிட்ட விளக்கமான பத்தி ஆகும், நீண்ட உரையாக உள்ளது."] },
  ]);
  check(
    "a genuine body-text match can still reach a higher tier than a title-only match",
    bodySubstantialMatch[0]?.score !== undefined && bodySubstantialMatch[0].score >= SCORE.WHOLE_WORD,
    String(bodySubstantialMatch[0]?.score)
  );

  console.log("\n=== search() end to end (browser-facing: surah + verse only) ===");
  const bySurahNumber = await search("20");
  check(
    "searching '20' returns Surah 20 first, type 'surah'",
    bySurahNumber[0]?.type === "surah" && bySurahNumber[0].surah === 20,
    JSON.stringify(bySurahNumber[0])
  );

  const byAllah = await search("அல்லாஹ்");
  check(
    "searching a common word returns verse results",
    byAllah.some((r) => r.type === "verse")
  );
  const isSorted = byAllah.every((r, i) => i === 0 || byAllah[i - 1].score >= r.score);
  check("results are sorted by score descending", isSorted);

  const empty = await search("   ");
  check("blank query returns empty array", empty.length === 0);

  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail > 0 ? 1 : 0);
}

main();
