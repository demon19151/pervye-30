import type { HTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/utils";

type CardProps = HTMLAttributes<HTMLDivElement> & {
  /** Визуальное состояние карточки: завершено / требует внимания. */
  tone?: "default" | "completed" | "warning" | "accent";
  interactive?: boolean;
};

const tones: Record<NonNullable<CardProps["tone"]>, string> = {
  default: "bg-surface ring-line",
  completed: "bg-success-soft/60 ring-success/25",
  warning: "bg-warning-soft/70 ring-warning/30",
  accent: "bg-accent-soft/60 ring-accent/20",
};

export function Card({ className, tone = "default", interactive, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-card ring-1 ring-inset shadow-soft transition-all duration-200",
        tones[tone],
        interactive && "hover:shadow-raised hover:-translate-y-0.5",
        className,
      )}
      {...props}
    />
  );
}

export function CardHeader({
  title,
  description,
  icon,
  action,
  className,
}: {
  title: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-start justify-between gap-4", className)}>
      <div className="flex min-w-0 items-start gap-3">
        {icon && (
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent-strong">
            {icon}
          </span>
        )}
        <div className="min-w-0">
          <h2 className="text-base font-semibold sm:text-lg">{title}</h2>
          {description && <p className="mt-1 text-sm text-muted">{description}</p>}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function CardBody({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-5 sm:p-6", className)} {...props} />;
}
