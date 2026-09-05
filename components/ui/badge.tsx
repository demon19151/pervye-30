import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type Tone = "neutral" | "accent" | "success" | "caution" | "warning" | "danger";

const tones: Record<Tone, string> = {
  neutral: "bg-surface-muted text-muted ring-line",
  accent: "bg-accent-soft text-accent-strong ring-accent/20",
  success: "bg-success-soft text-success-strong ring-success/25",
  caution: "bg-caution-soft text-caution ring-caution/30",
  warning: "bg-warning-soft text-warning ring-warning/30",
  danger: "bg-danger-soft text-danger ring-danger/25",
};

export function Badge({
  children,
  tone = "neutral",
  className,
}: {
  children: ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset whitespace-nowrap",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function StatusDot({ tone }: { tone: Tone }) {
  const colors: Record<Tone, string> = {
    neutral: "bg-subtle",
    accent: "bg-accent",
    success: "bg-success",
    caution: "bg-caution",
    warning: "bg-warning",
    danger: "bg-danger",
  };

  return <span className={cn("size-2 rounded-full", colors[tone])} aria-hidden />;
}
