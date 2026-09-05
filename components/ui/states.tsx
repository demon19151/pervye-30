import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-2xl bg-line/70", className)} />;
}

/** Скелет страницы на время чтения состояния из localStorage. */
export function PageSkeleton() {
  return (
    <div className="space-y-5" aria-busy="true" aria-label="Загрузка">
      <Skeleton className="h-8 w-56" />
      <Skeleton className="h-28 w-full rounded-card" />
      <div className="grid gap-5 lg:grid-cols-3">
        <Skeleton className="h-64 rounded-card lg:col-span-2" />
        <Skeleton className="h-64 rounded-card" />
      </div>
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-line bg-surface-muted px-6 py-10 text-center",
        className,
      )}
    >
      {icon && (
        <span className="flex size-11 items-center justify-center rounded-2xl bg-accent-soft text-accent">
          {icon}
        </span>
      )}
      <div className="space-y-1">
        <p className="text-sm font-semibold">{title}</p>
        {description && <p className="mx-auto max-w-sm text-[13px] text-muted">{description}</p>}
      </div>
      {action}
    </div>
  );
}
