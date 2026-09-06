"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogIn } from "lucide-react";

import { AuthLayout } from "@/components/layout/auth-layout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { DEMO_ACCOUNTS } from "@/lib/demoAccounts";
import { homeForRole } from "@/lib/navigation";
import { cn } from "@/lib/utils";
import {
  accountErrorMessage,
  sanitizeLogin,
  validateLogin,
  validatePassword,
} from "@/lib/services/accountService";
import { useAppStore } from "@/lib/store/app-store";
import { loadAccountState, signInAccount } from "@/lib/supabase/accounts";

export default function LoginPage() {
  const { ready, error: storeError, hydrate } = useAppStore();
  const { toast } = useToast();
  const router = useRouter();

  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const problem = validateLogin(login) ?? validatePassword(password);
    if (problem) {
      setError(problem);
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const profile = await signInAccount({ login, password });
      hydrate(await loadAccountState(profile));
      toast(`С возвращением, ${profile.name}!`);
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
        <h1 className="text-3xl font-semibold sm:text-4xl">Войти в аккаунт</h1>
        <p className="mt-2.5 text-[15px] text-muted">Логин и пароль, которые вы задали при регистрации.</p>
      </div>

      <Card className="p-5 sm:p-7">
        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          <div className="flex flex-wrap gap-1.5">
            {DEMO_ACCOUNTS.map((account) => (
              <button
                key={account.login}
                type="button"
                onClick={() => {
                  setLogin(account.login);
                  setPassword(account.password);
                  setError(null);
                }}
                className={cn(
                  "cursor-pointer rounded-full px-2.5 py-1 text-xs font-medium transition-colors",
                  login === account.login
                    ? "bg-accent-soft text-accent-strong"
                    : "bg-surface-muted text-muted ring-1 ring-inset ring-line hover:text-foreground",
                )}
              >
                {account.name}
              </button>
            ))}
          </div>
          <p className="text-[13px] text-muted">Нажмите имя — логин и пароль подставятся сами.</p>

          <Field label="Логин" htmlFor="login-username">
            <Input
              id="login-username"
              value={login}
              onChange={(event) => setLogin(sanitizeLogin(event.target.value))}
              placeholder="olga_k"
              autoComplete="username"
              maxLength={24}
              autoFocus
            />
          </Field>

          <Field label="Пароль" htmlFor="login-password">
            <Input
              id="login-password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              maxLength={72}
            />
          </Field>

          {(error || storeError) && (
            <p className="rounded-2xl bg-danger-soft px-4 py-3 text-[13px] text-danger" role="alert">
              {error ?? storeError}
            </p>
          )}

          <Button type="submit" size="lg" fullWidth loading={submitting && !error} disabled={!ready}>
            <LogIn className="size-5" />
            Войти
          </Button>
        </form>
      </Card>

      <p className="mt-5 text-center text-[13px] text-muted">
        Нет аккаунта?{" "}
        <Link href="/join" className="font-medium text-accent hover:text-accent-strong">
          Войдите по коду
        </Link>
      </p>
    </AuthLayout>
  );
}
