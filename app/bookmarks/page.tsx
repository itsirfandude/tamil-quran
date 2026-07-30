import { SiteHeader } from "@/components/SiteHeader";
import { BookmarksList } from "@/components/BookmarksList";
import { getSurahIndex } from "@/lib/data";

export const metadata = { title: "Bookmarks — திருக்குர்ஆன்" };

export default async function BookmarksPage() {
  const index = await getSurahIndex();
  const surahNames = Object.fromEntries(index.map((s) => [s.number, s.name_tamil]));

  return (
    <>
      <SiteHeader />
      <main id="main" className="flex-1 py-10">
        <div className="mx-auto max-w-2xl px-4 sm:px-6">
          <h1 className="font-display text-2xl italic mb-6" style={{ color: "var(--text)" }}>
            குறிக்கப்பட்டவை · Bookmarks
          </h1>
          <BookmarksList surahNames={surahNames} />
        </div>
      </main>
    </>
  );
}
