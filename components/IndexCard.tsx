import Link from "next/link";

export function IndexCard({
  href,
  number,
  title,
  secondaryText,
}: {
  href: string;
  number: number;
  title: string;
  secondaryText?: string;
}) {
  return (
    <Link
      href={href}
      className="ink-card flex h-full items-center gap-4 rounded-xl px-4 py-3.5"
    >
      <span
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border font-ui text-sm"
        style={{ borderColor: "var(--accent-2)", color: "var(--accent-2)" }}
      >
        {number}
      </span>
      <span className="min-w-0 flex-1">
        <span
          className="block min-h-[2.6em] break-words font-tamil-text"
          style={{ fontSize: "17px", lineHeight: 1.3, color: "var(--text)" }}
        >
          {title}
        </span>
        {secondaryText && (
          <span className="block text-xs" style={{ color: "var(--text-muted)" }}>
            {secondaryText}
          </span>
        )}
      </span>
    </Link>
  );
}
