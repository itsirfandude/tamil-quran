import { NotesIndex } from "@/components/NotesIndex";
import { getNoteIndex } from "@/lib/data";

export const metadata = {
  title: "விளக்கங்கள் · திருக்குர்ஆன்",
};

export default async function NotesPage() {
  const notes = await getNoteIndex();

  return (
    <main id="main" className="flex-1">
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
        <header className="mb-10">
          <p
            className="font-tamil-text mb-3 text-xs tracking-[0.28em]"
            style={{ color: "var(--accent-2)" }}
          >
            விளக்கங்கள்
          </p>

          <h1
            className="font-tamil-text text-3xl leading-[1.4] sm:text-4xl"
            style={{ color: "var(--text)" }}
          >
            திருக்குர்ஆன் விளக்கங்கள்
          </h1>

          <p
            className="font-tamil-text mt-5 max-w-2xl text-[16px] leading-[1.9]"
            style={{ color: "var(--text-muted)" }}
          >
            திருக்குர்ஆன் தொடர்பான விளக்கங்களையும் குறிப்புகளையும்
            தேடிப் படிக்கலாம்.
          </p>
        </header>

        <NotesIndex notes={notes} />
      </div>
    </main>
  );
}
