// app/about/page.tsx

import KnowledgeCard from "@/components/KnowledgeCard";
import { aboutSections } from "@/lib/about";

export default function AboutPage() {
  return (
    <main className="mx-auto max-w-5xl px-5 py-10">
      <header className="mb-8 text-center">
        <h1 className="font-display text-3xl sm:text-4xl">
          அறிமுகம்
        </h1>

        <p
          className="mx-auto mt-4 max-w-2xl text-base leading-8"
          style={{ color: "var(--text-muted)" }}
        >
          திருக்குர்ஆனை வாசிப்பதற்கும் புரிந்துகொள்வதற்கும் உதவும்
          முன்னுரைகளும், விளக்கங்களும், கலைச் சொற்களும்.
        </p>
      </header>

      <section>
        <h2
          className="mb-5 font-display text-2xl"
          style={{ color: "var(--text)" }}
        >
          முன்னுரை
        </h2>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {aboutSections.map((section) => (
            <KnowledgeCard
              key={section.slug}
              number={String(section.order).padStart(2, "0")}
              title={section.title}
              description={section.description}
              href={`/about/${section.slug}`}
            />
          ))}
        </div>
      </section>

      <section className="mt-12">
        <h2
          className="mb-5 font-display text-2xl"
          style={{ color: "var(--text)" }}
        >
          கலைச் சொற்களும் விளக்கங்களும்
        </h2>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
         <KnowledgeCard
  title="அரபு கலைச் சொற்கள்"
  description="இந்தத் தமிழாக்கத்தில் இடம்பெறும் அரபுச் சொற்களுக்கான விளக்கங்கள்."
  href="/about/arabic-terms"
/>

<KnowledgeCard
  title="தமிழ் கலைச் சொற்கள்"
  description="இஸ்லாமிய நம்பிக்கை சார்ந்த முக்கியமான தமிழ்ச் சொற்களின் விளக்கங்கள்."
  href="/about/tamil-terms"
/>

        </div>
      </section>

      <section
        className="mt-12 border-t pt-8"
        style={{ borderColor: "var(--border)" }}
      >
        <KnowledgeCard
          title="முழு அறிமுகம்"
          description="அனைத்து முன்னுரைகளையும் ஒரே தொடர்ச்சியான வாசிப்பாகப் படிக்கலாம்."
          href="/about/full"
        />
      </section>
    </main>
  );
}