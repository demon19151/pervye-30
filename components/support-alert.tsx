"use client";

import { Check, HeartHandshake, MessageCircle } from "lucide-react";

import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/states";
import type { ParticipantStats } from "@/lib/types";
import { toDative } from "@/lib/utils";

/**
 * Блок «Требуют внимания».
 * Формулировка всегда одна: «Участнику может понадобиться поддержка».
 * Это социальный сигнал для куратора, а не оценка состояния человека.
 */
export function SupportAlert({
  flagged,
  onWrite,
}: {
  flagged: ParticipantStats[];
  onWrite: (stats: ParticipantStats) => void;
}) {
  return (
    <Card tone={flagged.length > 0 ? "warning" : "default"} className="p-5 sm:p-6">
      <CardHeader
        icon={<HeartHandshake className="size-5" />}
        title="Требуют внимания"
        description="Ненавязчивый сигнал: кому-то из группы стоит написать первым."
        action={
          flagged.length > 0 ? (
            <Badge tone="warning">{flagged.length}</Badge>
          ) : (
            <Badge tone="success">Всё спокойно</Badge>
          )
        }
      />

      <div className="mt-5 space-y-3">
        {flagged.length === 0 ? (
          <EmptyState
            icon={<Check className="size-5" />}
            title="Сейчас никому не нужна дополнительная поддержка"
            description="Сигнал появится здесь автоматически: по пропускам, по чек-инам или по просьбе участника."
            className="bg-surface"
          />
        ) : (
          flagged.map((stats) => (
            <div
              key={stats.user.id}
              className="rounded-2xl bg-surface p-4 ring-1 ring-inset ring-warning/25"
            >
              <div className="flex items-start gap-3">
                <Avatar name={stats.user.name} emoji={stats.user.avatar} />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{stats.user.name}</p>
                  <p className="text-sm text-warning">Участнику может понадобиться поддержка</p>

                  <ul className="mt-2.5 space-y-1">
                    {stats.warnings.map((warning) => (
                      <li key={warning.reason} className="flex gap-2 text-[13px] text-muted">
                        <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-warning" aria-hidden />
                        {warning.label}
                      </li>
                    ))}
                  </ul>

                  <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                    <Button size="sm" onClick={() => onWrite(stats)}>
                      <MessageCircle className="size-4" />
                      Написать {toDative(stats.user.name)}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}
