import type { Metadata } from "next";
import { HadithCollectionIndex } from "@/components/HadithCollectionIndex";

export const metadata: Metadata = {
  title: "ஹதீஸ்",
  description: "தமிழில் ஹதீஸ் தொகுப்புகள் வாசிக்க.",
};

export default async function HadithPage() {
  return (
    <main id="main" className="flex-1 py-10 sm:py-14">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <header className="mb-10 text-center">
          <p className="text-xs uppercase tracking-wider" style={{ color: "var(--accent-2)" }}>இஸ்லாமிய நூலகம்</p>
          <h1 className="mt-3 font-display text-3xl italic sm:text-4xl" style={{ color: "var(--text)" }}>ஹதீஸ்</h1>
        </header>

        <HadithCollectionIndex slug="arbaeen-nawawi" />
      </div>
    </main>
  );
}
