import type { AyahGroup } from "@/lib/types";

export const AYAH_IMAGE_WIDTH = 1080;
export const AYAH_IMAGE_HEIGHT = 1920;
const MAX_TAMIL_SIZE = Math.max(22, Math.round(94 * 0.46));

const FOOTNOTE_MARKER = /¤\d+¤/g;

/** Remove dataset note references from text rendered into share images. */
export function stripFootnoteMarkers(text: string) {
  return text.replace(FOOTNOTE_MARKER, "");
}

interface ImageTheme {
  background: string;
  card: string;
  text: string;
  muted: string;
  accent: string;
  accent2: string;
  border: string;
}

export interface AyahImageInput {
  surahName: string;
  surah: number;
  group: AyahGroup;
}

interface Layout {
  arabicLines: string[];
  tamilLines: string[];
  arabicSize: number;
  tamilSize: number;
  arabicLineHeight: number;
  tamilLineHeight: number;
  contentHeight: number;
}

function cssToken(styles: CSSStyleDeclaration, name: string, fallback: string) {
  return styles.getPropertyValue(name).trim() || fallback;
}

function getActiveTheme(): ImageTheme {
  const styles = getComputedStyle(document.documentElement);
  return {
    background: cssToken(styles, "--bg", "#000000"),
    card: cssToken(styles, "--bg-card", "#0a0a0a"),
    text: cssToken(styles, "--text", "#ffffff"),
    muted: cssToken(styles, "--text-muted", "#aaaaaa"),
    accent: cssToken(styles, "--accent", "#d9bb78"),
    accent2: cssToken(styles, "--accent-2", "#c7a75c"),
    border: cssToken(styles, "--border", "rgba(255,255,255,0.1)"),
  };
}

function getFontFamily(name: string, fallback: string) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
}

function setFont(ctx: CanvasRenderingContext2D, size: number, family: string) {
  ctx.font = `${size}px ${family}`;
}

function isGraphemeContinuation(character: string) {
  const codePoint = character.codePointAt(0) ?? 0;
  return (
    character === "\u200d" ||
    (codePoint >= 0x0300 && codePoint <= 0x036f) ||
    (codePoint >= 0x1ab0 && codePoint <= 0x1aff) ||
    (codePoint >= 0x1dc0 && codePoint <= 0x1dff) ||
    (codePoint >= 0x20d0 && codePoint <= 0x20ff) ||
    (codePoint >= 0x0bbe && codePoint <= 0x0bcd) ||
    (codePoint >= 0xfe00 && codePoint <= 0xfe0f) ||
    (codePoint >= 0x1f3fb && codePoint <= 0x1f3ff)
  );
}

function segmentGraphemes(text: string) {
  if (typeof Intl.Segmenter === "function") {
    const segmenter = new Intl.Segmenter("ta", { granularity: "grapheme" });
    return Array.from(segmenter.segment(text), ({ segment }) => segment);
  }

  const graphemes: string[] = [];
  for (const character of text) {
    const previous = graphemes[graphemes.length - 1];
    if (previous?.endsWith("\u200d") || isGraphemeContinuation(character)) {
      graphemes[graphemes.length - 1] += character;
    } else {
      graphemes.push(character);
    }
  }
  return graphemes;
}

function wrapWord(
  ctx: CanvasRenderingContext2D,
  word: string,
  maxWidth: number,
) {
  const lines: string[] = [];
  let line = "";
  for (const grapheme of segmentGraphemes(word)) {
    const candidate = line + grapheme;
    if (!line || ctx.measureText(candidate).width <= maxWidth) {
      line = candidate;
    } else {
      lines.push(line);
      line = grapheme;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
) {
  const lines: string[] = [];
  for (const paragraph of text.split(/\r?\n/)) {
    const words = paragraph.trim().split(/\s+/).filter(Boolean);
    if (words.length === 0) {
      lines.push("");
      continue;
    }

    let line = "";
    for (const word of words) {
      const candidate = line ? `${line} ${word}` : word;
      if (ctx.measureText(candidate).width <= maxWidth) {
        line = candidate;
        continue;
      }

      if (line) lines.push(line);
      const wordLines = wrapWord(ctx, word, maxWidth);
      line = wordLines.pop() ?? "";
      for (const wordLine of wordLines) {
        lines.push(wordLine);
      }
    }
    if (line) lines.push(line);
  }
  return lines;
}

function createLayout(
  ctx: CanvasRenderingContext2D,
  input: AyahImageInput,
  arabicFamily: string,
  tamilFamily: string,
): Layout {
  const maxWidth = AYAH_IMAGE_WIDTH - 176;
  const maxContentHeight = 1030;
  const arabicText = stripFootnoteMarkers(input.group.arabic);
  const tamilText = stripFootnoteMarkers(input.group.tamil);

  for (let arabicSize = 94; arabicSize >= 22; arabicSize -= 2) {
    const tamilSize = Math.max(22, Math.round(arabicSize * 0.46));
    setFont(ctx, arabicSize, arabicFamily);
    const arabicLines = wrapText(ctx, arabicText, maxWidth);
    setFont(ctx, tamilSize, tamilFamily);
    const tamilLines = wrapText(ctx, tamilText, maxWidth);
    const arabicLineHeight = Math.round(arabicSize * 1.7);
    const tamilLineHeight = Math.round(tamilSize * 2.05);
    const contentHeight =
      arabicLines.length * arabicLineHeight +
      tamilLines.length * tamilLineHeight +
      170;

    if (contentHeight <= maxContentHeight) {
      return {
        arabicLines,
        tamilLines,
        arabicSize,
        tamilSize,
        arabicLineHeight,
        tamilLineHeight,
        contentHeight,
      };
    }
  }

  throw new Error("This ayah is too long to fit in a single share image.");
}

function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, radius);
}

