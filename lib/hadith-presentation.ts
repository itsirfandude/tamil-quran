/** Presentation-only helpers for the extracted Hadith records. */

const SOURCE_HADITH_NUMBER = /^\s*\d+\s*[.։:–-]\s*/u;

export function splitTamilHadithBlocks(blocks: string[]) {
  const firstHadithBlock = blocks.findIndex((block) => SOURCE_HADITH_NUMBER.test(block));
  const contentStart = firstHadithBlock === -1 ? 0 : firstHadithBlock;

  return {
    sourcePreamble: blocks.slice(0, contentStart),
    hadithBlocks: blocks.slice(contentStart),
  };
}

export function tamilHadithPreview(blocks: string[], maxLength = 150) {
  const { hadithBlocks } = splitTamilHadithBlocks(blocks);
  const firstBlock = hadithBlocks.find((block) => block.trim()) ?? "";
  const normalized = firstBlock.replace(SOURCE_HADITH_NUMBER, "").replace(/\s+/gu, " ").trim();

  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, maxLength).trimEnd()}…`;
}

export function displayHadithReference(reference: string) {
  const withoutWrappingParentheses = reference.trim().replace(/^\((.*)\)$/u, "$1");
  return withoutWrappingParentheses.includes(":")
    ? withoutWrappingParentheses
    : withoutWrappingParentheses.replace(/-(\d+)$/u, ": $1");
}
