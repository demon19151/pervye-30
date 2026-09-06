import Link from "next/link";
import {
  ArrowRight,
  BellRing,
  CalendarCheck,
  ClipboardList,
  HeartHandshake,
  MessagesSquare,
  Sparkles,
  TrendingUp,
  Users,
} from "lucide-react";

import { Brand } from "@/components/layout/brand";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DEMO_INVITE_CODE } from "@/lib/mockData";

const steps = [
  {
    icon: ClipboardList,
    title: "Получи задание",
    text: "Шаги на неделю, а не на каждый день. Закрой, когда получится.",
  },
  {
    icon: CalendarCheck,
    title: "Отметь свой день",
    text: "Выполни задание и расскажи, как ты себя чувствуешь.",
  },
  {
    icon: Users,
    title: "Будь не один",
    text: "Общайся с группой и получай поддержку куратора.",
  },
];

const participantBenefits = [
  { icon: ClipboardList, text: "Понятный план на весь первый месяц" },
  { icon: Sparkles, text: "Маленькие шаги вместо больших задач" },
  { icon: MessagesSquare, text: "Поддержка группы, которая проходит то же самое" },
  { icon: TrendingUp, text: "Видимый прогресс — заметно, что двигаешься" },
];

const curatorBenefits = [
  { icon: TrendingUp, text: "Контроль прогресса каждого участника" },
  { icon: BellRing, text: "Ненавязчивые сигналы о пропусках" },
  { icon: Users, text: "Вся группа в одном месте" },
  { icon: MessagesSquare, text: "Простая коммуникация без лишних инструментов" },
];

