"use client";

import { type ReactNode } from "react";
import { CalendarDays, ListChecks, TriangleAlert } from "lucide-react";

import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/page-header";
import { ProgressBar } from "@/components/progress-bar";
import { WeekTasksCard } from "@/components/week-tasks-card";
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
import { cn, formatWeekRange, pluralize } from "@/lib/utils";

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
  const notes = Object.fromEntries(myCompletions.map((item) => [item.taskId, item.answerNote]));
  const weekBounds = getWeekBounds(week, state.group.duration);
  const stats = getParticipantStats(state, currentUser.id);

  const timelineProgress = (day / state.group.duration) * 100;

  const handleComplete = (taskId: string) => {
    update((current) => completeWeekTask(current, taskId, currentUser.id));
    toast("Шаг закрыт. Отличный ход 👏");
  };

  const handleAnswer = (taskId: string, answer: TaskAnswer, note?: string) => {
    const task = state.tasks.find((item) => item.id === taskId);
    const hasNote = Boolean(note?.trim());
    update((current) => {
      const next = completeWeekTask(current, taskId, currentUser.id, answer, note);
      if (!needsCuratorAttention(answer, task) || !task) return next;
      return sendSupportSignal(next, currentUser.id, `${task.title}: ${getAnswerLabel(answer, task)}`);
    });
    toast(
      needsCuratorAttention(answer, task)
        ? "Ответ сохранён. Наставник увидит, что нужна помощь."
        : hasNote
          ? "Ответ сохранён. Наставник увидит ваш комментарий."
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

      <Card tone="accent" className="p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <p className="text-sm font-medium text-accent-strong">Твой путь</p>
          <div className="flex shrink-0 items-center gap-2 text-[13px] text-muted">
            <CalendarDays className="size-4 text-accent" />
            Осталось {state.group.duration - day}{" "}
            {pluralize(state.group.duration - day, "день", "дня", "дней")}
          </div>
        </div>

        <div className="mt-1 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-2xl font-semibold sm:text-3xl">
            День {day} из {state.group.duration}
          </p>
          {stats ? (
            <div className="grid grid-cols-2 gap-2.5 sm:w-[min(100%,22rem)]">
              <PathStat
                label="Выполнено заданий"
                value={stats.completedTasks}
                icon={<ListChecks className="size-4" />}
                tone="accent"
              />
              <PathStat
                label="Просрочено"
                value={stats.missedDays}
                icon={<TriangleAlert className="size-4" />}
                tone="warning"
              />
            </div>
          ) : null}
        </div>

        <ProgressBar value={timelineProgress} className="mt-5" />
      </Card>

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
        notes={notes}
        onComplete={handleComplete}
        onAnswer={handleAnswer}
        onUndo={handleUndo}
      />
    </div>
  );
}

function PathStat({
  label,
  value,
  icon,
  tone,
}: {
  label: string;
  value: number;
  icon: ReactNode;
  tone: "accent" | "warning";
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-accent-soft/80 px-3 py-2.5 ring-1 ring-inset ring-accent/25">
      <span
        className={cn(
          "flex size-8 shrink-0 items-center justify-center rounded-lg",
          tone === "accent" ? "bg-accent-soft text-accent-strong" : "bg-warning-soft text-warning",
        )}
      >
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-lg font-semibold tabular-nums leading-none sm:text-xl">{value}</p>
        <p className="mt-1 text-[11px] leading-snug text-muted">{label}</p>
      </div>
    </div>
  );
}
