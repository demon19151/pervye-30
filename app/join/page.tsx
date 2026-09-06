"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { KeyRound, UserPlus } from "lucide-react";

import { AccountFields } from "@/components/account-fields";
import { AuthLayout } from "@/components/layout/auth-layout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { DEMO_INVITE_CODE } from "@/lib/mockData";
import { homeForRole } from "@/lib/navigation";
import {
  accountErrorMessage,
  sanitizeName,
  validateLogin,
  validateName,
  validatePassword,
  validatePasswordConfirm,
} from "@/lib/services/accountService";
import { normalizeInviteCode } from "@/lib/services/inviteCode";
import { useAppStore } from "@/lib/store/app-store";
import { loadAccountState, registerAccount } from "@/lib/supabase/accounts";

export default function JoinPage() {
  const { ready, error: storeError, hydrate } = useAppStore();
  const { toast } = useToast();
  const router = useRouter();

  const [name, setName] = useState("");
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const cleanedName = sanitizeName(name);
    const problem =
      validateName(cleanedName) ??
      validateLogin(login) ??
      validatePassword(password) ??
      validatePasswordConfirm(password, passwordConfirm);

    if (problem) {
      setError(problem);
      return;
    }

    if (!normalizeInviteCode(code)) {
      setError("Введите код группы.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const profile = await registerAccount({
        name: cleanedName,
        login,
        password,
        inviteCode: normalizeInviteCode(code),
        role: "participant",
      });
      hydrate(await loadAccountState(profile));
      toast(`Аккаунт создан, ${profile.name}!`);
      router.push(homeForRole(profile.role));
    } catch (cause) {
      setError(accountErrorMessage(cause));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout>
      <div className="mb-7 text-center">
        <h1 className="text-3xl font-semibold sm:text-4xl">Войти по коду</h1>
        <p className="mt-2.5 text-[15px] text-muted">
          Имя, логин, пароль и код комнаты от куратора.
        </p>
      </div>

      <Card className="p-5 sm:p-7">
        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          <Field label="Имя" htmlFor="join-name">
            <Input
              id="join-name"
              value={name}
              onChange={(event) => setName(sanitizeName(event.target.value))}
              placeholder="Как вас зовут?"
              autoComplete="name"
              maxLength={40}
              autoFocus
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

          <Field
            label="Код группы"
            htmlFor="join-code"
            hint={
              <>
                Для демонстрации используйте код{" "}
                <button
                  type="button"
                  onClick={() => setCode(DEMO_INVITE_CODE)}
                  className="cursor-pointer font-mono font-semibold tracking-wider text-accent transition-colors hover:text-accent-strong"
                >
                  {DEMO_INVITE_CODE}
                </button>
              </>
            }
          >
            <Input
              id="join-code"
              value={code}
              onChange={(event) => setCode(normalizeInviteCode(event.target.value))}
              placeholder="P30WORK"
              maxLength={12}
              className="font-mono tracking-[0.18em] uppercase"
            />
          </Field>

          {(error || storeError) && (
            <p className="rounded-2xl bg-danger-soft px-4 py-3 text-[13px] text-danger" role="alert">
              {error ?? storeError}
            </p>
          )}

          <Button type="submit" size="lg" fullWidth loading={submitting && !error} disabled={!ready}>
            <UserPlus className="size-5" />
            Создать аккаунт
          </Button>
        </form>
      </Card>

      <div className="mt-5 flex items-start gap-3 rounded-2xl bg-surface px-4 py-3.5 ring-1 ring-inset ring-line">
        <KeyRound className="mt-0.5 size-4 shrink-0 text-accent" />
        <p className="text-[13px] leading-relaxed text-muted">
          Уже есть аккаунт?{" "}
          <Link href="/login" className="font-medium text-accent hover:text-accent-strong">
            Войдите
          </Link>
          {" · "}
          <Link href="/create-group" className="font-medium text-accent hover:text-accent-strong">
            или создайте группу
          </Link>
          .
        </p>
      </div>
    </AuthLayout>
  );
}
