"use client";

import { Check, CircleDashed, ListChecks } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/states";
import {
  getAnswerLabel,
  getTaskKind,
  QUESTION_ANSWERS,
  STATUS_ANSWERS,
  TASK_KIND_LABELS,
} from "@/lib/services/taskService";
import type { Task, TaskAnswer, TaskKind } from "@/lib/types";
import { cn } from "@/lib/utils";

const kindTone: Record<TaskKind, "danger" | "caution" | "accent" | "neutral"> = {
  required: "danger",
  recommended: "caution",
  question: "accent",
  status: "neutral",
};

export function WeekTasksCard({
  week,
  rangeLabel,
  tasks,
  overdueTasks,
  completedIds,
  answers,
  onComplete,
  onAnswer,
  onUndo,
}: {
  week: number;
  rangeLabel?: string;
  tasks: Task[];
  overdueTasks: Task[];
  completedIds: Set<string>;
  answers: Record<string, TaskAnswer | undefined>;
  onComplete: (taskId: string) => void;
  onAnswer: (taskId: string, answer: TaskAnswer) => void;
  onUndo: (taskId: string) => void;
}) {
  const required = tasks.filter((task) => getTaskKind(task) === "required");
  const requiredDone = required.filter((task) => completedIds.has(task.id)).length;

  return (
    <Card className="p-5 sm:p-6">
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone="accent">
          <ListChecks className="size-3.5" />
          Неделя {week}
        </Badge>
        {rangeLabel && <Badge tone="neutral">{rangeLabel}</Badge>}
        {required.length > 0 && (
          <Badge tone={requiredDone === required.length ? "success" : "neutral"}>
            Обязательные {requiredDone} / {required.length}
          </Badge>
        )}
      </div>

      <h2 className="mt-4 text-xl font-semibold sm:text-2xl">Шаги этой недели</h2>
      <p className="mt-1.5 text-[15px] leading-relaxed text-muted">
        Обязательные лучше закрыть на этой неделе. Остальное — когда получится.
      </p>

      {overdueTasks.length > 0 && (
        <div className="mt-5 space-y-2">
          <p className="text-[13px] font-medium text-warning">Обязательное с прошлой недели</p>
          {overdueTasks.map((task) => (
            <WeekTaskRow
              key={task.id}
              task={task}
              completed={completedIds.has(task.id)}
              answer={answers[task.id]}
              overdue
              onComplete={() => onComplete(task.id)}
              onAnswer={(value) => onAnswer(task.id, value)}
              onUndo={() => onUndo(task.id)}
            />
          ))}
        </div>
      )}

      <div className="mt-5 space-y-2">
        {tasks.length === 0 ? (
          <EmptyState
            icon={<CircleDashed className="size-5" />}
            title="На эту неделю шагов пока нет"
            description="Куратор добавит их в панели — тогда они появятся здесь."
          />
        ) : (
          tasks.map((task) => (
            <WeekTaskRow
              key={task.id}
              task={task}
              completed={completedIds.has(task.id)}
              answer={answers[task.id]}
              onComplete={() => onComplete(task.id)}
              onAnswer={(value) => onAnswer(task.id, value)}
              onUndo={() => onUndo(task.id)}
            />
          ))
        )}
      </div>
    </Card>
  );
}

function WeekTaskRow({
  task,
  completed,
  answer,
  overdue = false,
  onComplete,
  onAnswer,
  onUndo,
}: {
  task: Task;
  completed: boolean;
  answer?: TaskAnswer;
  overdue?: boolean;
  onComplete: () => void;
  onAnswer: (answer: TaskAnswer) => void;
  onUndo: () => void;
}) {
  const kind = getTaskKind(task);

  return (
    <div
      className={cn(
        "rounded-2xl px-4 py-3.5 ring-1 ring-inset",
        completed
          ? "bg-success-soft/60 ring-success/20"
          : overdue
            ? "bg-warning-soft/50 ring-warning/20"
            : "bg-surface-muted ring-line",
      )}
    >
      <div className="flex items-start gap-3">
        <span
          className={cn(
            "mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg",
            completed ? "bg-success text-white" : "bg-surface text-muted",
          )}
        >
          {completed ? <Check className="size-4" /> : <CircleDashed className="size-4" />}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={kindTone[kind]}>{TASK_KIND_LABELS[kind]}</Badge>
            {getAnswerLabel(answer) && <Badge tone="success">{getAnswerLabel(answer)}</Badge>}
          </div>
          <p className={cn("mt-2 font-semibold", completed && "text-success-strong")}>{task.title}</p>
          {task.description && (
            <p className="mt-1 text-sm leading-relaxed text-muted">{task.description}</p>
          )}
          <div className="mt-3 flex flex-wrap gap-2">
            {completed ? (
              <Button variant="ghost" size="sm" onClick={onUndo}>
                Изменить ответ
              </Button>
            ) : kind === "question" ? (
              QUESTION_ANSWERS.map((item) => (
                <Button
                  key={item.value}
                  size="sm"
                  variant={item.value === "no" ? "outline" : "primary"}
                  onClick={() => onAnswer(item.value)}
                >
                  {item.label}
                </Button>
              ))
            ) : kind === "status" ? (
              STATUS_ANSWERS.map((item) => (
                <Button
                  key={item.value}
                  size="sm"
                  variant={item.value === "clear" ? "primary" : "outline"}
                  onClick={() => onAnswer(item.value)}
                >
                  {item.label}
                </Button>
              ))
            ) : (
              <Button size="sm" onClick={onComplete}>
                Сделано
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
