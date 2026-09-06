"use client";

import { forwardRef, type ButtonHTMLAttributes } from "react";
import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "success" | "outline" | "warning" | "danger";
type Size = "sm" | "md" | "lg";

const variants: Record<Variant, string> = {
  primary:
    "bg-accent text-white shadow-accent hover:bg-accent-strong active:bg-accent-strong disabled:bg-accent/40 disabled:shadow-none",
  secondary:
    "bg-accent-soft text-accent-strong hover:bg-accent-ring/60 disabled:bg-accent-soft/60 disabled:text-accent/50",
  success:
    "bg-success-soft text-success-strong ring-1 ring-inset ring-success/25 hover:bg-success/15",
  outline:
    "bg-surface text-foreground ring-1 ring-inset ring-line hover:bg-surface-muted hover:ring-accent-ring disabled:text-subtle",
  ghost: "bg-transparent text-muted hover:bg-accent-soft/70 hover:text-accent-strong",
  warning: "bg-warning text-white hover:brightness-95",
  danger: "bg-danger text-white hover:brightness-95",
};

const sizes: Record<Size, string> = {
  sm: "h-9 gap-1.5 rounded-xl px-3.5 text-[13px]",
  md: "h-11 gap-2 rounded-2xl px-5 text-sm",
  lg: "h-13 gap-2 rounded-2xl px-6 text-[15px]",
};

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  fullWidth?: boolean;
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = "primary", size = "md", loading, fullWidth, children, disabled, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        "inline-flex cursor-pointer select-none items-center justify-center font-medium transition-all duration-200",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
        "disabled:cursor-not-allowed disabled:opacity-70",
        variants[variant],
        sizes[size],
        fullWidth && "w-full",
        className,
      )}
      {...props}
    >
      {loading && <Loader2 className="size-4 animate-spin" aria-hidden />}
      {children}
    </button>
  );
});
