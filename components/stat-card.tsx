import type { ReactNode } from "react";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type Tone = "neutral" | "accent" | "success" | "warning";

const iconTones: Record<Tone, string> = {
  neutral: "bg-surface-muted text-muted",
  accent: "bg-accent-soft text-accent-strong",
  success: "bg-success-soft text-success-strong",
  warning: "bg-warning-soft text-warning",
};

export function StatCard({
  label,
  value,
  hint,
  icon,
  tone = "neutral",
  className,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  icon?: ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <Card className={cn("p-4 sm:p-5", className)}>
      <div className="flex items-start gap-3">
        {icon && (
          <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-xl", iconTones[tone])}>
            {icon}
          </span>
        )}
        <div className="min-w-0">
          <p className="text-2xl font-semibold tabular-nums sm:text-[26px]">{value}</p>
          <p className="mt-0.5 text-[13px] leading-snug font-medium text-muted">{label}</p>
          {hint && <p className="mt-1 text-xs text-subtle">{hint}</p>}
        </div>
      </div>
    </Card>
  );
}
