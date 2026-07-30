export function VerseBadge({ verses }: { verses: number[] }) {
  const label = verses.length > 1 ? `${verses[0]}\u2013${verses[verses.length - 1]}` : `${verses[0]}`;
  return <span className="verse-medallion" aria-hidden="true">{label}</span>;
}
