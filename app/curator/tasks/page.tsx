"use client";

import { useState } from "react";
import { ListChecks, Plus, Trash2 } from "lucide-react";

import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { Field, Input, Textarea } from "@/components/ui/field";
import { EmptyState } from "@/components/ui/states";
import { useToast } from "@/components/ui/toast";
import { addTask, getNextFreeDay, getTasks, removeTask } from "@/lib/services/taskService";
import { useAppStore } from "@/lib/store/app-store";
import { cn } from "@/lib/utils";

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

  const [day, setDay] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (!state) return null;

  const tasks = getTasks(state);
  const nextFreeDay = getNextFreeDay(state);
  const effectiveDay = day === "" ? String(nextFreeDay) : day;

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    const result = addTask(state, {
      day: Number(effectiveDay),
      title,
      description,
    });

    if ("error" in result) {
      setError(result.error);
      return;
    }

    update(() => result.state);
    setError(null);
    setDay("");
    setTitle("");
    setDescription("");
    toast(`Задание на день ${result.task.day} добавлено`);
  };

  const handleRemove = (taskId: string, taskDay: number) => {
    update((current) => removeTask(current, taskId));
    toast(`Задание на день ${taskDay} удалено`, "info");
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Задания"
        subtitle={`Программа группы «${state.group.name}» — ${tasks.length} из ${state.group.duration} дней заполнено.`}
      />

      <div className="grid gap-5 lg:grid-cols-5">
        <Card className="p-5 sm:p-6 lg:col-span-2 lg:sticky lg:top-8 lg:self-start">
          <CardHeader
            icon={<Plus className="size-5" />}
            title="Новое задание"
            description="Один небольшой шаг на день."
          />

          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <Field label="День" htmlFor="task-day" hint={`Свободный день — ${nextFreeDay}`}>
              <Input
                id="task-day"
                type="number"
                min={1}
                max={state.group.duration}
                value={effectiveDay}
                onChange={(event) => setDay(event.target.value)}
                className="max-w-28"
              />
            </Field>

            <Field label="Название" htmlFor="task-title">
              <Input
                id="task-title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Например: составить план на вторую неделю"
                maxLength={120}
              />
            </Field>

            <Field label="Описание" htmlFor="task-description" error={error ?? undefined}>
              <Textarea
                id="task-description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Коротко объясните, что нужно сделать и зачем."
                maxLength={400}
              />
            </Field>

            <Button type="submit" fullWidth disabled={title.trim().length < 3}>
              Добавить задание
            </Button>
          </form>
        </Card>

        <div className="space-y-3 lg:col-span-3">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="text-lg font-semibold">Программа</h2>
            <Badge tone="accent">
              {tasks.length} / {state.group.duration}
            </Badge>
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
            <ol className="space-y-3">
              {tasks.map((task) => {
                const isPast = task.day < state.group.currentDay;
                const isToday = task.day === state.group.currentDay;

                return (
                  <li key={task.id}>
                    <Card
                      tone={isToday ? "accent" : "default"}
                      className="flex items-start gap-4 p-4 sm:p-5"
                    >
                      <span
                        className={cn(
                          "flex size-10 shrink-0 items-center justify-center rounded-xl text-sm font-semibold tabular-nums",
                          isToday
                            ? "bg-accent text-white"
                            : isPast
                              ? "bg-success-soft text-success-strong"
                              : "bg-surface-muted text-muted",
                        )}
                      >
                        {task.day}
                      </span>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-semibold">{task.title}</h3>
                          {isToday && <Badge tone="accent">сегодня</Badge>}
                        </div>
                        {task.description && (
                          <p className="mt-1.5 text-sm leading-relaxed text-muted">
                            {task.description}
                          </p>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemove(task.id, task.day)}
                        aria-label={`Удалить задание на день ${task.day}`}
                        className="flex size-9 shrink-0 items-center justify-center rounded-xl text-subtle transition-colors hover:bg-danger-soft hover:text-danger"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </Card>
                  </li>
                );
              })}
            </ol>
          )}

          {tasks.length < state.group.duration && (
            <EmptyState
              title={`Остальные ${state.group.duration - tasks.length} дней ещё свободны`}
              description="Задания можно добавлять по ходу программы — участники увидят их в свой день."
            />
          )}
        </div>
      </div>
    </div>
  );
}
