"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, RotateCcw, Settings, Target } from "lucide-react";

import { InviteCodeCard } from "@/components/invite-code-card";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/page-header";
import { ProgressBar } from "@/components/progress-bar";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { Field, Input, Textarea } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { createGroup, signOut, switchRole, updateWeeklyGoal } from "@/lib/services/groupService";
import { useAppStore } from "@/lib/store/app-store";

export default function CuratorSettingsPage() {
  return (
    <AppShell role="curator">
      <CuratorSettings />
    </AppShell>
  );
}

function CuratorSettings() {
  const { state, update, reset } = useAppStore();
  const { toast } = useToast();
  const router = useRouter();

  const [name, setName] = useState(state?.group.name ?? "");
  const [description, setDescription] = useState(state?.group.description ?? "");
  const [duration, setDuration] = useState(String(state?.group.duration ?? 30));

  if (!state) return null;

  const goal = state.group.weeklyGoal;

  const handleSave = (event: React.FormEvent) => {
    event.preventDefault();

    update((current) => createGroup(current, { name, description, duration: Number(duration) }));
    toast("Настройки группы сохранены");
  };

  return (
    <div className="space-y-5">
      <PageHeader title="Настройки" subtitle="Параметры группы и демонстрационные данные." />

      <div className="grid gap-5 lg:grid-cols-5">
        <Card className="p-5 sm:p-6 lg:col-span-3">
          <CardHeader
            icon={<Settings className="size-5" />}
            title="Группа"
            description="Название и описание видят все участники."
          />

          <form onSubmit={handleSave} className="mt-5 space-y-4">
            <Field label="Название группы" htmlFor="settings-name">
              <Input
                id="settings-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                maxLength={80}
              />
            </Field>

            <Field label="Описание" htmlFor="settings-description">
              <Textarea
                id="settings-description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                maxLength={240}
              />
            </Field>

            <Field
              label="Длительность"
              htmlFor="settings-duration"
              hint={`Сейчас идёт день ${state.group.currentDay} — длительность нельзя сделать меньше.`}
            >
              <div className="flex items-center gap-3">
                <Input
                  id="settings-duration"
                  type="number"
                  min={state.group.currentDay}
                  max={90}
                  value={duration}
                  onChange={(event) => setDuration(event.target.value)}
                  className="max-w-28"
                />
                <span className="text-sm text-muted">дней</span>
              </div>
            </Field>

            <Button type="submit" disabled={name.trim().length < 3}>
              Сохранить
            </Button>
          </form>
        </Card>

        <div className="space-y-5 lg:col-span-2">
          <InviteCodeCard code={state.group.inviteCode} />

          {goal && (
            <Card className="p-5 sm:p-6">
              <CardHeader
                icon={<Target className="size-5" />}
                title="Цель недели"
                description={goal.title}
              />

              <ProgressBar
                value={(goal.done / goal.target) * 100}
                label="Выполнено"
                hint={`${goal.done} / ${goal.target}`}
                tone={goal.done >= goal.target ? "success" : "accent"}
                className="mt-5"
              />

              <div className="mt-4 flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={goal.done === 0}
                  onClick={() => update((current) => updateWeeklyGoal(current, goal.done - 1))}
                >
                  −1
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={goal.done >= goal.target}
                  onClick={() => update((current) => updateWeeklyGoal(current, goal.done + 1))}
                >
                  +1
                </Button>
              </div>
            </Card>
          )}

          <Card className="p-5 sm:p-6">
            <CardHeader
              title="Демонстрация"
              description="Состояние хранится в localStorage браузера."
            />

            <div className="mt-5 flex flex-col gap-2">
              <Button
                variant="outline"
                fullWidth
                onClick={() => {
                  update((current) => switchRole(current, "participant"));
                  router.push("/participant");
                }}
              >
                Перейти в режим участника
              </Button>
              <Button
                variant="outline"
                fullWidth
                onClick={() => {
                  reset();
                  toast("Демо-данные сброшены");
                  router.push("/");
                }}
              >
                <RotateCcw className="size-4" />
                Сбросить демо-данные
              </Button>
              <Button
                variant="ghost"
                fullWidth
                onClick={() => {
                  update(signOut);
                  router.push("/");
                }}
              >
                <LogOut className="size-4" />
                Выйти
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
