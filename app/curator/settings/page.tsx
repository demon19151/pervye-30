"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { KeyRound, LogOut, RefreshCw, RotateCcw, Settings, Target } from "lucide-react";

import { AccountFields } from "@/components/account-fields";
import { InviteCodeCard } from "@/components/invite-code-card";
import { InviteKeyField } from "@/components/invite-key-field";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/page-header";
import { ProgressBar } from "@/components/progress-bar";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { Field, Input, Textarea } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import {
  createGroup,
  createRoom,
  defaultGroupDraft,
  rotateInviteCode,
  signOut,
  switchRole,
  updateWeeklyGoal,
} from "@/lib/services/groupService";
import {
  validateLogin,
  validatePassword,
  validatePasswordConfirm,
} from "@/lib/services/accountService";
import { generateInviteCode } from "@/lib/services/inviteCode";
import { useAppStore } from "@/lib/store/app-store";
import { attachAccount } from "@/lib/supabase/accounts";
import { generateUniqueInviteCode } from "@/lib/supabase/persist";

export default function CuratorSettingsPage() {
  return (
    <AppShell role="curator">
      <CuratorSettings />
    </AppShell>
  );
}

function CuratorSettings() {
  const { state, update, updateAsync, reset } = useAppStore();
  const { toast } = useToast();
  const router = useRouter();

  const [name, setName] = useState(state?.group.name ?? "");
  const [description, setDescription] = useState(state?.group.description ?? "");
  const [duration, setDuration] = useState(String(state?.group.duration ?? 30));
  const [roomName, setRoomName] = useState(defaultGroupDraft.name);
  const [roomDescription, setRoomDescription] = useState(defaultGroupDraft.description);
  const [roomDuration, setRoomDuration] = useState(String(defaultGroupDraft.duration));
  const [roomCode, setRoomCode] = useState(generateInviteCode);
  const [roomLogin, setRoomLogin] = useState("");
  const [roomPassword, setRoomPassword] = useState("");
  const [roomPasswordConfirm, setRoomPasswordConfirm] = useState("");
  const [refreshingCode, setRefreshingCode] = useState(false);
  const [rotating, setRotating] = useState(false);

  const refreshRoomCode = useCallback(async () => {
    setRefreshingCode(true);
    try {
      setRoomCode(await generateUniqueInviteCode());
    } catch {
      setRoomCode(generateInviteCode());
    } finally {
      setRefreshingCode(false);
    }
  }, []);

  useEffect(() => {
    void refreshRoomCode();
  }, [refreshRoomCode]);

  const groupId = state?.group.id;
  const groupName = state?.group.name;
  const groupDescription = state?.group.description;
  const groupDuration = state?.group.duration;

  useEffect(() => {
    if (!groupName) return;
    setName(groupName);
    setDescription(groupDescription ?? "");
    setDuration(String(groupDuration ?? 30));
  }, [groupId, groupName, groupDescription, groupDuration]);

  if (!state) return null;

  const goal = state.group.weeklyGoal;

  const handleSave = (event: React.FormEvent) => {
    event.preventDefault();

    update((current) => createGroup(current, { name, description, duration: Number(duration) }));
    toast("Настройки группы сохранены");
  };

  const handleCreateRoom = async (event: React.FormEvent) => {
    event.preventDefault();

    const problem =
      validateLogin(roomLogin) ??
      validatePassword(roomPassword) ??
      validatePasswordConfirm(roomPassword, roomPasswordConfirm);

    if (problem) {
      toast(problem);
      return;
    }

    try {
      const next = await updateAsync((current) =>
        createRoom(current, {
          name: roomName,
          description: roomDescription,
          duration: Number(roomDuration) || defaultGroupDraft.duration,
          inviteCode: roomCode,
        }),
      );

      if (!next?.session?.userId) {
        throw new Error("Не удалось создать комнату.");
      }

      await attachAccount({
        userId: next.session.userId,
        login: roomLogin,
        password: roomPassword,
      });

      toast("Новая комната и аккаунт созданы");
      setRoomLogin("");
      setRoomPassword("");
      setRoomPasswordConfirm("");
      void refreshRoomCode();
    } catch (cause) {
      toast(cause instanceof Error ? cause.message : "Не удалось создать комнату.");
    }
  };

  const handleRotateCode = async () => {
    setRotating(true);
    try {
      const nextCode = await generateUniqueInviteCode();
      update((current) => rotateInviteCode(current, nextCode));
      toast("Новый ключ готов. Старый больше не работает.");
    } catch {
      toast("Не удалось сгенерировать ключ");
    } finally {
      setRotating(false);
    }
  };

  return (
    <div className="space-y-5">
      <PageHeader title="Настройки" subtitle="Параметры комнаты, ключ приглашения и новые группы." />

      <div className="grid gap-5 lg:grid-cols-5">
        <div className="space-y-5 lg:col-span-3">
        <Card className="p-5 sm:p-6">
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

        <Card className="p-5 sm:p-6">
          <CardHeader
            icon={<KeyRound className="size-5" />}
            title="Новая комната"
            description="Отдельная группа с новым ключом. Текущая комната останется в базе."
          />

          <form onSubmit={handleCreateRoom} className="mt-5 space-y-4">
            <Field label="Название" htmlFor="room-name">
              <Input
                id="room-name"
                value={roomName}
                onChange={(event) => setRoomName(event.target.value)}
                maxLength={80}
              />
            </Field>

            <Field label="Описание" htmlFor="room-description">
              <Textarea
                id="room-description"
                value={roomDescription}
                onChange={(event) => setRoomDescription(event.target.value)}
                maxLength={240}
              />
            </Field>

            <Field label="Длительность" htmlFor="room-duration">
              <div className="flex items-center gap-3">
                <Input
                  id="room-duration"
                  type="number"
                  min={7}
                  max={90}
                  value={roomDuration}
                  onChange={(event) => setRoomDuration(event.target.value)}
                  className="max-w-28"
                />
                <span className="text-sm text-muted">дней</span>
              </div>
            </Field>

            <InviteKeyField
              code={roomCode}
              onRefresh={() => void refreshRoomCode()}
              refreshing={refreshingCode}
            />

            <AccountFields
              login={roomLogin}
              password={roomPassword}
              passwordConfirm={roomPasswordConfirm}
              onLoginChange={setRoomLogin}
              onPasswordChange={setRoomPassword}
              onPasswordConfirmChange={setRoomPasswordConfirm}
            />

            <Button type="submit" disabled={roomName.trim().length < 3}>
              Создать комнату
            </Button>
          </form>
        </Card>
        </div>

        <div className="space-y-5 lg:col-span-2">
          <InviteCodeCard
            code={state.group.inviteCode}
            footer={
              <Button variant="outline" size="sm" onClick={() => void handleRotateCode()} disabled={rotating}>
                <RefreshCw className="size-4" />
                Новый ключ
              </Button>
            }
          />

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
              description="Сброс удаляет все комнаты в базе и возвращает демо-группу."
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
