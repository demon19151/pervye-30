"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogIn } from "lucide-react";

import { AuthLayout } from "@/components/layout/auth-layout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { DEMO_ACCOUNTS, findDemoAccount, type DemoAccount } from "@/lib/demoAccounts";
import { homeForRole } from "@/lib/navigation";
import { cn } from "@/lib/utils";
import {
  accountErrorMessage,
  sanitizeLogin,
  validateLogin,
  validatePassword,
} from "@/lib/services/accountService";
import { useAppStore } from "@/lib/store/app-store";
import { ensureDemoAccounts, loadAccountState, seedDemoAccounts, signInAccount } from "@/lib/supabase/accounts";

export default function LoginPage() {
  const { ready, hydrate } = useAppStore();
  const { toast } = useToast();
  const router = useRouter();

  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [activeDemo, setActiveDemo] = useState<string | null>(null);
  const [demoReady, setDemoReady] = useState(false);
  const requestRef = useRef(0);
  const inFlightRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    void ensureDemoAccounts()
      .catch(() => seedDemoAccounts())
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) setDemoReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const enter = async (nextLogin: string, nextPassword: string, retryDemo = false) => {
    if (inFlightRef.current) return;
    inFlightRef.current = true;
    const requestId = ++requestRef.current;
    setSubmitting(true);
    setError(null);

    try {
      let profile;
      try {
        profile = await signInAccount({ login: nextLogin, password: nextPassword });
      } catch (cause) {
        if (!retryDemo) throw cause;
        await seedDemoAccounts();
        if (requestRef.current !== requestId) return;
        profile = await signInAccount({ login: nextLogin, password: nextPassword });
      }
      if (requestRef.current !== requestId) return;
      hydrate(await loadAccountState(profile));
      if (requestRef.current !== requestId) return;
      toast(`С возвращением, ${profile.name}!`);
      router.push(homeForRole(profile.role));
    } catch (cause) {
      if (requestRef.current !== requestId) return;
      setError(accountErrorMessage(cause));
    } finally {
      if (requestRef.current === requestId) {
        inFlightRef.current = false;
        setSubmitting(false);
      }
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (inFlightRef.current) return;

    const demo = findDemoAccount(login);
    if (demo) {
      setActiveDemo(demo.login);
      await enter(demo.login, demo.password, true);
      return;
    }

    const problem = validateLogin(login) ?? validatePassword(password);
    if (problem) {
      setError(problem);
      return;
    }

    setActiveDemo(null);
    await enter(login, password);
  };

  const handleDemo = (account: DemoAccount) => {
    if (inFlightRef.current) return;
    setActiveDemo(account.login);
    void enter(account.login, account.password, true);
  };

  return (
    <AuthLayout>
      <div className="mb-7 text-center">
        <h1 className="text-3xl font-semibold sm:text-4xl">Войти в аккаунт</h1>
        <p className="mt-2.5 text-[15px] text-muted">Логин и пароль, которые вы задали при регистрации.</p>
      </div>

      <Card className="p-5 sm:p-7">
        <div className="mb-5 space-y-2">
          <div className="flex flex-wrap gap-1.5">
            {DEMO_ACCOUNTS.map((account) => (
              <button
                key={account.login}
                type="button"
                disabled={!ready || !demoReady || submitting}
                onClick={() => handleDemo(account)}
                className={cn(
                  "cursor-pointer rounded-full px-2.5 py-1 text-xs font-medium transition-colors disabled:cursor-wait",
                  activeDemo === account.login
                    ? "bg-accent-soft text-accent-strong"
                    : "bg-surface-muted text-muted ring-1 ring-inset ring-line hover:text-foreground",
                )}
              >
                {account.name}
              </button>
            ))}
          </div>
          <p className="text-[13px] text-muted">Нажмите имя — войдёте сразу, без ввода пароля.</p>
        </div>

        <form onSubmit={(event) => void handleSubmit(event)} className="space-y-5" autoComplete="off" noValidate>
          <Field label="Логин" htmlFor="login-username">
            <Input
              id="login-username"
              value={login}
              onChange={(event) => setLogin(sanitizeLogin(event.target.value))}
              placeholder="olga_k"
              autoComplete="off"
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
              autoComplete="off"
              maxLength={72}
            />
          </Field>

          {error && (
            <p className="rounded-2xl bg-danger-soft px-4 py-3 text-[13px] text-danger" role="alert">
              {error}
            </p>
          )}

          <Button type="submit" size="lg" fullWidth loading={submitting} disabled={!ready || !demoReady}>
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
