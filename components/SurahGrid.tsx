import { IndexCard } from "@/components/IndexCard";
import type { SurahMeta } from "@/lib/types";

export function SurahGrid({ surahs }: { surahs: SurahMeta[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {surahs.map((s) => (
        <IndexCard
          key={s.number}
          href={`/surah/${s.number}`}
          number={s.number}
          title={s.name_tamil || `அத்தியாயம் ${s.number}`}
          secondaryText={`${s.total_verses} வசனங்கள்`}
        />
      ))}
    </div>
  );
}
