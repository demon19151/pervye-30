import Link from "next/link";

import { cn } from "@/lib/utils";

export function Brand({
  href = "/",
  className,
  subtitle,
}: {
  href?: string;
  className?: string;
  subtitle?: string;
}) {
  return (
    <Link href={href} className={cn("group inline-flex items-center gap-2.5", className)}>
      <span className="flex size-9 items-center justify-center rounded-xl bg-accent text-[13px] font-bold text-white shadow-accent transition-transform duration-200 group-hover:scale-105">
        30
      </span>
      <span className="leading-tight">
        <span className="block text-[15px] font-semibold">Первые 30</span>
        {subtitle && <span className="block text-[11px] text-subtle">{subtitle}</span>}
      </span>
    </Link>
  );
}
