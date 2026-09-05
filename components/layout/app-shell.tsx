"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Menu, X } from "lucide-react";

import { BottomNavigation } from "@/components/layout/bottom-navigation";
import { Brand } from "@/components/layout/brand";
import { Sidebar } from "@/components/layout/sidebar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageSkeleton } from "@/components/ui/states";
import { navForRole } from "@/lib/navigation";
import { switchRole } from "@/lib/services/groupService";
import { useAppStore } from "@/lib/store/app-store";
import type { UserRole } from "@/lib/types";

/**
 * Общий каркас приватных страниц: sidebar на десктопе,
 * верхняя панель с раскрывающимся меню и нижняя навигация на мобильном.
 */
export function AppShell({
  role,
  children,
}: {
  /** Если роль не указана, раздел доступен и участнику, и куратору. */
  role?: UserRole;
  children: ReactNode;
}) {
  const { state, ready, currentUser, update } = useAppStore();
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    if (ready && !state?.session) router.replace("/join");
  }, [ready, state?.session, router]);

  if (!ready || !state) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">
        <PageSkeleton />
      </div>
    );
  }

  if (!currentUser) return null;

  if (role && currentUser.role !== role) {
    return (
      <div className="mx-auto flex min-h-dvh max-w-md items-center px-4 py-10">
        <Card className="w-full p-6 text-center">
          <h1 className="text-lg font-semibold">Этот раздел доступен другой роли</h1>
          <p className="mt-2 text-sm text-muted">
            Сейчас вы в системе как {currentUser.role === "curator" ? "куратор" : "участник"}.
            Переключитесь, чтобы продолжить.
          </p>
          <Button
            className="mt-5"
            fullWidth
            onClick={() => update((current) => switchRole(current, role))}
          >
            Продолжить как {role === "curator" ? "куратор" : "участник"}
          </Button>
        </Card>
      </div>
    );
  }

  const items = navForRole(currentUser.role);
  const subtitle = currentUser.role === "curator" ? "Панель куратора" : state.group.name;

  return (
    <div className="min-h-dvh">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-line lg:block">
        <Sidebar items={items} user={currentUser} subtitle={subtitle} />
      </aside>

      <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-line bg-surface/90 px-4 backdrop-blur-md lg:hidden">
        <Brand href="/" subtitle={subtitle} />
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          aria-label="Открыть меню"
          className="flex size-10 items-center justify-center rounded-xl text-muted transition-colors hover:bg-surface-muted hover:text-foreground"
        >
          <Menu className="size-5" />
        </button>
      </header>

      {drawerOpen && (
        <div
          className="fixed inset-0 z-50 bg-foreground/25 backdrop-blur-[3px] animate-fade lg:hidden"
          onClick={() => setDrawerOpen(false)}
        >
          <div
            className="ml-auto h-full w-[19rem] max-w-[85vw] shadow-raised animate-fade"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="relative h-full">
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                aria-label="Закрыть меню"
                className="absolute top-5 right-4 z-10 flex size-9 items-center justify-center rounded-xl text-subtle hover:bg-surface-muted"
              >
                <X className="size-5" />
              </button>
              <Sidebar
                items={items}
                user={currentUser}
                subtitle={subtitle}
                onNavigate={() => setDrawerOpen(false)}
                className="h-full"
              />
            </div>
          </div>
        </div>
      )}

      <main className="lg:pl-64">
        <div className="mx-auto w-full max-w-6xl px-4 pt-6 pb-28 sm:px-6 lg:px-10 lg:py-10">
          {children}
        </div>
      </main>

      <BottomNavigation items={items} />
    </div>
  );
}