export default function LandingPage() {
  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-30 border-b border-line/70 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Brand />
          <div className="flex items-center gap-2">
            <Link href="/join">
              <Button variant="ghost" size="sm">
                Войти по коду
              </Button>
            </Link>
            <Link href="/create-group" className="hidden sm:block">
              <Button size="sm">Создать группу</Button>
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="hero-glow">
          <div className="mx-auto max-w-6xl px-4 pt-14 pb-16 sm:px-6 sm:pt-20 sm:pb-24 lg:px-8">
            <div className="max-w-2xl">
              <Badge tone="accent">
                <Sparkles className="size-3.5" />
                Первые 30 дней в университете
              </Badge>

              <h1 className="mt-6 text-[2.75rem] leading-[1.05] font-semibold sm:text-6xl">
                Первые 30
              </h1>
              <p className="mt-4 text-xl font-medium text-accent-strong sm:text-2xl">
                Не проходи первый месяц в одиночку.
              </p>
              <p className="mt-4 max-w-xl text-[17px] leading-relaxed text-muted">
                Конкретные шаги на первый месяц, поддержка группы и куратор рядом. Не каждый день
                нужен шаг — только то, что нельзя пропустить.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link href="/create-group" className="sm:w-auto">
                  <Button size="lg" fullWidth className="sm:w-auto sm:min-w-48">
                    Создать группу
                  </Button>
                </Link>
                <Link href="/join" className="sm:w-auto">
                  <Button variant="outline" size="lg" fullWidth className="sm:w-auto sm:min-w-48">
                    Войти по коду
                  </Button>
                </Link>
              </div>

              <p className="mt-5 text-[13px] text-subtle">
                Для демонстрации используйте код{" "}
                <span className="font-mono font-semibold tracking-wider text-accent-strong">
                  {DEMO_INVITE_CODE}
                </span>
              </p>
            </div>

            <HeroPreview />
          </div>
        </section>

        {/* Как это устроено */}
        <section className="border-t border-line/70 bg-surface">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
            <div className="max-w-xl">
              <h2 className="text-3xl font-semibold sm:text-4xl">Как это устроено</h2>
              <p className="mt-3 text-[17px] text-muted">
                Три простых действия — и первый месяц перестаёт быть испытанием в одиночку.
              </p>
            </div>

            <ol className="mt-10 grid gap-4 sm:grid-cols-3 sm:gap-5">
              {steps.map((step, index) => (
                <li key={step.title}>
                  <Card interactive className="h-full p-6">
                    <div className="flex items-center gap-3">
                      <span className="flex size-11 items-center justify-center rounded-2xl bg-accent-soft text-accent-strong">
                        <step.icon className="size-5" />
                      </span>
                      <span className="text-sm font-semibold text-subtle tabular-nums">
                        0{index + 1}
                      </span>
                    </div>
                    <h3 className="mt-5 text-lg font-semibold">{step.title}</h3>
                    <p className="mt-2 text-[15px] leading-relaxed text-muted">{step.text}</p>
                  </Card>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Преимущества */}
        <section>
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
            <h2 className="text-3xl font-semibold sm:text-4xl">Что получают обе стороны</h2>

            <div className="mt-10 grid gap-5 lg:grid-cols-2">
              <BenefitCard
                title="Для участника"
                subtitle="Спокойный вход в новое, без ощущения, что ты один."
                items={participantBenefits}
                tone="accent"
              />
              <BenefitCard
                title="Для куратора"
                subtitle="Видно, как идут дела, и когда стоит написать первым."
                items={curatorBenefits}
                tone="success"
              />
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="border-t border-line/70 bg-surface">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
            <Card tone="accent" className="p-8 text-center sm:p-14">
              <span className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-surface text-accent">
                <HeartHandshake className="size-6" />
              </span>
              <h2 className="mt-6 text-3xl font-semibold sm:text-4xl">Начать первые 30 дней</h2>
              <p className="mx-auto mt-3 max-w-md text-[17px] text-muted">
                Создайте группу за минуту или присоединитесь к существующей по коду приглашения.
              </p>

              <div className="mx-auto mt-8 flex max-w-md flex-col gap-3 sm:flex-row sm:justify-center">
                <Link href="/create-group" className="sm:w-auto">
                  <Button size="lg" fullWidth className="sm:w-auto sm:min-w-48">
                    Создать группу
                    <ArrowRight className="size-4" />
                  </Button>
                </Link>
                <Link href="/join" className="sm:w-auto">
                  <Button variant="outline" size="lg" fullWidth className="sm:w-auto sm:min-w-40">
                    Войти по коду
                  </Button>
                </Link>
              </div>
            </Card>
          </div>
        </section>
      </main>

      <footer className="border-t border-line/70 bg-surface">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-8 text-[13px] text-subtle sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <Brand />
          <p>Демонстрационный MVP. Данные хранятся локально в браузере.</p>
        </div>
      </footer>
    </div>
  );
}

function BenefitCard({
  title,
  subtitle,
  items,
  tone,
}: {
  title: string;
  subtitle: string;
  items: { icon: typeof Users; text: string }[];
  tone: "accent" | "success";
}) {
  const iconClass =
    tone === "accent" ? "bg-accent-soft text-accent-strong" : "bg-success-soft text-success-strong";

  return (
    <Card className="p-6 sm:p-8">
      <h3 className="text-xl font-semibold">{title}</h3>
      <p className="mt-2 text-[15px] text-muted">{subtitle}</p>

      <ul className="mt-6 space-y-3">
        {items.map((item) => (
          <li key={item.text} className="flex items-start gap-3">
            <span
              className={`flex size-8 shrink-0 items-center justify-center rounded-xl ${iconClass}`}
            >
              <item.icon className="size-4" />
            </span>
            <span className="pt-1.5 text-[15px] leading-snug">{item.text}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}

/** Статичный превью-снимок интерфейса участника — задаёт тон всему лендингу. */
function HeroPreview() {
  return (
    <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <Card className="p-5 sm:p-6">
        <div className="flex items-center justify-between">
          <Badge tone="accent">Задание дня</Badge>
          <span className="text-[13px] text-subtle">Неделя 1 · 28 августа — 3 сентября</span>
        </div>
        <h3 className="mt-4 text-lg font-semibold">Познакомиться с куратором</h3>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          Сделано, когда понимаешь, к кому обращаться, и знаешь, как написать куратору.
        </p>
        <div className="mt-5 h-11 flex items-center justify-center rounded-2xl bg-success-soft text-sm font-medium text-success-strong ring-1 ring-inset ring-success/25">
          Выполнено ✓
        </div>
      </Card>

      <Card className="p-5 sm:p-6">
        <p className="text-sm font-semibold">Как прошёл твой день?</p>
        <div className="mt-4 grid grid-cols-5 gap-1.5">
          {["😞", "🙁", "😐", "🙂", "😄"].map((emoji, index) => (
            <div
              key={emoji}
              className={`grid h-12 place-items-center rounded-xl text-xl ${
                index === 3
                  ? "bg-accent-soft ring-2 ring-inset ring-accent"
                  : "bg-surface-muted ring-1 ring-inset ring-line"
              }`}
            >
              {emoji}
            </div>
          ))}
        </div>
        <p className="mt-4 text-sm font-semibold">Энергия</p>
        <div className="mt-3 flex items-end gap-1.5">
          {[10, 16, 22, 28, 34].map((height, index) => (
            <div
              key={height}
              className={`flex-1 rounded-full ${index === 3 ? "bg-accent" : "bg-accent-ring"}`}
              style={{ height }}
            />
          ))}
        </div>
      </Card>

      <Card className="p-5 sm:p-6 sm:col-span-2 lg:col-span-1">
        <div className="flex items-center gap-2">
          <span className="flex size-9 items-center justify-center rounded-xl bg-success-soft text-success-strong">
            <HeartHandshake className="size-5" />
          </span>
          <p className="text-sm font-semibold">Требуют внимания</p>
        </div>
        <p className="mt-4 text-sm text-muted">
          Сейчас никому не нужна дополнительная поддержка. Сигнал появится по просроченным заданиям
          или если участник отметит в шаге, что нужна помощь.
        </p>
      </Card>
    </div>
  );
}
