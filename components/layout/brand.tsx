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
      <span className="flex size-9 items-center justify-center rounded-xl bg-accent shadow-accent transition-transform duration-200 group-hover:scale-105">
        <img src="/logo-mark-y-30-white.svg" alt="Первые 30" className="size-6" loading="eager" />
      </span>
      <span className="leading-tight">
        <span className="block text-[15px] font-semibold">Первые 30</span>
        {subtitle && <span className="block text-[11px] text-subtle">{subtitle}</span>}
      </span>
    </Link>
  );
}
