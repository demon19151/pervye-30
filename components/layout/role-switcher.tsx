"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronsUpDown, LogOut, RotateCcw } from "lucide-react";

import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { getParticipants, setCurrentUser, signOut, switchRole } from "@/lib/services/groupService";
import { homeForRole } from "@/lib/navigation";
import { useAppStore } from "@/lib/store/app-store";
import type { User } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * Переключение роли и участника — демонстрационный инструмент.
 * В реальном продукте роль определяется аккаунтом, поэтому блок изолирован здесь.
 */
export function RoleSwitcher({ user, onNavigate }: { user: User; onNavigate?: () => void }) {
  const { state, update, reset } = useAppStore();
  const { toast } = useToast();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  if (!state) return null;

  const participants = getParticipants(state);

  const go = (href: string) => {
    onNavigate?.();
    setOpen(false);
    router.push(href);
  };

  return (
    <div className="rounded-2xl bg-surface-muted p-2 ring-1 ring-inset ring-line">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition-colors hover:bg-surface"
      >
        <Avatar name={user.name} emoji={user.avatar} size="sm" />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold">{user.name}</span>
          <span className="block text-[11px] text-subtle">
            {user.role === "curator" ? "Куратор" : "Участник"}
          </span>
        </span>
        <ChevronsUpDown className="size-4 shrink-0 text-subtle" />
      </button>

      {open && (
        <div className="mt-2 space-y-3 border-t border-line px-2 pt-3 pb-1 animate-fade">
          <div className="space-y-1.5">
            <p className="text-[11px] font-semibold tracking-wide text-subtle uppercase">Роль</p>
            <div className="grid grid-cols-2 gap-1.5">
              {(["participant", "curator"] as const).map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => {
                    update((current) => switchRole(current, role));
                    go(homeForRole(role));
                  }}
                  className={cn(
                    "rounded-xl px-2 py-2 text-[13px] font-medium transition-colors",
                    user.role === role
                      ? "bg-accent text-white"
                      : "bg-surface text-muted ring-1 ring-inset ring-line hover:text-foreground",
                  )}
                >
                  {role === "participant" ? "Участник" : "Куратор"}
                </button>
              ))}
            </div>
          </div>

          {user.role === "participant" && participants.length > 1 && (
            <div className="space-y-1.5">
              <p className="text-[11px] font-semibold tracking-wide text-subtle uppercase">
                Смотреть как
              </p>
              <div className="flex flex-wrap gap-1.5">
                {participants.map((participant) => (
                  <button
                    key={participant.id}
                    type="button"
                    onClick={() => {
                      update((current) => setCurrentUser(current, participant.id));
                      go("/participant");
                    }}
                    className={cn(
                      "rounded-full px-2.5 py-1 text-xs font-medium transition-colors",
                      participant.id === user.id
                        ? "bg-accent-soft text-accent-strong"
                        : "bg-surface text-muted ring-1 ring-inset ring-line hover:text-foreground",
                    )}
                  >
                    {participant.avatar} {participant.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <Button
              variant="ghost"
              size="sm"
              className="justify-start"
              onClick={() => {
                reset();
                toast("Демо-данные сброшены");
                go("/");
              }}
            >
              <RotateCcw className="size-4" />
              Сбросить демо-данные
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="justify-start"
              onClick={() => {
                update(signOut);
                go("/");
              }}
            >
              <LogOut className="size-4" />
              Выйти
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
