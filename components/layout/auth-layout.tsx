import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";

import { Brand } from "@/components/layout/brand";

/** Каркас для страниц входа и создания группы: спокойный центрированный экран. */
export function AuthLayout({
  children,
  backHref = "/",
  backLabel = "На главную",
}: {
  children: ReactNode;
  backHref?: string;
  backLabel?: string;
}) {
  return (
    <div className="hero-glow min-h-dvh">
      <header className="mx-auto flex h-16 max-w-3xl items-center justify-between px-4 sm:px-6">
        <Brand />
        <Link
          href={backHref}
          className="inline-flex items-center gap-1.5 text-[13px] font-medium text-muted transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          {backLabel}
        </Link>
      </header>

      <main className="mx-auto w-full max-w-lg px-4 pt-6 pb-16 sm:px-6 sm:pt-12">{children}</main>
    </div>
  );
}
