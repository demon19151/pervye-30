"use client";

import type { ReactNode } from "react";
import { MessageCircle, Users } from "lucide-react";

import { ParticipantCard } from "@/components/participant-card";
import { StatusBadge } from "@/components/participant-status";
import { ProgressBar } from "@/components/progress-bar";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/states";
import type { ParticipantStats } from "@/lib/types";
import { cn, formatScore } from "@/lib/utils";

/** На мобильном таблица превращается в список карточек. */
export function ParticipantTable({
  participants,
  duration,
  onWrite,
}: {
  participants: ParticipantStats[];
  duration: number;
  onWrite?: (stats: ParticipantStats) => void;
}) {
  if (participants.length === 0) {
    return (
      <Card className="p-5 sm:p-6">
        <EmptyState
          icon={<Users className="size-5" />}
          title="Пока в группе нет участников"
          description="Отправьте код приглашения — участники появятся здесь автоматически."
        />
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-3 lg:hidden">
        {participants.map((stats) => (
          <ParticipantCard
            key={stats.user.id}
            stats={stats}
            duration={duration}
            onWrite={onWrite ? () => onWrite(stats) : undefined}
          />
        ))}
      </div>

      <Card className="hidden overflow-hidden lg:block">
        <table className="w-full border-collapse text-sm">
          <caption className="sr-only">Прогресс участников группы</caption>
          <thead>
            <tr className="border-b border-line bg-surface-muted text-left text-[13px] text-muted">
              <Th className="pl-6">Участник</Th>
              <Th className="w-52">Прогресс</Th>
              <Th>Текущий день</Th>
              <Th>Настроение</Th>
              <Th>Энергия</Th>
              <Th>Пропуски</Th>
              <Th>Статус</Th>
              <Th className="pr-6 text-right">Действие</Th>
            </tr>
          </thead>
          <tbody>
            {participants.map((stats) => (
              <tr
                key={stats.user.id}
                className={cn(
                  "border-b border-line transition-colors last:border-0 hover:bg-surface-muted/70",
                  stats.status === "needs_support" && "bg-warning-soft/40",
                )}
              >
                <td className="py-4 pl-6 pr-4">
                  <div className="flex items-center gap-3">
                    <Avatar name={stats.user.name} emoji={stats.user.avatar} size="sm" />
                    <span className="font-medium">{stats.user.name}</span>
                  </div>
                </td>
                <td className="py-4 pr-4">
                  <ProgressBar
                    value={stats.progress}
                    hint={`${stats.progress}%`}
                    size="sm"
                    tone={stats.status === "needs_support" ? "warning" : "accent"}
                  />
                </td>
                <td className="py-4 pr-4 tabular-nums">
                  {stats.currentDay}
                  <span className="text-subtle"> / {duration}</span>
                </td>
                <td className="py-4 pr-4 tabular-nums">{formatScore(stats.mood)}/5</td>
                <td className="py-4 pr-4 tabular-nums">{formatScore(stats.energy)}/5</td>
                <td className="py-4 pr-4">
                  <span
                    className={cn(
                      "tabular-nums",
                      stats.missedDays > 0 ? "font-semibold text-warning" : "text-muted",
                    )}
                  >
                    {stats.missedDays}
                  </span>
                </td>
                <td className="py-4 pr-4">
                  <StatusBadge stats={stats} />
                </td>
                <td className="py-4 pr-6 text-right">
                  {onWrite && (
                    <Button variant="ghost" size="sm" onClick={() => onWrite(stats)}>
                      <MessageCircle className="size-4" />
                      Написать
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </>
  );
}

function Th({ children, className }: { children: ReactNode; className?: string }) {
  return <th className={cn("py-3 pr-4 font-medium", className)}>{children}</th>;
}
