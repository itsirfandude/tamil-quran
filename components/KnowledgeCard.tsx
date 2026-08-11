import Link from "next/link";

interface KnowledgeCardProps {
  number?: string;
  title: string;
  description?: string;
  href: string;
}

export default function KnowledgeCard({
  number,
  title,
  description,
  href,
}: KnowledgeCardProps) {
  return (
    <Link
      href={href}
      className="group flex min-h-[150px] items-center rounded-2xl border px-5 py-5 transition-all duration-200 hover:-translate-y-0.5 sm:px-6"
      style={{
        borderColor: "var(--border)",
        background: "var(--surface)",
      }}
    >
      <div className="flex min-w-0 flex-1 items-center gap-4 sm:gap-5">
        {number && (
          <span
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border text-xs font-medium"
            style={{
              borderColor: "var(--accent-2)",
              color: "var(--accent-2)",
            }}
          >
            {number}
          </span>
        )}

        <div className="min-w-0">
          <h2
            className="font-display text-xl leading-tight sm:text-2xl"
            style={{ color: "var(--text)" }}
          >
            {title}
          </h2>

          {description && (
            <p
              className="mt-2 max-w-prose text-sm leading-6"
              style={{ color: "var(--text-muted)" }}
            >
              {description}
            </p>
          )}
        </div>
      </div>

      <span
        className="ml-4 shrink-0 text-lg transition-transform group-hover:translate-x-1"
        style={{ color: "var(--accent-2)" }}
        aria-hidden="true"
      >
        →
      </span>
    </Link>
  );
}