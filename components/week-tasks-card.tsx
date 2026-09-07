"use client";

import { useMemo, useState } from "react";
import { Check, CircleDashed, ListChecks } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/field";
import { EmptyState } from "@/components/ui/states";
import {
  getAnswerLabel,
  getTaskAnswerOptions,
  getTaskKind,
  MAX_ANSWER_NOTE,
  TASK_KIND_LABELS,
} from "@/lib/services/taskService";
import type { Task, TaskAnswer, TaskKind } from "@/lib/types";
import { cn } from "@/lib/utils";

const kindTone: Record<TaskKind, "danger" | "caution" | "accent"> = {
  required: "danger",
  recommended: "caution",
  question: "accent",
};

const KIND_RANK: Record<TaskKind, number> = {
  required: 0,
  question: 1,
  recommended: 2,
};

type TaskSort = "kind" | "open" | "done";

const SORTS: Array<{ id: TaskSort; label: string }> = [
  { id: "kind", label: "По типу" },
  { id: "open", label: "Сначала открытые" },
  { id: "done", label: "Сначала сделанные" },
];

export function WeekTasksCard({
  week,
  rangeLabel,
  tasks,
  overdueTasks,
  completedIds,
  answers,
  notes,
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
  notes: Record<string, string | undefined>;
  onComplete: (taskId: string) => void;
  onAnswer: (taskId: string, answer: TaskAnswer, note?: string) => void;
  onUndo: (taskId: string) => void;
}) {
  const [sort, setSort] = useState<TaskSort>("kind");
  const required = tasks.filter((task) => getTaskKind(task) === "required");
  const requiredDone = required.filter((task) => completedIds.has(task.id)).length;
  const sortedTasks = useMemo(
    () => sortWeekTasks(tasks, completedIds, sort),
    [tasks, completedIds, sort],
  );

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

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold sm:text-2xl">Шаги этой недели</h2>
          <p className="mt-1.5 text-[15px] leading-relaxed text-muted">
            Обязательные лучше закрыть на этой неделе. Остальное — когда получится.
          </p>
        </div>
        {tasks.length > 1 ? (
          <div className="flex flex-wrap gap-1.5">
            {SORTS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setSort(item.id)}
                className={cn(
                  "rounded-full px-3 py-1.5 text-[13px] font-medium transition-colors",
                  item.id === sort
                    ? "bg-accent-soft text-accent-strong"
                    : "bg-surface-muted text-muted ring-1 ring-inset ring-line hover:text-foreground",
                )}
              >
                {item.label}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      {overdueTasks.length > 0 && (
        <div className="mt-5">
          <p className="text-[13px] font-medium text-warning">Обязательное с прошлой недели</p>
          <div className="mt-2 grid grid-cols-1 gap-2 md:grid-cols-2 md:items-stretch">
            {overdueTasks.map((task) => (
              <WeekTaskRow
                key={task.id}
                task={task}
                completed={completedIds.has(task.id)}
                answer={answers[task.id]}
                note={notes[task.id]}
                overdue
                onComplete={() => onComplete(task.id)}
                onAnswer={(value, note) => onAnswer(task.id, value, note)}
                onUndo={() => onUndo(task.id)}
              />
            ))}
          </div>
        </div>
      )}

      <div className="mt-5">
        {sortedTasks.length === 0 ? (
          <EmptyState
            icon={<CircleDashed className="size-5" />}
            title="На эту неделю шагов пока нет"
            description="Наставник добавит их в панели — тогда они появятся здесь."
          />
        ) : (
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2 md:items-stretch">
            {sortedTasks.map((task) => (
              <WeekTaskRow
                key={task.id}
                task={task}
                completed={completedIds.has(task.id)}
                answer={answers[task.id]}
                note={notes[task.id]}
                onComplete={() => onComplete(task.id)}
                onAnswer={(value, note) => onAnswer(task.id, value, note)}
                onUndo={() => onUndo(task.id)}
              />
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}

function sortWeekTasks(tasks: Task[], completedIds: Set<string>, sort: TaskSort): Task[] {
  return [...tasks].sort((left, right) => {
    const leftDone = completedIds.has(left.id) ? 1 : 0;
    const rightDone = completedIds.has(right.id) ? 1 : 0;
    const kindDiff = KIND_RANK[getTaskKind(left)] - KIND_RANK[getTaskKind(right)];

    if (sort === "open" && leftDone !== rightDone) return leftDone - rightDone;
    if (sort === "done" && leftDone !== rightDone) return rightDone - leftDone;
    if (kindDiff !== 0) return kindDiff;
    return left.title.localeCompare(right.title, "ru");
  });
}

function WeekTaskRow({
  task,
  completed,
  answer,
  note,
  overdue = false,
  onComplete,
  onAnswer,
  onUndo,
}: {
  task: Task;
  completed: boolean;
  answer?: TaskAnswer;
  note?: string;
  overdue?: boolean;
  onComplete: () => void;
  onAnswer: (answer: TaskAnswer, note?: string) => void;
  onUndo: () => void;
}) {
  const kind = getTaskKind(task);
  const [draft, setDraft] = useState(note ?? "");
  const savedNote = note?.trim();

  return (
    <div
      className={cn(
        "flex h-full min-w-0 flex-col overflow-hidden rounded-2xl px-4 py-3.5 ring-1 ring-inset",
        completed
          ? "bg-success-soft/60 ring-success/20"
          : overdue
            ? "bg-warning-soft/50 ring-warning/20"
            : "bg-surface-muted ring-line",
      )}
    >
      <div className="flex min-h-0 flex-1 gap-3">
        <span
          className={cn(
            "mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg",
            completed ? "bg-success text-white" : "bg-surface text-muted",
          )}
        >
          {completed ? <Check className="size-4" /> : <CircleDashed className="size-4" />}
        </span>
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={kindTone[kind]}>{TASK_KIND_LABELS[kind]}</Badge>
            {getAnswerLabel(answer, task) && (
              <Badge tone="success">{getAnswerLabel(answer, task)}</Badge>
            )}
          </div>
          <p className={cn("mt-2 font-semibold break-all [overflow-wrap:anywhere]", completed && "text-success-strong")}>{task.title}</p>
          {task.description && (
            <p className="mt-1 text-sm leading-relaxed break-all text-muted [overflow-wrap:anywhere]">{task.description}</p>
          )}
          {kind === "question" && !completed ? (
            <div className="mt-3">
              <Textarea
                value={draft}
                maxLength={MAX_ANSWER_NOTE}
                rows={3}
                placeholder="Можно коротко написать — наставник увидит это в вопросах недели"
                className="min-h-[4.5rem] px-3 py-2 text-sm"
                onChange={(event) => setDraft(event.target.value)}
              />
            </div>
          ) : null}
          {kind === "question" && completed && savedNote ? (
            <p className="mt-2 text-sm leading-relaxed break-all text-muted [overflow-wrap:anywhere]">
              {savedNote}
            </p>
          ) : null}
          <div className="mt-auto flex min-h-9 flex-wrap items-end gap-2 pt-3">
            {completed ? (
              <Button variant="ghost" size="sm" onClick={onUndo}>
                Изменить ответ
              </Button>
            ) : kind === "question" ? (
              getTaskAnswerOptions(task).map((item) => (
                <Button
                  key={item.id}
                  size="sm"
                  variant={item.needsAttention ? "outline" : "primary"}
                  onClick={() => onAnswer(item.id, draft)}
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
