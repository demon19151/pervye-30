import { cn } from "@/lib/utils";

type Tone = "accent" | "success" | "warning";

const barTones: Record<Tone, string> = {
  accent: "bg-accent",
  success: "bg-success",
  warning: "bg-warning",
};

const ringTones: Record<Tone, string> = {
  accent: "var(--color-accent)",
  success: "var(--color-success)",
  warning: "var(--color-warning)",
};

export function ProgressBar({
  value,
  label,
  hint,
  tone = "accent",
  size = "md",
  className,
}: {
  /** Значение 0..100. */
  value: number;
  label?: string;
  hint?: string;
  tone?: Tone;
  size?: "sm" | "md";
  className?: string;
}) {
  const safe = Math.max(0, Math.min(100, Math.round(value)));

  return (
    <div className={cn("space-y-2", className)}>
      {(label || hint) && (
        <div className="flex items-baseline justify-between gap-3 text-sm">
          {label && <span className="font-medium">{label}</span>}
          {hint && <span className="text-muted">{hint}</span>}
        </div>
      )}
      <div
        role="progressbar"
        aria-valuenow={safe}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label ?? "Прогресс"}
        className={cn("w-full overflow-hidden rounded-full bg-line", size === "sm" ? "h-1.5" : "h-2.5")}
      >
        <div
          className={cn("h-full rounded-full transition-[width] duration-500 ease-out", barTones[tone])}
          style={{ width: `${safe}%` }}
        />
      </div>
    </div>
  );
}

export function ProgressRing({
  value,
  caption,
  tone = "accent",
  size = 132,
}: {
  value: number;
  caption?: string;
  tone?: Tone;
  size?: number;
}) {
  const safe = Math.max(0, Math.min(100, Math.round(value)));

  return (
    <div
      className="relative grid shrink-0 place-items-center"
      style={{
        width: size,
        height: size,
        background: `conic-gradient(${ringTones[tone]} ${safe * 3.6}deg, var(--color-line) 0deg)`,
        borderRadius: "9999px",
      }}
      role="progressbar"
      aria-valuenow={safe}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className="grid place-items-center rounded-full bg-surface text-center"
        style={{ width: size - 22, height: size - 22 }}
      >
        <div>
          <p className="text-2xl font-semibold tabular-nums">{safe}%</p>
          {caption && <p className="mt-0.5 text-xs text-muted">{caption}</p>}
        </div>
      </div>
    </div>
  );
}
