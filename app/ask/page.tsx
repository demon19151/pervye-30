"use client";

import { useState, type ReactNode } from "react";
import { Bot, MessageCircleQuestion, UserRound } from "lucide-react";

import { BotChat } from "@/components/bot-chat/bot-chat";
import { CuratorChatPanel } from "@/components/curator-chat-panel";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/page-header";
import { Avatar } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/states";
import { getCurator } from "@/lib/services/groupService";
import { useAppStore } from "@/lib/store/app-store";
import { cn } from "@/lib/utils";

type Pane = "curator" | "bot";

export default function AskPage() {
  return (
    <AppShell role="participant">
      <AskQuestion />
    </AppShell>
  );
}

function AskQuestion() {
  const { state } = useAppStore();
  const [pane, setPane] = useState<Pane>("curator");

  if (!state) return null;

  const curator = getCurator(state);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Задать вопрос"
        subtitle="Два окна рядом: напишите куратору лично или спросите ИИ-помощника про учёбу."
      />

      <div className="grid grid-cols-2 gap-1 rounded-2xl bg-surface-muted p-1 ring-1 ring-inset ring-line lg:hidden">
        <PaneButton
          active={pane === "curator"}
          icon={<UserRound className="size-4" />}
          label="Куратор"
          onClick={() => setPane("curator")}
        />
        <PaneButton
          active={pane === "bot"}
          icon={<Bot className="size-4" />}
          label="ИИ помощник"
          onClick={() => setPane("bot")}
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card
          className={cn(
            "flex h-[32rem] flex-col overflow-hidden lg:h-[36rem]",
            pane !== "curator" && "hidden lg:flex",
          )}
        >
          <div className="flex items-center gap-3 border-b border-line px-4 py-3">
            {curator ? (
              <Avatar name={curator.name} emoji={curator.avatar} size="sm" />
            ) : (
              <span className="flex size-8 items-center justify-center rounded-full bg-accent-soft text-accent-strong">
                <UserRound className="size-4" />
              </span>
            )}
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{curator?.name ?? "Куратор"}</p>
              <p className="truncate text-[12px] text-muted">Личные сообщения, группа не увидит</p>
            </div>
          </div>

          {curator ? (
            <CuratorChatPanel
              counterpart={curator}
              emptyTitle="Напишите куратору"
              emptyDescription="Спросите про задания, встречу группы или то, что неудобно писать всем."
            />
          ) : (
            <div className="flex flex-1 items-center p-4">
              <EmptyState
                icon={<MessageCircleQuestion className="size-5" />}
                title="Куратор ещё не назначен"
                description="Как только куратор появится в группе, здесь можно будет написать ему напрямую."
              />
            </div>
          )}
        </Card>

        <Card
          className={cn(
            "flex h-[32rem] flex-col overflow-hidden lg:h-[36rem]",
            pane !== "bot" && "hidden lg:flex",
          )}
        >
          <div className="flex items-center gap-3 border-b border-line px-4 py-3">
            <span className="flex size-8 items-center justify-center rounded-full bg-accent-soft text-accent-strong">
              <Bot className="size-4" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">ИИ Помощник</p>
              <p className="truncate text-[12px] text-muted">Отвечает по базе знаний университета</p>
            </div>
          </div>

          <BotChat className="min-h-0 flex-1" />
        </Card>
      </div>
    </div>
  );
}

function PaneButton({
  active,
  icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-[13px] font-medium transition-colors",
        active ? "bg-surface text-foreground shadow-soft" : "text-muted hover:text-foreground",
      )}
    >
      {icon}
      {label}
    </button>
  );
}
