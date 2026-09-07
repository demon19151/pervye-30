"use client";

import { useState } from "react";
import { KeyRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import {
  accountErrorMessage,
  validatePassword,
  validatePasswordConfirm,
} from "@/lib/services/accountService";
import { changeAccountPassword } from "@/lib/supabase/accounts";
import { cn } from "@/lib/utils";

export function PasswordChangeCard({
  userId,
  hasLogin,
  className,
}: {
  userId: string;
  hasLogin: boolean;
  className?: string;
}) {
  const { toast } = useToast();
  const [currentPassword, setCurrentPassword] = useState("");
  const [nextPassword, setNextPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const problem =
      validatePassword(nextPassword) ?? validatePasswordConfirm(nextPassword, confirm);
    if (problem) {
      setError(problem);
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await changeAccountPassword({ userId, currentPassword, nextPassword });
      setCurrentPassword("");
      setNextPassword("");
      setConfirm("");
      toast("Пароль обновлён");
    } catch (cause) {
      setError(accountErrorMessage(cause));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className={cn("flex flex-col p-5 sm:p-6", className)}>
      <CardHeader
        icon={<KeyRound className="size-5" />}
        title="Пароль"
        description={
          hasLogin
            ? "Текущий пароль нужен, чтобы задать новый."
            : "Для этой учётки логин ещё не задан — сменить пароль нельзя."
        }
      />

      {hasLogin ? (
        <form onSubmit={(event) => void handleSubmit(event)} className="mt-5 flex min-h-0 flex-1 flex-col space-y-4">
          <Field label="Текущий пароль" htmlFor="current-password">
            <Input
              id="current-password"
              type="password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              autoComplete="current-password"
              maxLength={72}
            />
          </Field>
          <Field label="Новый пароль" htmlFor="next-password" hint="Минимум 6 символов.">
            <Input
              id="next-password"
              type="password"
              value={nextPassword}
              onChange={(event) => setNextPassword(event.target.value)}
              autoComplete="new-password"
              maxLength={72}
            />
          </Field>
          <Field label="Повторите новый пароль" htmlFor="next-password-confirm">
            <Input
              id="next-password-confirm"
              type="password"
              value={confirm}
              onChange={(event) => setConfirm(event.target.value)}
              autoComplete="new-password"
              maxLength={72}
            />
          </Field>
          {error ? (
            <p className="rounded-2xl bg-danger-soft px-4 py-3 text-[13px] text-danger" role="alert">
              {error}
            </p>
          ) : null}
          <Button
            type="submit"
            className="mt-auto self-start"
            loading={saving}
            disabled={!currentPassword || !nextPassword}
          >
            Сменить пароль
          </Button>
        </form>
      ) : null}
    </Card>
  );
}
