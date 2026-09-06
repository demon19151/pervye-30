"use client";

import Link from "next/link";
import { ArrowRight, CalendarDays, ListChecks, TriangleAlert } from "lucide-react";

import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/page-header";
import { ProgressBar, ProgressRing } from "@/components/progress-bar";
import { StatCard } from "@/components/stat-card";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { getParticipantDay } from "@/lib/services/groupService";
import { getParticipantStats } from "@/lib/services/statsService";
import {
  getProgramWeek,
  getTasksByWeek,
  getWeekBounds,
  getWeekCount,
  hasCompletedTask,
  isRequiredTask,
} from "@/lib/services/taskService";
import { useAppStore } from "@/lib/store/app-store";
import { cn, formatWeekRange, pluralize } from "@/lib/utils";

export default function ProgressPage() {
  return (
    <AppShell role="participant">
      <ProgressOverview />
    </AppShell>
  );
}

function ProgressOverview() {
  const { state, currentUser } = useAppStore();
  if (!state || !currentUser) return null;

  const stats = getParticipantStats(state, currentUser.id);
  if (!stats) return null;

  const day = getParticipantDay(state, currentUser.id);
  const { duration } = state.group;
  const weekCount = getWeekCount(duration);

  return (
    <div className="space-y-5">
      <PageHeader title="Прогресс" subtitle={`${day} / ${duration} дней программы`} />

      <div className="grid gap-5 lg:grid-cols-5">
        <Card className="p-5 sm:p-6 lg:col-span-2">
          <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center lg:flex-col">
            <ProgressRing value={stats.progress} caption="выполнение" />
            <div className="w-full space-y-4 text-center sm:text-left lg:text-center">
              <div>
                <p className="text-3xl font-semibold tabular-nums">
                  {day} / {duration}
                </p>
                <p className="mt-1 text-sm text-muted">
                  {pluralize(duration, "день", "дня", "дней")} программы
                </p>
              </div>
              <ProgressBar value={(day / duration) * 100} />
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-2 gap-3 lg:col-span-3 lg:grid-cols-2">
          <StatCard
            label="Выполнено заданий"
            value={stats.completedTasks}
            icon={<ListChecks className="size-4" />}
            tone="accent"
          />
          <StatCard
            label="Закрытых недель"
            value={stats.closedWeeks}
            icon={<CalendarDays className="size-4" />}
            tone="success"
          />
          <StatCard
            label="Просрочено"
            value={stats.missedDays}
            hint="обязательные шаги прошлых недель"
            icon={<TriangleAlert className="size-4" />}
            tone={stats.missedDays > 0 ? "warning" : "neutral"}
          />
          <StatCard
            label="Текущая неделя"
            value={getProgramWeek(day, duration)}
            hint={`из ${weekCount}`}
            icon={<CalendarDays className="size-4" />}
            tone="accent"
          />
        </div>
      </div>

      <Card className="p-5 sm:p-6">
        <CardHeader
          icon={<ListChecks className="size-5" />}
          title="Недели программы"
          description="Считаются только обязательные шаги. Рекомендуемые и вопросы на процент не влияют."
        />

        <div className="mt-5 space-y-3">
          {Array.from({ length: weekCount }, (_, index) => index + 1).map((week) => {
            const required = getTasksByWeek(state, week).filter(isRequiredTask);
            const done = required.filter((task) => hasCompletedTask(state, task.id, currentUser.id))
              .length;
            const bounds = getWeekBounds(week, duration);
            const currentWeek = getProgramWeek(day, duration);
            const isCurrent = week === currentWeek;
            const share = required.length ? Math.round((done / required.length) * 100) : 0;

            return (
              <div
                key={week}
                className={cn(
                  "rounded-2xl px-4 py-3.5 ring-1 ring-inset",
                  isCurrent ? "bg-accent-soft/50 ring-accent/20" : "bg-surface-muted ring-line",
                )}
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="text-sm font-semibold">
                    Неделя {week}
                    {isCurrent ? <span className="ml-2 text-[12px] font-medium text-accent-strong">сейчас</span> : null}
                  </p>
                  <p className="text-[13px] text-muted">
                    {required.length
                      ? `${done} из ${required.length} обязательных`
                      : "Нет обязательных шагов"}
                  </p>
                </div>
                {formatWeekRange(state.group.programStartDate, bounds.start, bounds.end) && (
                  <p className="mt-1 text-[12px] text-subtle">
                    {formatWeekRange(state.group.programStartDate, bounds.start, bounds.end)}
                  </p>
                )}
                <ProgressBar value={share} className="mt-3" size="sm" />
              </div>
            );
          })}
        </div>
      </Card>

      <Link href="/summary">
        <Button variant="outline" fullWidth size="lg">
          Посмотреть итоги программы
          <ArrowRight className="size-4" />
        </Button>
      </Link>
    </div>
  );
}