export async function generateAyahImage(input: AyahImageInput) {
  if (document.fonts?.ready) {
    try {
      await document.fonts.ready;
    } catch {
      // A failed font request must not prevent the browser fallback from
      // rendering the image.
    }
  }

  const canvas = document.createElement("canvas");
  canvas.width = AYAH_IMAGE_WIDTH;
  canvas.height = AYAH_IMAGE_HEIGHT;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas is unavailable in this browser.");

  const theme = getActiveTheme();
  const arabicFamily = getFontFamily("--font-arabic", "serif");
  const tamilFamily = getFontFamily("--font-tamil", "serif");
  const uiFamily = getFontFamily("--font-ui", "sans-serif");
  const tamilText = stripFootnoteMarkers(input.group.tamil);
  if (document.fonts?.load) {
    try {
      await document.fonts.load(`${MAX_TAMIL_SIZE}px ${tamilFamily}`, tamilText);
    } catch {
      // Android browsers can reject a font request as a network error even
      // though canvas and the system fallback fonts remain usable.
    }
  }
  const layout = createLayout(ctx, input, arabicFamily, tamilFamily);
  const verseLabel = input.group.verses.length > 1
    ? `${input.group.verses[0]}–${input.group.verses[input.group.verses.length - 1]}`
    : `${input.group.verses[0]}`;

  ctx.fillStyle = theme.background;
  ctx.fillRect(0, 0, AYAH_IMAGE_WIDTH, AYAH_IMAGE_HEIGHT);

  ctx.fillStyle = theme.card;
  roundedRect(ctx, 64, 64, AYAH_IMAGE_WIDTH - 128, AYAH_IMAGE_HEIGHT - 128, 34);
  ctx.fill();
  ctx.strokeStyle = theme.border;
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.strokeStyle = theme.accent2;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(190, 196);
  ctx.lineTo(890, 196);
  ctx.stroke();
  ctx.fillStyle = theme.accent;
  ctx.beginPath();
  ctx.arc(540, 196, 7, 0, Math.PI * 2);
  ctx.fill();

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.direction = "ltr";
  ctx.fillStyle = theme.muted;
  ctx.font = `500 25px ${uiFamily}`;
  ctx.fillText("திருக்குர்ஆன் · QURAN", 540, 142);

  let y = 390;
  ctx.fillStyle = theme.text;
  ctx.direction = "rtl";
  ctx.font = `${layout.arabicSize}px ${arabicFamily}`;
  for (const line of layout.arabicLines) {
    ctx.fillText(line, 540, y);
    y += layout.arabicLineHeight;
  }

  y += 92;
  ctx.direction = "ltr";
  ctx.fillStyle = theme.accent2;
  ctx.fillRect(456, y - 30, 168, 2);
  y += 72;
  ctx.fillStyle = theme.text;
  ctx.font = `${layout.tamilSize}px ${tamilFamily}`;
  ctx.textAlign = "left";
  for (const line of layout.tamilLines) {
    // Use an explicit left edge instead of relying on Safari's canvas
    // text-anchor handling for Tamil after the preceding RTL text.
    const lineWidth = ctx.measureText(line).width;
    ctx.fillText(line, (AYAH_IMAGE_WIDTH - lineWidth) / 2, y);
    y += layout.tamilLineHeight;
  }

  const footerY = 1688;
  ctx.fillStyle = theme.accent2;
  ctx.fillRect(350, footerY - 52, 380, 2);
  ctx.fillStyle = theme.text;
  ctx.font = `600 29px ${uiFamily}`;
  ctx.textAlign = "center";
  ctx.fillText(`${input.surahName} · ${input.surah}:${verseLabel}`, 540, footerY);

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/png"),
  );
  if (!blob) throw new Error("The image could not be generated.");
  return blob;
}
