"use client";

import { type ReactNode } from "react";
import Link from "next/link";
import { ArrowRight, CalendarDays, ListChecks, TriangleAlert } from "lucide-react";

import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/page-header";
import { ProgressBar } from "@/components/progress-bar";
import { WeekTasksCard } from "@/components/week-tasks-card";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { getParticipantDay } from "@/lib/services/groupService";
import { getParticipantStats } from "@/lib/services/statsService";
import { sendSupportSignal } from "@/lib/services/supportService";
import {
  completeWeekTask,
  getAnswerLabel,
  getProgramWeek,
  getTasksByWeek,
  getWeekBounds,
  hasCompletedTask,
  isRequiredTask,
  needsCuratorAttention,
  undoWeekTask,
} from "@/lib/services/taskService";
import { useAppStore } from "@/lib/store/app-store";
import type { TaskAnswer } from "@/lib/types";
import { formatWeekRange, pluralize } from "@/lib/utils";

export default function ParticipantPage() {
  return (
    <AppShell role="participant">
      <ParticipantDashboard />
    </AppShell>
  );
}

function ParticipantDashboard() {
  const { state, currentUser, update } = useAppStore();
  const { toast } = useToast();

  if (!state || !currentUser) return null;

  const day = getParticipantDay(state, currentUser.id);
  const week = getProgramWeek(day, state.group.duration);
  const weekTasks = getTasksByWeek(state, week);
  const overdueTasks = state.tasks.filter(
    (task) =>
      isRequiredTask(task) &&
      task.week < week &&
      !hasCompletedTask(state, task.id, currentUser.id),
  );
  const myCompletions = (state.taskCompletions ?? []).filter(
    (item) => item.userId === currentUser.id,
  );
  const completedIds = new Set(myCompletions.map((item) => item.taskId));
  const answers = Object.fromEntries(myCompletions.map((item) => [item.taskId, item.answer]));
  const weekBounds = getWeekBounds(week, state.group.duration);
  const stats = getParticipantStats(state, currentUser.id);

  const timelineProgress = (day / state.group.duration) * 100;

  const handleComplete = (taskId: string) => {
    update((current) => completeWeekTask(current, taskId, currentUser.id));
    toast("Шаг закрыт. Отличный ход 👏");
  };

  const handleAnswer = (taskId: string, answer: TaskAnswer) => {
    const task = state.tasks.find((item) => item.id === taskId);
    update((current) => {
      const next = completeWeekTask(current, taskId, currentUser.id, answer);
      if (!needsCuratorAttention(answer) || !task) return next;
      return sendSupportSignal(next, currentUser.id, `${task.title}: ${getAnswerLabel(answer)}`);
    });
    toast(
      needsCuratorAttention(answer)
        ? "Ответ сохранён. Куратор увидит, что нужна помощь."
        : "Ответ сохранён",
    );
  };

  const handleUndo = (taskId: string) => {
    update((current) => undoWeekTask(current, taskId, currentUser.id));
    toast("Отметка снята", "info");
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title={`Добро пожаловать, ${currentUser.name} 👋`}
        subtitle={state.group.name}
      />

      {/* Прогресс программы */}
      <Card tone="accent" className="p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-accent-strong">Твой путь</p>
            <p className="mt-1 text-2xl font-semibold sm:text-3xl">
              День {day} из {state.group.duration}
            </p>
          </div>
          <div className="flex items-center gap-2 text-[13px] text-muted">
            <CalendarDays className="size-4 text-accent" />
            Осталось {state.group.duration - day}{" "}
            {pluralize(state.group.duration - day, "день", "дня", "дней")}
          </div>
        </div>

        <ProgressBar value={timelineProgress} className="mt-5" />
      </Card>

      <div className="grid gap-5 lg:grid-cols-5">
        <div className="space-y-5 lg:col-span-3">
          <WeekTasksCard
            week={week}
            rangeLabel={formatWeekRange(
              state.group.programStartDate,
              weekBounds.start,
              weekBounds.end,
            )}
            tasks={weekTasks}
            overdueTasks={overdueTasks}
            completedIds={completedIds}
            answers={answers}
            onComplete={handleComplete}
            onAnswer={handleAnswer}
            onUndo={handleUndo}
          />
        </div>

        <div className="space-y-5 lg:col-span-2">
          {stats && (
            <Card className="p-5 sm:p-6">
              <div className="flex items-baseline justify-between gap-3">
                <h2 className="text-base font-semibold sm:text-lg">Прогресс</h2>
                <Link
                  href="/progress"
                  className="inline-flex items-center gap-1 text-[13px] font-medium text-accent hover:text-accent-strong"
                >
                  Подробнее
                  <ArrowRight className="size-3.5" />
                </Link>
              </div>

              <p className="mt-4 text-3xl font-semibold tabular-nums">
                {day} / {state.group.duration}
                <span className="ml-2 text-sm font-normal text-muted">
                  {pluralize(state.group.duration, "день", "дня", "дней")}
                </span>
              </p>

              <ProgressBar
                value={stats.progress}
                label="Выполнение программы"
                hint={`${stats.progress}%`}
                className="mt-4"
              />

              <div className="mt-5 grid grid-cols-2 gap-2.5">
                <MiniStat
                  label="Выполнено заданий"
                  value={stats.completedTasks}
                  icon={<ListChecks className="size-4" />}
                  tone="accent"
                />
                <MiniStat
                  label="Просрочено"
                  value={stats.missedDays}
                  icon={<TriangleAlert className="size-4" />}
                  tone="warning"
                />
              </div>
            </Card>
          )}

          <div className="grid gap-2 sm:grid-cols-2">
            <Link href="/group">
              <Button variant="outline" fullWidth>
                Группа
                <ArrowRight className="size-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Компактная метрика для узкой колонки: подпись переносится, а не обрезается. */
function MiniStat({
  label,
  value,
  icon,
  tone,
}: {
  label: string;
  value: number;
  icon: ReactNode;
  tone: "accent" | "success" | "warning";
}) {
  const tones = {
    accent: "bg-accent-soft text-accent-strong",
    success: "bg-success-soft text-success-strong",
    warning: "bg-warning-soft text-warning",
  } as const;

  return (
    <div className="rounded-2xl bg-surface-muted p-3 ring-1 ring-inset ring-line">
      <span className={`flex size-8 items-center justify-center rounded-lg ${tones[tone]}`}>
        {icon}
      </span>
      <p className="mt-2.5 text-xl font-semibold tabular-nums">{value}</p>
      <p className="mt-0.5 text-[11px] leading-snug text-muted">{label}</p>
    </div>
  );
}
