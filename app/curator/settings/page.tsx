"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Archive, CalendarDays, LogOut, RefreshCw, RotateCcw, Settings, UsersRound } from "lucide-react";

import { DeleteAccountCard } from "@/components/delete-account-card";
import { InviteCodeCard } from "@/components/invite-code-card";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/page-header";
import { PasswordChangeCard } from "@/components/password-change-card";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { Field, Input, Textarea } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { accountErrorMessage } from "@/lib/services/accountService";
import {
  archiveGroup,
  createGroup,
  isDemoGroup,
  isEnrollmentOpen,
  isGroupArchived,
  removeParticipant,
  rotateInviteCode,
  setEnrollmentOpen,
  setProgramWeek,
  signOut,
  switchRole,
  unarchiveGroup,
} from "@/lib/services/groupService";
import { getCurrentWeek, getWeekBounds, getWeekCount } from "@/lib/services/taskService";
import { useAppStore } from "@/lib/store/app-store";
import { getAccountLogin } from "@/lib/supabase/accounts";
import { deleteRemoteGroup, fetchState, generateUniqueInviteCode } from "@/lib/supabase/persist";
import { cn, formatWeekRange, todayIsoDate } from "@/lib/utils";

export default function CuratorSettingsPage() {
  return (
    <AppShell role="curator">
      <CuratorSettings />
    </AppShell>
  );
}

