# திருக்குர்ஆன் — Tamil Quran Reader

A fast, accessible Quran reading site: Tamil translation (verified against the
supplied source document, verse-numbering preserved exactly, including
clubbed verses) alongside Uthmani Arabic text.

## Getting started

```bash
npm install
npm run dev
```

Open http://localhost:3000. Fonts (Amiri Quran, Noto Serif Tamil, Fraunces,
Inter) load from Google Fonts at build time via `next/font/google` — this
requires normal internet access, which your machine/host has (this was built
in a sandboxed environment without access to fonts.googleapis.com, so the
font fetch itself was verified separately; everything else was built and
smoke-tested end to end).

```bash
npm run build   # production build, statically generates all 114 Surah pages
npm run start   # serve the production build locally
```

## Deploying

Works out of the box on **Vercel** (recommended — `vercel deploy`) or any
Node host that runs `next build && next start`. For static hosting
(Cloudflare Pages, etc.), all Surah pages are already statically generated
via `generateStaticParams`; only the homepage's "daily ayah" revalidates
(every 24h) and reader preferences (theme, bookmarks, progress) live in
`localStorage`, so no database or API server is required for what's built
so far.

Docker: not included yet — a plain `next build` image (node:20-alpine +
`next start`) will work if you want one; ask and it can be added.

## Data

- `public/data/index.json` — lightweight list of all 114 Surahs (number, Tamil
  name, verse count) for the homepage grid.
- `public/data/surah/{n}.json` — one file per Surah: `ayah_groups`, each with
  `verses` (e.g. `[6,7]` for a clubbed pair), `tamil`, and `arabic`.
- `public/data/search-index.json` — flattened Tamil text for the search
  overlay, lazy-loaded only when search is opened.

Arabic text is Uthmani script from an open-source dataset, merged onto your
Tamil verse numbering (with the Al-Fatihah offset handled — your verse 1 is
Arabic ayah 2, since the source doesn't number the Bismillah separately
there).

`public/data/notes/{n}.json` — the translator's 521 numbered explanatory
notes (the "விளக்கங்கள்" appendix), one file per note, lazy-loaded when a
reader taps a footnote number in the verse text. `public/data/intro.json`
holds the front-matter essays and glossary (the printed book's page-number
subject index was left out — it only makes sense next to physical page
numbers).

If the Tamil source document changes, re-run the parsing pipeline (ask your
assistant to regenerate `quran_dataset.json` and `notes_dataset.json` from
the updated `.docx`, then re-run the data-split step) rather than
hand-editing the JSON.

## What's built (Phase 1 + 2 + 3)

- Data model with Surah/Ayah-group structure, future-ready fields
  (English translation and transliteration can be added per ayah group
  without a schema change)
- Homepage: hero, Continue Reading, Verse of the Day, full Surah grid
- Reader: Arabic + Tamil, clubbed-verse display, copy / share / bookmark per
  verse group, prev/next Surah navigation
- **Tafsir/explanatory notes**: every footnote number embedded in the
  Tamil text (e.g. the "26" in Surah 1:6-7) is a clickable superscript that
  opens the translator's full note in an overlay, with a permalink at
  `/notes/{n}` — all 521 notes, statically generated
- **Introduction**: `/about` — the translator's preface, "how to read this
  translation," evidence-for-revelation essays, and the glossary of terms,
  pulled from the source document's front matter
- OLED Black (true `#000000`) as the default theme, plus 5 more (Sepia,
  Night Blue, Emerald, Classic Paper, High Contrast), adjustable Tamil/
  Arabic font size, line spacing, reading width — all persisted locally
- Bookmarks page
- Full-text search across the Tamil translation (client-side, lazy-loaded)
- Reading-progress tracking (scroll-based, resumes on the homepage)
- Sitemap; per-page metadata; semantic HTML, skip-to-content link, visible
  focus states, `prefers-reduced-motion` respected

## Deferred (designed for, not yet implemented)

The data model and layout leave room for these without rework — say the
word and any of them can be built next:

- **Audio**: no reciter/playback UI yet
- **English translation / transliteration**: fields aren't populated
- **PWA** (installable, offline): no manifest/service worker yet
- **Admin import tool**: the parsing pipeline that built this dataset is a
  one-off script, not a UI-driven importer
- **Juz-based navigation**: Juz/Hizb/Ruku/Sajdah/page metadata isn't in the
  dataset yet — verse-group structure supports adding it later
