"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, LogOut, RotateCcw, UsersRound } from "lucide-react";

import { AvatarPicker } from "@/components/avatar-picker";
import { DeleteAccountCard } from "@/components/delete-account-card";
import { InviteCodeCard } from "@/components/invite-code-card";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/page-header";
import { PasswordChangeCard } from "@/components/password-change-card";
import { ProgressBar } from "@/components/progress-bar";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import {
  accountErrorMessage,
  sanitizeName,
  validateName,
} from "@/lib/services/accountService";
import {
  getParticipants,
  getParticipantDay,
  isDemoGroup,
  isEnrollmentOpen,
  removeParticipant,
  setCurrentUser,
  signOut,
  switchRole,
  updateCurrentUserProfile,
} from "@/lib/services/groupService";
import {
  getParticipantStats,
  getParticipantWeekRequiredProgress,
  getParticipantWeekStepAnswers,
} from "@/lib/services/statsService";
import { getCurrentWeek } from "@/lib/services/taskService";
import { useAppStore } from "@/lib/store/app-store";
import { getAccountLogin } from "@/lib/supabase/accounts";
import { cn, pluralize } from "@/lib/utils";

export default function ProfilePage() {
  return (
    <AppShell role="participant">
      <Profile />
    </AppShell>
  );
}

function Profile() {
  const { state, currentUser, update, updateAsync, reset } = useAppStore();
  const { toast } = useToast();
  const router = useRouter();

  const [name, setName] = useState(currentUser?.name ?? "");
  const [avatar, setAvatar] = useState(currentUser?.avatar ?? "🙂");
  const [nameError, setNameError] = useState<string | null>(null);
  const [login, setLogin] = useState<string | null>(null);

  const userId = currentUser?.id;
  const userName = currentUser?.name;
  const userAvatar = currentUser?.avatar;

  useEffect(() => {
    if (!userName) return;
    setName(userName);
    setAvatar(userAvatar ?? "🙂");
  }, [userId, userName, userAvatar]);

  useEffect(() => {
    if (!userId) return;
    void getAccountLogin(userId)
      .then(setLogin)
      .catch(() => setLogin(null));
  }, [userId]);

  if (!state || !currentUser) return null;

  const demo = isDemoGroup(state.group);
  const stats = getParticipantStats(state, currentUser.id);
  const participants = getParticipants(state);
  const day = getParticipantDay(state, currentUser.id);
  const week = getCurrentWeek(state);
  const required = getParticipantWeekRequiredProgress(state, currentUser.id, week);
  const questions = getParticipantWeekStepAnswers(state, currentUser.id, week);
  const unanswered = questions.filter((item) => !item.completed).length;

  const handleSaveProfile = (event: React.FormEvent) => {
    event.preventDefault();
    const cleaned = sanitizeName(name);
    const problem = validateName(cleaned);
    if (problem) {
      setNameError(problem);
      return;
    }
    setNameError(null);
    update((current) => updateCurrentUserProfile(current, { name: cleaned, avatar }));
    toast("Профиль сохранён");
  };

  const handleDeleteAccount = async () => {
    try {
      await updateAsync((current) => removeParticipant(current, currentUser.id));
      toast("Аккаунт удалён");
      router.push("/");
    } catch (cause) {
      toast(accountErrorMessage(cause));
    }
  };

  return (
    <div className="space-y-5">
      <PageHeader title="Профиль" subtitle="Кто вы в этой группе и как идут дела." />

      <Card className="p-5 sm:p-6">
        <CardHeader title="Мой прогресс" description={`Неделя ${week} программы.`} />
        {stats ? (
          <ProgressBar
            value={stats.progress}
            label="Выполнение программы"
            hint={`${stats.progress}%`}
            className="mt-5"
          />
        ) : null}
        <dl className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
          <ProgressStat
            label="День программы"
            value={`${day} из ${state.group.duration}`}
          />
          <ProgressStat
            label="Обязательные на этой неделе"
            value={required.total === 0 ? "нет шагов" : `${required.done} из ${required.total}`}
          />
          <ProgressStat
            label="Вопросы без ответа"
            value={
              questions.length === 0
                ? "нет вопросов"
                : `${unanswered} ${pluralize(unanswered, "вопрос", "вопроса", "вопросов")}`
            }
          />
        </dl>
      </Card>

      <div className="grid gap-5 md:grid-cols-2 md:items-stretch">
        <Card className="flex h-full flex-col p-5 sm:p-6">
          <form onSubmit={handleSaveProfile} className="flex min-h-0 flex-1 flex-col space-y-5">
            <div className="flex items-center gap-4">
              <Avatar name={name || currentUser.name} emoji={avatar} size="lg" />
              <div className="min-w-0 flex-1">
                <p className="text-xl font-semibold">{name || currentUser.name}</p>
                <div className="mt-1.5 flex flex-wrap items-center gap-2">
                  <Badge tone="accent">Участник</Badge>
                  <span className="text-[13px] text-muted">{state.group.name}</span>
                </div>
              </div>
            </div>

            <Field label="Аватар">
              <AvatarPicker value={avatar} onChange={setAvatar} />
            </Field>

            <Field label="Имя" htmlFor="profile-name" error={nameError ?? undefined}>
              <Input
                id="profile-name"
                value={name}
                onChange={(event) => setName(sanitizeName(event.target.value))}
                maxLength={40}
              />
            </Field>

            <Button type="submit" className="mt-auto self-start">
              Сохранить
            </Button>
          </form>
        </Card>

        {userId ? <PasswordChangeCard userId={userId} hasLogin={Boolean(login)} className="h-full" /> : null}
      </div>

      {demo ? (
        <Card className="p-5 sm:p-6">
          <CardHeader
            icon={<UsersRound className="size-5" />}
            title="Демонстрационный режим"
            description="Посмотрите приложение глазами другого участника или наставника."
          />

          <div className="mt-5 space-y-4">
            <div className="space-y-2">
              <p className="text-[13px] font-medium text-muted">Смотреть как участник</p>
              <div className="flex flex-wrap gap-2">
                {participants.map((participant) => (
                  <button
                    key={participant.id}
                    type="button"
                    onClick={() => {
                      update((current) => setCurrentUser(current, participant.id));
                      toast(`Теперь вы смотрите как ${participant.name}`, "info");
                    }}
                    className={cn(
                      "rounded-full px-3 py-1.5 text-[13px] font-medium transition-colors",
                      participant.id === currentUser.id
                        ? "bg-accent text-white"
                        : "bg-surface-muted text-muted ring-1 ring-inset ring-line hover:text-foreground",
                    )}
                  >
                    {participant.avatar} {participant.name}
                  </button>
                ))}
              </div>
            </div>

            <Button
              variant="outline"
              fullWidth
              onClick={() => {
                update((current) => switchRole(current, "curator"));
                router.push("/curator");
              }}
            >
              Открыть панель наставника
              <ArrowRight className="size-4" />
            </Button>
          </div>
        </Card>
      ) : null}

      <InviteCodeCard
        code={state.group.inviteCode}
        description={
          isEnrollmentOpen(state.group)
            ? "Код группы, по которому подключаются участники."
            : "Набор закрыт. Новые участники по этому коду войти не могут."
        }
      />

      <DeleteAccountCard role="participant" onConfirm={handleDeleteAccount} />

      <div className="flex flex-col gap-2 sm:flex-row">
        {demo ? (
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
  );
}

function ProgressStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-surface-muted px-3 py-3">
      <dt className="text-[12px] text-subtle">{label}</dt>
      <dd className="mt-1 text-sm font-semibold">{value}</dd>
    </div>
  );
}
