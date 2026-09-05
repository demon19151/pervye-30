"use client";

import { Check, CircleDashed, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/states";
import type { Task } from "@/lib/types";

export function TaskCard({
  task,
  day,
  completed,
  onComplete,
  onUndo,
}: {
  task?: Task;
  day: number;
  completed: boolean;
  onComplete: () => void;
  onUndo: () => void;
}) {
  if (!task) {
    return (
      <Card className="p-5 sm:p-6">
        <EmptyState
          icon={<CircleDashed className="size-5" />}
          title={`Задание на день ${day} ещё не добавлено`}
          description="Куратор добавит его в панели куратора — тогда оно появится здесь."
        />
      </Card>
    );
  }

  return (
    <Card tone={completed ? "completed" : "default"} className="p-5 sm:p-6">
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone="accent">
          <Sparkles className="size-3.5" />
          Задание дня
        </Badge>
        <Badge tone="neutral">День {task.day}</Badge>
        {completed && (
          <Badge tone="success">
            <Check className="size-3.5" />
            Готово
          </Badge>
        )}
      </div>

      <h2 className="mt-4 text-xl font-semibold sm:text-2xl">{task.title}</h2>
      {task.description && (
        <p className="mt-2.5 text-[15px] leading-relaxed text-muted">{task.description}</p>
      )}

      <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:items-center">
        {completed ? (
          <>
            <Button variant="success" size="lg" className="pointer-events-none sm:w-auto" fullWidth>
              <Check className="size-5" />
              Выполнено ✓
            </Button>
            <Button variant="ghost" size="lg" onClick={onUndo} className="sm:w-auto" fullWidth>
              Отменить
            </Button>
          </>
        ) : (
          <Button size="lg" onClick={onComplete} fullWidth className="sm:w-auto sm:min-w-56">
            Выполнено
          </Button>
        )}
      </div>
    </Card>
  );
}
