import { SiteHeader } from "@/components/SiteHeader";
import { SearchPage } from "@/components/SearchPage";

export const metadata = { title: "தேடல் · Search — திருக்குர்ஆன்" };

// No longer needs a server-side Surah-name lookup - the API route now
// resolves Surah/verse/introduction/note display names into each result
// itself, so this page just renders the client search UI directly.
export default function SearchRoute() {
  return (
    <>
      <SiteHeader />
      <main id="main" className="flex-1 py-10">
        <SearchPage />
      </main>
    </>
  );
}
