"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, CheckCircle2, ListChecks, Sparkles } from "lucide-react";

import { AccountFields } from "@/components/account-fields";
import { InviteCodeCard } from "@/components/invite-code-card";
import { InviteKeyField } from "@/components/invite-key-field";
import { AuthLayout } from "@/components/layout/auth-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { Field, Input, Textarea } from "@/components/ui/field";
import { EmptyState } from "@/components/ui/states";
import { useToast } from "@/components/ui/toast";
import {
  sanitizeName,
  validateLogin,
  validateName,
  validatePassword,
  validatePasswordConfirm,
} from "@/lib/services/accountService";
import { createRoom, defaultGroupDraft } from "@/lib/services/groupService";
import { generateInviteCode } from "@/lib/services/inviteCode";
import { getTasks } from "@/lib/services/taskService";
import { useAppStore } from "@/lib/store/app-store";
import { attachAccount } from "@/lib/supabase/accounts";
import { generateUniqueInviteCode } from "@/lib/supabase/persist";

export default function CreateGroupPage() {
  const { state, ready, updateAsync } = useAppStore();
  const { toast } = useToast();
  const router = useRouter();

  const [name, setName] = useState(defaultGroupDraft.name);
  const [description, setDescription] = useState(defaultGroupDraft.description);
  const [duration, setDuration] = useState(String(defaultGroupDraft.duration));
  const [curatorName, setCuratorName] = useState("");
  const [inviteCode, setInviteCode] = useState(generateInviteCode);
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [refreshingCode, setRefreshingCode] = useState(false);
  const [created, setCreated] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const refreshInviteCode = useCallback(async () => {
    setRefreshingCode(true);
    try {
      setInviteCode(await generateUniqueInviteCode());
    } catch {
      setInviteCode(generateInviteCode());
    } finally {
      setRefreshingCode(false);
    }
  }, []);

  useEffect(() => {
    void refreshInviteCode();
  }, [refreshInviteCode]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const cleanedName = sanitizeName(curatorName);
    const problem =
      validateName(cleanedName) ??
      validateLogin(login) ??
      validatePassword(password) ??
      validatePasswordConfirm(password, passwordConfirm);

    if (problem) {
      setError(problem);
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const next = await updateAsync((current) =>
        createRoom(current, {
          name,
          description,
          duration: Number(duration) || defaultGroupDraft.duration,
          inviteCode,
          curatorName: cleanedName,
        }),
      );

      if (!next?.session?.userId) {
        throw new Error("Не удалось создать комнату.");
      }

      await attachAccount({
        userId: next.session.userId,
        login,
        password,
      });

      setCreated(true);
      toast("Комната и аккаунт созданы");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Не удалось создать комнату.");
    } finally {
      setSubmitting(false);
    }
  };

  const openCuratorPanel = () => {
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
          <h1 className="mt-5 text-3xl font-semibold sm:text-4xl">Комната создана</h1>
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
        <h1 className="text-3xl font-semibold sm:text-4xl">Создать комнату</h1>
        <p className="mt-2.5 text-[15px] text-muted">
          Новая группа со своим ключом. Демо-комната останется на месте.
        </p>
      </div>

      <Card className="p-5 sm:p-7">
        <form onSubmit={handleSubmit} className="space-y-5">
          <Field label="Ваше имя" htmlFor="curator-name">
            <Input
              id="curator-name"
              value={curatorName}
              onChange={(event) => setCuratorName(sanitizeName(event.target.value))}
              placeholder="Как вас зовут?"
              maxLength={40}
              autoComplete="name"
            />
          </Field>

          <AccountFields
            login={login}
            password={password}
            passwordConfirm={passwordConfirm}
            onLoginChange={setLogin}
            onPasswordChange={setPassword}
            onPasswordConfirmChange={setPasswordConfirm}
          />

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

          <InviteKeyField code={inviteCode} onRefresh={() => void refreshInviteCode()} refreshing={refreshingCode} />

          {error && (
            <p className="rounded-2xl bg-danger-soft px-4 py-3 text-[13px] text-danger" role="alert">
              {error}
            </p>
          )}

          <Button
            type="submit"
            size="lg"
            fullWidth
            loading={submitting}
            disabled={!ready || name.trim().length < 3}
          >
            Создать комнату
          </Button>
        </form>
      </Card>
    </AuthLayout>
  );
}
