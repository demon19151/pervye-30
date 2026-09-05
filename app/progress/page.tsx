"use client";

import Link from "next/link";
import { ArrowRight, Battery, CheckCircle2, Flame, ListChecks, Smile } from "lucide-react";

import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/page-header";
import { ProgressBar, ProgressRing } from "@/components/progress-bar";
import { StatCard } from "@/components/stat-card";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/states";
import { getCheckIns, getParticipantDay } from "@/lib/services/checkInService";
import { getParticipantStats } from "@/lib/services/statsService";
import { getTaskByDay } from "@/lib/services/taskService";
import { useAppStore } from "@/lib/store/app-store";
import { cn, formatScore, pluralize } from "@/lib/utils";

const moodEmoji = ["", "😞", "🙁", "😐", "🙂", "😄"];

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

  const checkIns = getCheckIns(state, currentUser.id);
  const day = getParticipantDay(state, currentUser.id);
  const { duration } = state.group;

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
            label="Активных дней"
            value={stats.activeDays}
            icon={<CheckCircle2 className="size-4" />}
            tone="success"
          />
          <StatCard
            label="Текущая серия"
            value={stats.streak}
            hint={`${pluralize(stats.streak, "день", "дня", "дней")} подряд`}
            icon={<Flame className="size-4" />}
            tone="warning"
          />
          <StatCard
            label="Среднее настроение"
            value={`${formatScore(stats.mood)}/5`}
            hint={`энергия ${formatScore(stats.energy)}/5`}
            icon={<Smile className="size-4" />}
            tone="accent"
          />
        </div>
      </div>

      <Card className="p-5 sm:p-6">
        <CardHeader
          icon={<Battery className="size-5" />}
          title="Дни программы"
          description="Каждый закрытый день — небольшой, но заметный шаг."
        />

        <div className="mt-5 grid grid-cols-6 gap-2 sm:grid-cols-10">
          {Array.from({ length: duration }, (_, index) => index + 1).map((dayNumber) => {
            const checkIn = checkIns.find((item) => item.day === dayNumber);
            const isFuture = dayNumber > day;
            const isToday = dayNumber === day;

            return (
              <div
                key={dayNumber}
                title={`День ${dayNumber}`}
                className={cn(
                  "flex aspect-square flex-col items-center justify-center gap-0.5 rounded-xl text-[11px] font-medium ring-1 ring-inset transition-colors",
                  checkIn?.completed
                    ? "bg-success-soft text-success-strong ring-success/25"
                    : checkIn
                      ? "bg-warning-soft text-warning ring-warning/25"
                      : isToday
                        ? "bg-accent-soft text-accent-strong ring-2 ring-accent"
                        : isFuture
                          ? "bg-surface-muted text-subtle ring-line"
                          : "bg-surface-muted text-subtle ring-line",
                )}
              >
                <span className="tabular-nums">{dayNumber}</span>
                {checkIn?.mood ? <span className="leading-none">{moodEmoji[checkIn.mood]}</span> : null}
              </div>
            );
          })}
        </div>

        <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5 text-[12px] text-muted">
          <Legend className="bg-success" label="задание выполнено" />
          <Legend className="bg-warning" label="отметился, но задание не закрыл" />
          <Legend className="bg-accent" label="сегодня" />
          <Legend className="bg-line" label="ещё впереди" />
        </div>
      </Card>

      <Card className="p-5 sm:p-6">
        <CardHeader title="Заметки по дням" description="То, что ты сам отметил в чек-инах." />

        <div className="mt-5 space-y-2.5">
          {checkIns.filter((item) => item.note).length === 0 ? (
            <EmptyState
              title="Заметок пока нет"
              description="Оставь первую заметку в чек-ине — потом их приятно перечитывать."
            />
          ) : (
            checkIns
              .filter((item) => item.note)
              .reverse()
              .map((item) => (
                <div key={item.id} className="rounded-2xl bg-surface-muted px-4 py-3.5">
                  <div className="flex items-center gap-2 text-[13px] text-muted">
                    <span className="font-semibold text-foreground">День {item.day}</span>
                    <span>{moodEmoji[item.mood]}</span>
                    <span className="truncate">{getTaskByDay(state, item.day)?.title}</span>
                  </div>
                  <p className="mt-1.5 text-[15px] leading-relaxed">{item.note}</p>
                </div>
              ))
          )}
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

function Legend({ className, label }: { className: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={cn("size-2.5 rounded-full", className)} aria-hidden />
      {label}
    </span>
  );
}
