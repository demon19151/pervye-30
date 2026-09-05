import { cn } from "@/lib/utils";

const sizes = {
  sm: "size-8 text-sm",
  md: "size-10 text-base",
  lg: "size-12 text-lg",
} as const;

export function Avatar({
  name,
  emoji,
  size = "md",
  className,
}: {
  name: string;
  emoji?: string;
  size?: keyof typeof sizes;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full bg-accent-soft font-semibold text-accent-strong ring-1 ring-inset ring-accent/15",
        sizes[size],
        className,
      )}
      aria-hidden
    >
      {emoji ?? name.slice(0, 1).toUpperCase()}
    </span>
  );
}
