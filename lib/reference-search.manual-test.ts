// Manual test script for lib/reference-search.ts - run with:
//   npx tsx lib/reference-search.manual-test.ts
// Requires a local static server serving ./public at localhost:8899
// (python3 -m http.server 8899, run from the public/ directory).
// Not part of the app build; delete freely.

import { parseVerseReference, fetchVerseReference } from "./reference-search";

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
  console.log("=== parseVerseReference ===");
  check("'56:8' parses", JSON.stringify(parseVerseReference("56:8")) === JSON.stringify({ surah: 56, verse: 8 }));
  check("'22.11' (dot separator) parses", JSON.stringify(parseVerseReference("22.11")) === JSON.stringify({ surah: 22, verse: 11 }));
  check("'2:183-184' (range) parses", JSON.stringify(parseVerseReference("2:183-184")) === JSON.stringify({ surah: 2, verse: 183 }));
  check("plain text does not parse", parseVerseReference("Baqarah") === null);
  check("bare number does not parse (that's a different query shape)", parseVerseReference("20") === null);
  check("999:5 (out of range) still parses syntactically", parseVerseReference("999:5") !== null);

  console.log("\n=== fetchVerseReference ===");
  const r1 = await fetchVerseReference({ surah: 56, verse: 8 });
  check("56:8 resolves to a real verse", r1?.href === "/surah/56#8", JSON.stringify(r1));

  const r2 = await fetchVerseReference({ surah: 22, verse: 11 });
  check("22:11 resolves to a real verse", r2?.href === "/surah/22#11", JSON.stringify(r2));

  // Surah 1 verse 6 lives only inside the clubbed 6-7 group in this dataset
  const r3 = await fetchVerseReference({ surah: 1, verse: 6 });
  check(
    "clubbed verse (1:6, part of the 6-7 group) resolves to the group's first verse",
    r3?.href === "/surah/1#6",
    JSON.stringify(r3)
  );

  const r4 = await fetchVerseReference({ surah: 1, verse: 9999 });
  check("nonexistent verse number returns null", r4 === null);

  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail > 0 ? 1 : 0);
}

main();