function CuratorSettings() {
  const { state, currentUser, update, hydrate, reset } = useAppStore();
  const { toast } = useToast();
  const router = useRouter();

  const [name, setName] = useState(state?.group.name ?? "");
  const [description, setDescription] = useState(state?.group.description ?? "");
  const [duration, setDuration] = useState(String(state?.group.duration ?? 30));
  const [startDate, setStartDate] = useState(state?.group.programStartDate ?? todayIsoDate());
  const [rotating, setRotating] = useState(false);
  const [login, setLogin] = useState<string | null>(null);
  const [removeId, setRemoveId] = useState<string | null>(null);

  const groupId = state?.group.id;
  const groupName = state?.group.name;
  const groupDescription = state?.group.description;
  const groupDuration = state?.group.duration;
  const groupStart = state?.group.programStartDate;
  const userId = currentUser?.id;

  useEffect(() => {
    if (!groupName) return;
    setName(groupName);
    setDescription(groupDescription ?? "");
    setDuration(String(groupDuration ?? 30));
    setStartDate(groupStart ?? todayIsoDate());
  }, [groupId, groupName, groupDescription, groupDuration, groupStart]);

  useEffect(() => {
    if (!userId) return;
    void getAccountLogin(userId)
      .then(setLogin)
      .catch(() => setLogin(null));
  }, [userId]);

  if (!state || !currentUser) return null;

  const demo = isDemoGroup(state.group);
  const archived = isGroupArchived(state.group);
  const enrollmentOpen = isEnrollmentOpen(state.group);
  const participants = state.users.filter((user) => user.role === "participant");
  const removeTarget = participants.find((user) => user.id === removeId);
  const weekCount = getWeekCount(state.group.duration);
  const currentWeek = getCurrentWeek(state);
  const weekBounds = getWeekBounds(currentWeek, state.group.duration);
  const weekRange = formatWeekRange(
    state.group.programStartDate,
    weekBounds.start,
    weekBounds.end,
  );

  const handleSave = (event: React.FormEvent) => {
    event.preventDefault();
    update((current) =>
      createGroup(current, {
        name,
        description,
        duration: Number(duration),
        programStartDate: startDate,
      }),
    );
    toast("Настройки группы сохранены");
  };

  const handleWeekChange = (week: number) => {
    if (week === currentWeek) return;
    update((current) => setProgramWeek(current, week));
    toast(`Сейчас неделя ${week}`);
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

  const handleRemove = async () => {
    if (!removeId) return;
    update((current) => removeParticipant(current, removeId));
    setRemoveId(null);
    toast("Участник убран из комнаты");
  };

  const handleDeleteAccount = async () => {
    try {
      await deleteRemoteGroup(state.group.id);
      const next = await fetchState();
      hydrate({ ...next, session: null });
      toast("Аккаунт и комната удалены");
      router.push("/");
    } catch (cause) {
      toast(accountErrorMessage(cause));
    }
  };

  return (
    <div className="space-y-5">
      <PageHeader title="Настройки" subtitle="Параметры комнаты, набор участников и аккаунт наставника." />

      <div className="grid gap-5 lg:grid-cols-5">
        <div className="space-y-5 lg:col-span-3">
          <Card className="p-5 sm:p-6">
            <CardHeader
              icon={<Settings className="size-5" />}
              title="Группа"
              description="Название, описание и дата старта видят все участники."
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
                label="Дата старта"
                htmlFor="settings-start"
                hint="День 1 программы. От неё считаются недели и календарь мероприятий."
              >
                <Input
                  id="settings-start"
                  type="date"
                  value={startDate}
                  onChange={(event) => setStartDate(event.target.value)}
                  className="max-w-52"
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
              icon={<UsersRound className="size-5" />}
              title="Состав комнаты"
              description="Убрать человека — удалятся его аккаунт и ответы."
            />
            {participants.length === 0 ? (
              <p className="mt-5 text-sm text-muted">Пока никого нет. Когда войдут по ключу, список появится здесь.</p>
            ) : (
              <ul className="mt-5 space-y-2">
                {participants.map((user) => (
                  <li
                    key={user.id}
                    className="flex items-center gap-3 rounded-2xl bg-surface-muted px-3 py-2.5 ring-1 ring-inset ring-line"
                  >
                    <Avatar name={user.name} emoji={user.avatar} size="sm" />
                    <p className="min-w-0 flex-1 truncate text-sm font-medium">{user.name}</p>
                    <Button variant="ghost" size="sm" onClick={() => setRemoveId(user.id)}>
                      Убрать
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {userId ? <PasswordChangeCard userId={userId} hasLogin={Boolean(login)} /> : null}

          <Card className="p-5 sm:p-6">
            <CardHeader
              icon={<Archive className="size-5" />}
              title={archived ? "Программа завершена" : "Завершить программу"}
              description={
                archived
                  ? "Комната сохранена, набор закрыт. Можно снова открыть, если завершили рано."
                  : "Комната останется со всеми данными. Новые люди по ключу войти не смогут."
              }
            />
            <Button
              className="mt-5"
              variant={archived ? "outline" : "warning"}
              onClick={() => {
                update((current) => (archived ? unarchiveGroup(current) : archiveGroup(current)));
                toast(archived ? "Программа снова открыта" : "Программа завершена. Комната сохранена.");
              }}
            >
              {archived ? "Возобновить программу" : "Завершить программу"}
            </Button>
          </Card>

          <DeleteAccountCard
            role="curator"
            locked={demo}
            lockHint="Демо-комнату нельзя удалить. Сбросьте демо-данные, если нужна чистая копия."
            onConfirm={handleDeleteAccount}
          />
        </div>

        <div className="space-y-5 lg:col-span-2">
          <InviteCodeCard
            code={state.group.inviteCode}
            description={
              enrollmentOpen
                ? "Отправьте код участникам — по нему они войдут в группу."
                : "Набор закрыт. По этому ключу новые люди войти не могут."
            }
            footer={
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (archived) return;
                    update((current) => setEnrollmentOpen(current, !enrollmentOpen));
                    toast(enrollmentOpen ? "Набор закрыт" : "Набор снова открыт");
                  }}
                  disabled={archived}
                >
                  {enrollmentOpen ? "Закрыть набор" : "Открыть набор"}
                </Button>
                <Button variant="outline" size="sm" onClick={() => void handleRotateCode()} disabled={rotating}>
                  <RefreshCw className="size-4" />
                  Новый ключ
                </Button>
              </>
            }
          />

          <Card className="p-5 sm:p-6">
            <CardHeader
              icon={<CalendarDays className="size-5" />}
              title="Неделя программы"
              description={`Сейчас неделя ${currentWeek}: дни ${weekBounds.start}–${weekBounds.end}${
                weekRange ? `. ${weekRange}` : ""
              }`}
            />

            <div className="mt-5 grid grid-cols-2 gap-1.5 sm:grid-cols-4 lg:grid-cols-2">
              {Array.from({ length: weekCount }, (_, index) => index + 1).map((week) => (
                <button
                  key={week}
                  type="button"
                  onClick={() => handleWeekChange(week)}
                  className={cn(
                    "rounded-xl px-3 py-2 text-[13px] font-medium transition-colors",
                    week === currentWeek
                      ? "bg-accent text-white"
                      : "bg-surface-muted text-muted ring-1 ring-inset ring-line hover:text-foreground",
                  )}
                >
                  Неделя {week}
                </button>
              ))}
            </div>
          </Card>

          {demo ? (
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
              </div>
            </Card>
          ) : null}

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
      </div>

      <Modal
        open={Boolean(removeTarget)}
        onClose={() => setRemoveId(null)}
        title={removeTarget ? `Убрать ${removeTarget.name}?` : "Убрать участника"}
        description="Аккаунт, ответы на шаги и переписка этого человека удалятся из комнаты."
        footer={
          <>
            <Button variant="ghost" onClick={() => setRemoveId(null)}>
              Отмена
            </Button>
            <Button variant="danger" onClick={() => void handleRemove()}>
              Убрать
            </Button>
          </>
        }
      />
    </div>
  );
}
