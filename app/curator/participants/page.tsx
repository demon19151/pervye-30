"use client";

import { useState } from "react";
import { Users } from "lucide-react";

import { AppShell } from "@/components/layout/app-shell";
import { MessageParticipantModal } from "@/components/message-participant-modal";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/participant-status";
import { ProgressBar } from "@/components/progress-bar";
import { Avatar } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/states";
import { useToast } from "@/components/ui/toast";
import { ParticipantSummaryReflection } from "@/components/summary-reflection";
import { ParticipantWeekAnswers, WeekStepAnswersCard } from "@/components/week-step-answers";
import { addDirectMessage } from "@/lib/services/directMessageService";
import { getSummaryReflection } from "@/lib/services/summaryService";
import {
  countSilentAnswerWeeks,
  getAllParticipantStats,
  getParticipantWeekRequiredProgress,
  getParticipantWeekStepAnswers,
  getSilentStepParticipants,
  getWeekRequiredStepTracking,
  getWeekStepAnswerTracking,
  summarizeWeekTracking,
} from "@/lib/services/statsService";
import { getCurrentWeek } from "@/lib/services/taskService";
import { useAppStore } from "@/lib/store/app-store";
import type { User } from "@/lib/types";
import { cn, toDative } from "@/lib/utils";

export default function CuratorParticipantsPage() {
  return (
    <AppShell role="curator">
      <CuratorParticipants />
    </AppShell>
  );
}

function CuratorParticipants() {
  const { state, currentUser, update } = useAppStore();
  const { toast } = useToast();
  const [week, setWeek] = useState<number | null>(null);
  const [messageTo, setMessageTo] = useState<User | null>(null);
  const [progressSort, setProgressSort] = useState<"high" | "low">("high");

  if (!state || !currentUser) return null;

  const participants = [...getAllParticipantStats(state)].sort((left, right) => {
    const diff = left.progress - right.progress;
    if (diff !== 0) return progressSort === "high" ? -diff : diff;
    return left.user.name.localeCompare(right.user.name, "ru");
  });
  const currentWeek = getCurrentWeek(state);
  const selectedWeek = week ?? currentWeek;
  const tracking = getWeekStepAnswerTracking(state, selectedWeek);
  const required = getWeekRequiredStepTracking(state, selectedWeek);
  const summary = summarizeWeekTracking(tracking, required);
  const silent = getSilentStepParticipants(state, selectedWeek);

  const sendMessage = (text: string) => {
    if (!messageTo) return;
    const result = addDirectMessage(state, currentUser.id, messageTo.id, text);
    if ("error" in result) {
      toast(result.error, "warning");
      return;
    }
    update(() => result.state);
    toast(`Сообщение ушло ${toDative(messageTo.name)}.`);
    setMessageTo(null);
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Участники"
        subtitle="Прогресс, обязательные шаги и ответы на вопросы недели."
      />

      <WeekStepAnswersCard
        week={selectedWeek}
        currentWeek={currentWeek}
        tracking={tracking}
        required={required}
        summary={summary}
        silent={silent}
        onWeekChange={setWeek}
        onWrite={setMessageTo}
      />

      {participants.length === 0 ? (
        <Card className="p-6">
          <EmptyState
            icon={<Users className="size-5" />}
            title="В группе пока нет участников"
            description="Отправьте код приглашения из настроек — участники появятся здесь автоматически."
          />
        </Card>
      ) : (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold tracking-tight">Участники</h2>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => setProgressSort("high")}
                className={cn(
                  "rounded-full px-3 py-1.5 text-[13px] font-medium transition-colors",
                  progressSort === "high"
                    ? "bg-accent-soft text-accent-strong"
                    : "bg-surface-muted text-muted ring-1 ring-inset ring-line hover:text-foreground",
                )}
              >
                Сначала выше %
              </button>
              <button
                type="button"
                onClick={() => setProgressSort("low")}
                className={cn(
                  "rounded-full px-3 py-1.5 text-[13px] font-medium transition-colors",
                  progressSort === "low"
                    ? "bg-accent-soft text-accent-strong"
                    : "bg-surface-muted text-muted ring-1 ring-inset ring-line hover:text-foreground",
                )}
              >
                Сначала ниже %
              </button>
            </div>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
          {participants.map((stats) => (
            <Card
              key={stats.user.id}
              tone={stats.status === "needs_support" ? "warning" : "default"}
              className="p-5 sm:p-6"
            >
              <div className="flex items-start gap-3">
                <Avatar name={stats.user.name} emoji={stats.user.avatar} size="lg" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg font-semibold">{stats.user.name}</h2>
                    <StatusBadge stats={stats} />
                  </div>
                  <p className="mt-0.5 text-[13px] text-muted">
                    День {stats.currentDay} из {state.group.duration}
                  </p>
                </div>
              </div>

              <ProgressBar
                value={stats.progress}
                label="Выполнение программы"
                hint={`${stats.progress}%`}
                tone={stats.status === "needs_support" ? "warning" : "accent"}
                className="mt-5"
              />

              <dl className="mt-4 grid grid-cols-3 gap-2 text-center">
                <Metric label="Заданий" value={String(stats.completedTasks)} />
                <Metric label="Недель закрыто" value={String(stats.closedWeeks)} />
                <Metric
                  label="Просрочено"
                  value={String(stats.missedDays)}
                  tone={stats.missedDays > 0 ? "warning" : "default"}
                />
              </dl>

              {stats.warnings.length > 0 && (
                <div className="mt-4 rounded-2xl bg-warning-soft/70 px-4 py-3">
                  <p className="text-[13px] font-medium text-warning">
                    Участнику может понадобиться поддержка
                  </p>
                  <ul className="mt-1.5 space-y-1">
                    {stats.warnings.map((warning) => (
                      <li key={warning.reason} className="text-[13px] text-muted">
                        • {warning.label}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <ParticipantWeekAnswers
                answers={getParticipantWeekStepAnswers(state, stats.user.id, selectedWeek)}
                required={getParticipantWeekRequiredProgress(state, stats.user.id, selectedWeek)}
                silentWeeks={countSilentAnswerWeeks(state, stats.user.id, selectedWeek)}
                onWrite={() => setMessageTo(stats.user)}
              />

              <ParticipantSummaryReflection
                reflection={getSummaryReflection(state, stats.user.id)}
              />
            </Card>
          ))}
          </div>
        </div>
      )}

      <MessageParticipantModal
        open={Boolean(messageTo)}
        participantName={messageTo?.name ?? ""}
        onClose={() => setMessageTo(null)}
        onSubmit={sendMessage}
      />
    </div>
  );
}

function Metric({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "warning";
}) {
  return (
    <div className="rounded-xl bg-surface-muted px-2 py-2.5">
      <dt className="text-[11px] text-subtle">{label}</dt>
      <dd
        className={cn(
          "text-sm font-semibold tabular-nums",
          tone === "warning" && "text-warning",
        )}
      >
        {value}
      </dd>
    </div>
  );
}
