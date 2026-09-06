"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { KeyRound, LogIn, UserRound, Users } from "lucide-react";

import { AuthLayout } from "@/components/layout/auth-layout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { DEMO_INVITE_CODE } from "@/lib/mockData";
import { homeForRole } from "@/lib/navigation";
import { joinGroup } from "@/lib/services/groupService";
import { useAppStore } from "@/lib/store/app-store";
import type { UserRole } from "@/lib/types";
import { cn } from "@/lib/utils";

const roles: { value: UserRole; label: string; hint: string; icon: typeof UserRound }[] = [
  {
    value: "participant",
    label: "Участник",
    hint: "Прохожу программу",
    icon: UserRound,
  },
  {
    value: "curator",
    label: "Куратор",
    hint: "Веду группу",
    icon: Users,
  },
];

const demoNames = ["Анна", "Максим", "Ирина", "Дмитрий"];

function sanitizeLettersOnly(value: string) {
  // Строго буквы (кириллица/латиница), без цифр и прочих символов.
  return value.replace(/[^A-Za-zА-Яа-яЁё]/g, "");
}

export default function JoinPage() {
  const { state, ready, error: storeError, update } = useAppStore();
  const { toast } = useToast();
  const router = useRouter();

  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [role, setRole] = useState<UserRole>("participant");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!state) return;

    const cleaned = sanitizeLettersOnly(name);
    if (cleaned.length < 2) {
      setError("Введите имя — минимум 2 буквы.");
      return;
    }

    setSubmitting(true);
    const result = joinGroup(state, { name: cleaned, code, role });

    if ("error" in result) {
      setError(result.error);
      setSubmitting(false);
      return;
    }

    setError(null);
    update(() => result.state);
    toast(`Добро пожаловать, ${result.user.name}!`);
    router.push(homeForRole(result.user.role));
  };

  return (
    <AuthLayout>
      <div className="mb-7 text-center">
        <h1 className="text-3xl font-semibold sm:text-4xl">Войти в группу</h1>
        <p className="mt-2.5 text-[15px] text-muted">
          Введите имя и код приглашения, который дал куратор.
        </p>
      </div>

      <Card className="p-5 sm:p-7">
        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          <Field label="Имя" htmlFor="join-name">
            <Input
              id="join-name"
              value={name}
              onChange={(event) => setName(sanitizeLettersOnly(event.target.value))}
              placeholder="Как вас зовут?"
              autoComplete="name"
              maxLength={40}
              autoFocus
            />
          </Field>

          <div className="flex flex-wrap gap-1.5">
            {demoNames.map((demoName) => (
              <button
                key={demoName}
                type="button"
                onClick={() => setName(demoName)}
                className={cn(
                    "cursor-pointer rounded-full px-2.5 py-1 text-xs font-medium transition-colors",
                  name === demoName
                    ? "bg-accent-soft text-accent-strong"
                    : "bg-surface-muted text-muted ring-1 ring-inset ring-line hover:text-foreground",
                )}
              >
                {demoName}
              </button>
            ))}
          </div>

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
              onChange={(event) => setCode(event.target.value.toUpperCase())}
              placeholder="P30WORK"
              maxLength={12}
              className="font-mono tracking-[0.18em] uppercase"
            />
          </Field>

          <div className="space-y-2">
            <p className="text-sm font-medium">Роль</p>
            <div className="grid grid-cols-2 gap-2.5">
              {roles.map((option) => {
                const active = role === option.value;

                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setRole(option.value)}
                    aria-pressed={active}
                    className={cn(
                      "cursor-pointer flex flex-col items-start gap-1 rounded-2xl p-4 text-left ring-1 ring-inset transition-all duration-200",
                      active
                        ? "bg-accent-soft ring-2 ring-accent"
                        : "bg-surface-muted ring-line hover:bg-accent-soft/60 hover:ring-accent-ring",
                    )}
                  >
                    <option.icon
                      className={cn("size-5", active ? "text-accent" : "text-subtle")}
                    />
                    <span
                      className={cn(
                        "mt-1 text-sm font-semibold",
                        active && "text-accent-strong",
                      )}
                    >
                      {option.label}
                    </span>
                    <span className="text-[12px] text-muted">{option.hint}</span>
                  </button>
                );
              })}
            </div>
          </div>

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

      <div className="mt-5 flex items-start gap-3 rounded-2xl bg-surface px-4 py-3.5 ring-1 ring-inset ring-line">
        <KeyRound className="mt-0.5 size-4 shrink-0 text-accent" />
        <p className="text-[13px] leading-relaxed text-muted">
          Ещё нет группы?{" "}
          <Link href="/create-group" className="font-medium text-accent hover:text-accent-strong">
            Создайте свою
          </Link>{" "}
          — код приглашения появится сразу после создания.
        </p>
      </div>
    </AuthLayout>
  );
}
