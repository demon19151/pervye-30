"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { ArrowRight, CalendarDays, CheckCircle2, Flame, ListChecks } from "lucide-react";

import { CheckInCard } from "@/components/check-in-card";
import { GroupFeed } from "@/components/group-feed";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/page-header";
import { ProgressBar } from "@/components/progress-bar";
import { SupportRequestCard } from "@/components/support-request-card";
import { SupportSignalModal } from "@/components/support-signal-modal";
import { TaskCard } from "@/components/task-card";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import {
  completeTask,
  getCheckIn,
  getParticipantDay,
  saveDay,
  undoTask,
} from "@/lib/services/checkInService";
import { getParticipantStats } from "@/lib/services/statsService";
import { getSignalsForUser, sendSupportSignal } from "@/lib/services/supportService";
import { getTaskByDay } from "@/lib/services/taskService";
import { useAppStore } from "@/lib/store/app-store";
import { pluralize } from "@/lib/utils";

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
  const [supportOpen, setSupportOpen] = useState(false);

  if (!state || !currentUser) return null;

  const day = getParticipantDay(state, currentUser.id);
  const task = getTaskByDay(state, day);
  const checkIn = getCheckIn(state, currentUser.id, day);
  const stats = getParticipantStats(state, currentUser.id);
  const pendingSignal = getSignalsForUser(state, currentUser.id).some((signal) => !signal.resolved);

  const completed = Boolean(checkIn?.completed);
  const timelineProgress = (day / state.group.duration) * 100;

  const handleComplete = () => {
    update((current) => completeTask(current, currentUser.id, day));
    toast("Задание выполнено! Отличный шаг 👏");
  };

  const handleUndo = () => {
    update((current) => undoTask(current, currentUser.id, day));
    toast("Отметка снята", "info");
  };

  const handleSaveDay = (input: { mood: number; energy: number; note: string }) => {
    update((current) => {
      const result = saveDay(current, currentUser.id, day, input);
      return "error" in result ? current : result.state;
    });
    toast("День сохранён");
  };

  const handleSupport = (option: string) => {
    update((current) => sendSupportSignal(current, currentUser.id, option));
    setSupportOpen(false);
    toast("Куратор получил сигнал");
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
          <TaskCard
            task={task}
            day={day}
            completed={completed}
            onComplete={handleComplete}
            onUndo={handleUndo}
          />

          <CheckInCard
            key={`${currentUser.id}-${day}`}
            initialMood={checkIn?.mood ?? 0}
            initialEnergy={checkIn?.energy ?? 0}
            initialNote={checkIn?.note ?? ""}
            saved={Boolean(checkIn?.mood && checkIn?.energy)}
            onSave={handleSaveDay}
          />

          <SupportRequestCard pending={pendingSignal} onOpen={() => setSupportOpen(true)} />
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

              <div className="mt-5 grid grid-cols-3 gap-2.5">
                <MiniStat
                  label="Выполнено заданий"
                  value={stats.completedTasks}
                  icon={<ListChecks className="size-4" />}
                  tone="accent"
                />
                <MiniStat
                  label="Активных дней"
                  value={stats.activeDays}
                  icon={<CheckCircle2 className="size-4" />}
                  tone="success"
                />
                <MiniStat
                  label="Текущая серия"
                  value={stats.streak}
                  icon={<Flame className="size-4" />}
                  tone="warning"
                />
              </div>
            </Card>
          )}

          <GroupFeed limit={4} description="Последние сообщения твоей группы." />

          <Link href="/group">
            <Button variant="outline" fullWidth>
              Открыть страницу группы
              <ArrowRight className="size-4" />
            </Button>
          </Link>
        </div>
      </div>

      <SupportSignalModal
        open={supportOpen}
        onClose={() => setSupportOpen(false)}
        onSubmit={handleSupport}
      />
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
