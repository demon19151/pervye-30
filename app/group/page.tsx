"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CalendarDays, ListChecks, Target, TrendingUp, Users } from "lucide-react";

import { DirectInbox } from "@/components/direct-inbox";
import { DirectThread } from "@/components/direct-thread";
import { FeedTabs, type FeedTab } from "@/components/feed-tabs";
import { GroupFeed } from "@/components/group-feed";
import { InviteCodeCard } from "@/components/invite-code-card";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/page-header";
import { ProgressBar } from "@/components/progress-bar";
import { StatCard } from "@/components/stat-card";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader } from "@/components/ui/card";
import { PageSkeleton } from "@/components/ui/states";
import { getCurator } from "@/lib/services/groupService";
import { getAllParticipantStats, getGroupStats } from "@/lib/services/statsService";
import { useAppStore } from "@/lib/store/app-store";
import { pluralize } from "@/lib/utils";

export default function GroupPage() {
  return (
    <AppShell>
      <Suspense fallback={<PageSkeleton />}>
        <GroupOverview />
      </Suspense>
    </AppShell>
  );
}

function GroupOverview() {
  const { state, currentUser } = useAppStore();
  // Вкладка личных сообщений вынесена в отдельный маршрут `/direct`.
  // В этой странице всегда показываем только общий чат группы.
  const tab: FeedTab = "group";

  if (!state || !currentUser) return null;

  const { group } = state;
  const participants = getAllParticipantStats(state);
  const stats = getGroupStats(state);
  const goal = group.weeklyGoal;
  const curator = getCurator(state);
  const isCurator = currentUser.role === "curator";

  return (
    <div className="space-y-5">
      <PageHeader
        title={group.name}
        subtitle={group.description}
        action={
          <Badge tone="accent">
            {stats.participants}{" "}
            {pluralize(stats.participants, "участник", "участника", "участников")}
          </Badge>
        }
      />

      {/* Личные сообщения доступны отдельной вкладкой `/direct`. */}

      <div className="grid gap-5 lg:grid-cols-5">
          <div className="space-y-5 lg:col-span-3">
            <Card className="p-5 sm:p-6">
              <CardHeader
                icon={<TrendingUp className="size-5" />}
                title="Общий прогресс"
                description={`Средний прогресс группы — ${stats.averageProgress}%`}
              />

              <ProgressBar value={stats.averageProgress} className="mt-5" />

              <div className="mt-5 grid grid-cols-2 gap-3">
                <StatCard
                  label="Выполненных заданий"
                  value={stats.completedTasks}
                  icon={<ListChecks className="size-4" />}
                  tone="success"
                />
                <StatCard
                  label={`${pluralize(stats.currentDay, "день", "дня", "дней")} программы`}
                  value={stats.currentDay}
                  hint={`из ${group.duration}`}
                  icon={<CalendarDays className="size-4" />}
                  tone="accent"
                />
              </div>
            </Card>

            {goal && (
              <Card className="p-5 sm:p-6">
                <CardHeader
                  icon={<Target className="size-5" />}
                  title="Цель недели"
                  action={
                    <Badge tone={goal.done >= goal.target ? "success" : "accent"}>
                      {goal.done} / {goal.target}
                    </Badge>
                  }
                />
                <p className="mt-4 text-[15px] leading-relaxed text-muted">{goal.title}</p>
                <ProgressBar
                  value={(goal.done / goal.target) * 100}
                  tone={goal.done >= goal.target ? "success" : "accent"}
                  className="mt-4"
                />
              </Card>
            )}

            <GroupFeed description="Пишите, поддерживайте друг друга и отмечайте маленькие победы." />
          </div>

          <div className="space-y-5 lg:col-span-2">
            <Card className="p-5 sm:p-6">
              <CardHeader
                icon={<Users className="size-5" />}
                title="Участники"
                description="Как идут дела у каждого."
              />

              <ul className="mt-5 space-y-3">
                {participants.map((item) => (
                  <li key={item.user.id} className="flex items-center gap-3">
                    <Avatar name={item.user.name} emoji={item.user.avatar} size="sm" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="truncate text-sm font-medium">{item.user.name}</span>
                        <span className="text-xs text-muted tabular-nums">{item.progress}%</span>
                      </div>
                      <ProgressBar
                        value={item.progress}
                        size="sm"
                        tone={item.status === "needs_support" ? "warning" : "accent"}
                        className="mt-1.5"
                      />
                    </div>
                  </li>
                ))}
              </ul>
            </Card>

            <InviteCodeCard
              code={group.inviteCode}
              description="По этому коду в группу может войти новый участник."
            />
          </div>
        </div>
    </div>
  );
}
