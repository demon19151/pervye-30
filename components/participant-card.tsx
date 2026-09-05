"use client";

import { MessageCircle } from "lucide-react";

import { ProgressBar } from "@/components/progress-bar";
import { StatusBadge } from "@/components/participant-status";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { ParticipantStats } from "@/lib/types";
import { formatScore, pluralize, toDative } from "@/lib/utils";

export function ParticipantCard({
  stats,
  duration,
  onWrite,
}: {
  stats: ParticipantStats;
  duration: number;
  onWrite?: () => void;
}) {
  return (
    <Card
      tone={stats.status === "needs_support" ? "warning" : "default"}
      className="p-4"
      interactive
    >
      <div className="flex items-start gap-3">
        <Avatar name={stats.user.name} emoji={stats.user.avatar} />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate font-semibold">{stats.user.name}</p>
              <p className="text-[13px] text-muted">
                День {stats.currentDay} из {duration}
              </p>
            </div>
            <StatusBadge stats={stats} />
          </div>

          <ProgressBar
            value={stats.progress}
            hint={`${stats.progress}%`}
            label="Прогресс"
            size="sm"
            tone={stats.status === "needs_support" ? "warning" : "accent"}
            className="mt-3"
          />

          <dl className="mt-3 grid grid-cols-3 gap-2 text-center">
            <Metric label="Настроение" value={`${formatScore(stats.mood)}/5`} />
            <Metric label="Энергия" value={`${formatScore(stats.energy)}/5`} />
            <Metric
              label="Пропуски"
              value={String(stats.missedDays)}
              hint={pluralize(stats.missedDays, "день", "дня", "дней")}
            />
          </dl>

          {onWrite && (
            <Button variant="outline" size="sm" fullWidth className="mt-3" onClick={onWrite}>
              <MessageCircle className="size-4" />
              Написать {toDative(stats.user.name)}
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}

function Metric({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-xl bg-surface-muted px-2 py-2">
      <dt className="text-[11px] text-subtle">{label}</dt>
      <dd className="text-sm font-semibold tabular-nums">
        {value}
        {hint && <span className="ml-1 text-[11px] font-normal text-subtle">{hint}</span>}
      </dd>
    </div>
  );
}
