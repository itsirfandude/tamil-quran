import type { Metadata } from "next";
import { HadithCollectionIndex } from "@/components/HadithCollectionIndex";

export const metadata: Metadata = {
  title: "அல்அர்பஈன் நவவீ",
  description: "அல்அர்பஈன் நவவீ 50 ஹதீஸ்கள் தமிழில்.",
};

export default function ArbaeenNawawiPage() {
  return (
    <main id="main" className="flex-1 py-10 sm:py-14">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <HadithCollectionIndex slug="arbaeen-nawawi" />
      </div>
    </main>
  );
}
