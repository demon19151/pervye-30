"use client";

import { useState } from "react";
import { ListChecks, Plus, Trash2 } from "lucide-react";

import { KindPicker } from "@/components/create-task-modal";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { Field, Input, Textarea } from "@/components/ui/field";
import { EmptyState } from "@/components/ui/states";
import { useToast } from "@/components/ui/toast";
import {
  addTask,
  getCurrentWeek,
  getTasks,
  getWeekBounds,
  getTaskKind,
  getWeekCount,
  removeTask,
  TASK_KIND_LABELS,
} from "@/lib/services/taskService";
import { useAppStore } from "@/lib/store/app-store";
import type { TaskKind } from "@/lib/types";
import { cn, formatWeekRange } from "@/lib/utils";

export default function CuratorTasksPage() {
  return (
    <AppShell role="curator">
      <CuratorTasks />
    </AppShell>
  );
}

function CuratorTasks() {
  const { state, update } = useAppStore();
  const { toast } = useToast();

  const [week, setWeek] = useState("");
  const [kind, setKind] = useState<TaskKind>("required");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (!state) return null;

  const tasks = getTasks(state);
  const weekCount = getWeekCount(state.group.duration);
  const currentWeek = getCurrentWeek(state);
  const effectiveWeek = week === "" ? String(currentWeek) : week;

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    const result = addTask(state, {
      week: Number(effectiveWeek),
      title,
      description,
      kind,
    });

    if ("error" in result) {
      setError(result.error);
      return;
    }

    update(() => result.state);
    setError(null);
    setWeek("");
    setKind("required");
    setTitle("");
    setDescription("");
    toast(`Задание на неделю ${result.task.week} добавлено`);
  };

  const handleRemove = (taskId: string, taskWeek: number) => {
    update((current) => removeTask(current, taskId));
    toast(`Задание недели ${taskWeek} удалено`, "info");
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Задания"
        subtitle={`Шаги по неделям: ${tasks.length} заданий на ${weekCount} недели. Студент закрывает их в любой день недели.`}
      />

      <div className="grid gap-5 lg:grid-cols-5">
        <Card className="p-5 sm:p-6 lg:col-span-2 lg:sticky lg:top-8 lg:self-start">
          <CardHeader
            icon={<Plus className="size-5" />}
            title="Новое задание"
            description="Привяжите шаг к неделе и выберите тип: обязательно, рекомендуем, вопрос или статус."
          />

          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <Field label="Неделя" htmlFor="task-week" hint={`Сейчас идёт неделя ${currentWeek}`}>
              <Input
                id="task-week"
                type="number"
                min={1}
                max={weekCount}
                value={effectiveWeek}
                onChange={(event) => setWeek(event.target.value)}
                className="max-w-28"
              />
            </Field>

            <Field label="Тип">
              <KindPicker value={kind} onChange={setKind} />
            </Field>

            <Field label="Название" htmlFor="task-title">
              <Input
                id="task-title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Например: познакомиться с куратором"
                maxLength={120}
              />
            </Field>

            <Field label="Когда сделано" htmlFor="task-description" error={error ?? undefined}>
              <Textarea
                id="task-description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Сделано, когда студент понимает, к кому обращаться."
                maxLength={400}
              />
            </Field>

            <Button type="submit" fullWidth disabled={title.trim().length < 3}>
              Добавить задание
            </Button>
          </form>
        </Card>

        <div className="space-y-5 lg:col-span-3">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="text-lg font-semibold">Программа</h2>
            <Badge tone="accent">{tasks.length} шагов</Badge>
          </div>

          {tasks.length === 0 ? (
            <Card className="p-6">
              <EmptyState
                icon={<ListChecks className="size-5" />}
                title="Заданий пока нет"
                description="Добавьте первое задание — оно сразу появится у участников."
              />
            </Card>
          ) : (
            Array.from({ length: weekCount }, (_, index) => index + 1).map((weekNumber) => {
              const weekTasks = tasks.filter((task) => task.week === weekNumber);
              const bounds = getWeekBounds(weekNumber, state.group.duration);
              const range = formatWeekRange(
                state.group.programStartDate,
                bounds.start,
                bounds.end,
              );
              const isCurrent = weekNumber === currentWeek;

              return (
                <section key={weekNumber} className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold">Неделя {weekNumber}</h3>
                    {range && <Badge tone="neutral">{range}</Badge>}
                    {isCurrent && <Badge tone="accent">сейчас</Badge>}
                    <span className="text-[13px] text-muted">{weekTasks.length} шагов</span>
                  </div>

                  {weekTasks.length === 0 ? (
                    <EmptyState
                      title="На эту неделю шагов нет"
                      description="Можно оставить пустой или добавить задание слева."
                    />
                  ) : (
                    <ol className="space-y-3">
                      {weekTasks.map((task) => (
                        <li key={task.id}>
                          <Card
                            tone={isCurrent ? "accent" : "default"}
                            className="flex items-start gap-4 p-4 sm:p-5"
                          >
                            <span
                              className={cn(
                                "flex size-10 shrink-0 items-center justify-center rounded-xl text-sm font-semibold tabular-nums",
                                isCurrent
                                  ? "bg-accent text-white"
                                  : "bg-surface-muted text-muted",
                              )}
                            >
                              {task.week}
                            </span>

                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <h3 className="font-semibold">{task.title}</h3>
                                <Badge tone="neutral">{TASK_KIND_LABELS[getTaskKind(task)]}</Badge>
                              </div>
                              {task.description && (
                                <p className="mt-1.5 text-sm leading-relaxed text-muted">
                                  {task.description}
                                </p>
                              )}
                            </div>

                            <button
                              type="button"
                              onClick={() => handleRemove(task.id, task.week)}
                              aria-label={`Удалить задание «${task.title}»`}
                              className="flex size-9 shrink-0 items-center justify-center rounded-xl text-subtle transition-colors hover:bg-danger-soft hover:text-danger"
                            >
                              <Trash2 className="size-4" />
                            </button>
                          </Card>
                        </li>
                      ))}
                    </ol>
                  )}
                </section>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
