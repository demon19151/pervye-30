"use client";

import { Users } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/participant-status";
import { ProgressBar } from "@/components/progress-bar";
import { Avatar } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/states";
import { getAllParticipantStats } from "@/lib/services/statsService";
import { useAppStore } from "@/lib/store/app-store";
import { cn } from "@/lib/utils";

export default function CuratorParticipantsPage() {
  return (
    <AppShell role="curator">
      <CuratorParticipants />
    </AppShell>
  );
}

function CuratorParticipants() {
  const { state } = useAppStore();

  if (!state) return null;

  const participants = getAllParticipantStats(state);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Участники"
        subtitle="Прогресс и обязательные шаги каждого участника группы."
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
            </Card>
          ))}
        </div>
      )}
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
