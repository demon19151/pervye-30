"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Brand } from "@/components/layout/brand";
import { RoleSwitcher } from "@/components/layout/role-switcher";
import type { NavItem } from "@/lib/navigation";
import type { User } from "@/lib/types";
import { cn } from "@/lib/utils";

export function Sidebar({
  items,
  user,
  subtitle,
  onNavigate,
  className,
}: {
  items: NavItem[];
  user: User;
  subtitle?: string;
  onNavigate?: () => void;
  className?: string;
}) {
  const pathname = usePathname();

  return (
    <div className={cn("flex h-full flex-col gap-6 bg-surface p-5", className)}>
      <Brand href="/" subtitle={subtitle} />

      <nav className="flex-1 space-y-1" aria-label="Основная навигация">
        {items.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-sm font-medium transition-all duration-200",
                active
                  ? "bg-accent-soft text-accent-strong"
                  : "text-muted hover:bg-surface-muted hover:text-foreground",
              )}
            >
              <Icon className={cn("size-[18px] shrink-0", active ? "text-accent" : "text-subtle")} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <RoleSwitcher user={user} onNavigate={onNavigate} />
    </div>
  );
}
