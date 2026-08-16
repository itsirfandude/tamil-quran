"use client";

import Link from "next/link";
import type { MouseEventHandler, ReactNode } from "react";

export function OfflineReferenceLink({
  href,
  children,
  className,
  style,
  onClick,
}: {
  href: string;
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
  onClick?: MouseEventHandler<HTMLAnchorElement>;
}) {
  const handleClick: MouseEventHandler<HTMLAnchorElement> = (event) => {
    onClick?.(event);
    if (event.defaultPrevented || navigator.onLine) return;

    event.preventDefault();
    window.location.assign(href);
  };

  return (
    <Link href={href} className={className} style={style} onClick={handleClick}>
      {children}
    </Link>
  );
}
