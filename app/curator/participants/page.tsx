"use client";

import { MessageCircle, Users } from "lucide-react";

import { useWriteToParticipant } from "@/components/curator/use-write-to-participant";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/participant-status";
import { ProgressBar } from "@/components/progress-bar";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/states";
import { getCheckIns } from "@/lib/services/checkInService";
import { getAllParticipantStats } from "@/lib/services/statsService";
import { useAppStore } from "@/lib/store/app-store";
import { cn, formatScore, pluralize, toDative } from "@/lib/utils";

const moodEmoji = ["", "😞", "🙁", "😐", "🙂", "😄"];

export default function CuratorParticipantsPage() {
  return (
    <AppShell role="curator">
      <CuratorParticipants />
    </AppShell>
  );
}

function CuratorParticipants() {
  const { state } = useAppStore();
  const write = useWriteToParticipant();

  if (!state) return null;

  const participants = getAllParticipantStats(state);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Участники"
        subtitle="Прогресс, состояние и заметки каждого участника группы."
      />

      {participants.length === 0 ? (
        <Card className="p-6">
          <EmptyState
            icon={<Users className="size-5" />}
            title="В группе пока нет участников"
            description={`Отправьте код ${state.group.inviteCode} — участники появятся здесь автоматически.`}
          />
        </Card>
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {participants.map((stats) => {
            const checkIns = getCheckIns(state, stats.user.id);
            const notes = checkIns.filter((item) => item.note).slice(-2).reverse();

            return (
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
                      День {stats.currentDay} из {state.group.duration} · серия {stats.streak}{" "}
                      {pluralize(stats.streak, "день", "дня", "дней")}
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

                <dl className="mt-4 grid grid-cols-4 gap-2 text-center">
                  <Metric label="Настроение" value={`${formatScore(stats.mood)}/5`} />
                  <Metric label="Энергия" value={`${formatScore(stats.energy)}/5`} />
                  <Metric label="Заданий" value={String(stats.completedTasks)} />
                  <Metric
                    label="Пропуски"
                    value={String(stats.missedDays)}
                    tone={stats.missedDays > 0 ? "warning" : "default"}
                  />
                </dl>

                <div className="mt-4">
                  <p className="text-[11px] font-semibold tracking-wide text-subtle uppercase">
                    Дни программы
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {Array.from({ length: stats.currentDay }, (_, index) => index + 1).map((day) => {
                      const checkIn = checkIns.find((item) => item.day === day);

                      return (
                        <span
                          key={day}
                          title={`День ${day}`}
                          className={cn(
                            "flex size-8 flex-col items-center justify-center rounded-lg text-[10px] font-medium ring-1 ring-inset",
                            checkIn?.completed
                              ? "bg-success-soft text-success-strong ring-success/25"
                              : checkIn
                                ? "bg-warning-soft text-warning ring-warning/25"
                                : "bg-surface-muted text-subtle ring-line",
                          )}
                        >
                          <span className="tabular-nums">{day}</span>
                          {checkIn?.mood ? <span className="leading-none">{moodEmoji[checkIn.mood]}</span> : null}
                        </span>
                      );
                    })}
                  </div>
                </div>

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

                {notes.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <p className="text-[11px] font-semibold tracking-wide text-subtle uppercase">
                      Последние заметки
                    </p>
                    {notes.map((note) => (
                      <div key={note.id} className="rounded-2xl bg-surface-muted px-4 py-3">
                        <Badge tone="neutral">День {note.day}</Badge>
                        <p className="mt-2 text-[14px] leading-relaxed">{note.note}</p>
                      </div>
                    ))}
                  </div>
                )}

                <Button
                  variant="outline"
                  fullWidth
                  className="mt-5"
                  onClick={() => write.openFor(stats.user)}
                >
                  <MessageCircle className="size-4" />
                  Написать {toDative(stats.user.name)}
                </Button>
              </Card>
            );
          })}
        </div>
      )}

      {write.modal}
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
