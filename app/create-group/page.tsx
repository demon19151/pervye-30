"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, CheckCircle2, ListChecks, Sparkles } from "lucide-react";

import { InviteCodeCard } from "@/components/invite-code-card";
import { AuthLayout } from "@/components/layout/auth-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { Field, Input, Textarea } from "@/components/ui/field";
import { EmptyState } from "@/components/ui/states";
import { useToast } from "@/components/ui/toast";
import { createGroup, defaultGroupDraft, switchRole } from "@/lib/services/groupService";
import { getTasks } from "@/lib/services/taskService";
import { useAppStore } from "@/lib/store/app-store";

export default function CreateGroupPage() {
  const { state, ready, update } = useAppStore();
  const { toast } = useToast();
  const router = useRouter();

  const [name, setName] = useState(defaultGroupDraft.name);
  const [description, setDescription] = useState(defaultGroupDraft.description);
  const [duration, setDuration] = useState(String(defaultGroupDraft.duration));
  const [created, setCreated] = useState(false);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    update((current) =>
      createGroup(current, {
        name,
        description,
        duration: Number(duration) || defaultGroupDraft.duration,
      }),
    );

    setCreated(true);
    toast("Группа создана");
  };

  const openCuratorPanel = () => {
    update((current) => switchRole(current, "curator"));
    router.push("/curator");
  };

  if (created && state) {
    const tasks = getTasks(state);

    return (
      <AuthLayout backHref="/" backLabel="На главную">
        <div className="mb-7 text-center">
          <span className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-success-soft text-success-strong">
            <CheckCircle2 className="size-6" />
          </span>
          <h1 className="mt-5 text-3xl font-semibold sm:text-4xl">Группа создана</h1>
          <p className="mt-2.5 text-[15px] text-muted">
            Осталось передать код участникам — программа уже готова.
          </p>
        </div>

        <div className="space-y-4">
          <Card className="p-5 sm:p-6">
            <Badge tone="accent">
              <Sparkles className="size-3.5" />
              Новая группа
            </Badge>
            <h2 className="mt-4 text-xl font-semibold">{state.group.name}</h2>
            <p className="mt-2 text-[15px] leading-relaxed text-muted">{state.group.description}</p>
            <p className="mt-4 text-[13px] text-subtle">
              Длительность программы — {state.group.duration} дней
            </p>
          </Card>

          <InviteCodeCard code={state.group.inviteCode} />

          <Card className="p-5 sm:p-6">
            <CardHeader
              icon={<ListChecks className="size-5" />}
              title="Программа"
              description={`${tasks.length} заданий уже готово — остальные можно добавить позже.`}
            />

            <ol className="mt-5 space-y-2">
              {tasks.length === 0 ? (
                <EmptyState
                  title="Заданий пока нет"
                  description="Добавьте первое задание в панели куратора."
                />
              ) : (
                tasks.map((task) => (
                  <li
                    key={task.id}
                    className="flex items-start gap-3 rounded-2xl bg-surface-muted px-4 py-3"
                  >
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-surface text-xs font-semibold text-accent-strong tabular-nums">
                      {task.week}
                    </span>
                    <span className="pt-0.5 text-sm leading-snug">{task.title}</span>
                  </li>
                ))
              )}
            </ol>
          </Card>

          <Button size="lg" fullWidth onClick={openCuratorPanel}>
            Перейти в панель куратора
            <ArrowRight className="size-4" />
          </Button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <div className="mb-7 text-center">
        <h1 className="text-3xl font-semibold sm:text-4xl">Создать группу</h1>
        <p className="mt-2.5 text-[15px] text-muted">
          Небольшая группа и понятная программа на первый месяц.
        </p>
      </div>

      <Card className="p-5 sm:p-7">
        <form onSubmit={handleSubmit} className="space-y-5">
          <Field label="Название группы" htmlFor="group-name">
            <Input
              id="group-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Первые 30 дней в университете"
              maxLength={80}
              required
            />
          </Field>

          <Field label="Описание" htmlFor="group-description">
            <Textarea
              id="group-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Для кого эта группа и что в ней происходит."
              maxLength={240}
            />
          </Field>

          <Field label="Длительность" htmlFor="group-duration" hint="Количество дней программы">
            <div className="flex items-center gap-3">
              <Input
                id="group-duration"
                type="number"
                min={7}
                max={90}
                value={duration}
                onChange={(event) => setDuration(event.target.value)}
                className="max-w-28"
              />
              <span className="text-sm text-muted">дней</span>
            </div>
          </Field>

          <Button type="submit" size="lg" fullWidth disabled={!ready || name.trim().length < 3}>
            Создать группу
          </Button>
        </form>
      </Card>
    </AuthLayout>
  );
}
