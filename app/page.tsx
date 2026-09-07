import Link from "next/link";
import {
  ArrowRight,
  BellRing,
  Bot,
  CalendarDays,
  ClipboardList,
  HeartHandshake,
  KeyRound,
  ListChecks,
  MessageCircleQuestion,
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
    icon: KeyRound,
    title: "Собери группу",
    text: "Наставник создаёт комнату и выдаёт код. Участник входит по коду, логину и паролю.",
  },
  {
    icon: ClipboardList,
    title: "Закрывай шаги недели",
    text: "Обязательные, рекомендуемые и короткие вопросы с кнопками ответа — без ежедневной галочки «настроение».",
  },
  {
    icon: MessageCircleQuestion,
    title: "Спроси, если застрял",
    text: "ИИ-помощник отвечает по базе знаний университета. Наставнику можно написать лично — группа это не увидит.",
  },
];

const nowOnSite = [
  {
    icon: ClipboardList,
    title: "Недельные задания",
    text: "Шаги на неделю: закрыть, ответить кнопкой или отметить, что нужна помощь.",
  },
  {
    icon: Bot,
    title: "ИИ-помощник",
    text: "Во вкладке «Задать вопрос» отвечает про учёбу по локальной базе знаний.",
  },
  {
    icon: MessageCircleQuestion,
    title: "Личные сообщения",
    text: "Студент пишет наставнику напрямую. Наставник видит переписку во «Вопросах».",
  },
  {
    icon: CalendarDays,
    title: "Календарь мероприятий",
    text: "Наставник добавляет встречи. Участник отмечает, пойдёт ли.",
  },
  {
    icon: BellRing,
    title: "Сигнал помощи",
    text: "В обзоре наставника — блок «Требуют внимания», если кто-то просрочил шаг или попросил помощь.",
  },
  {
    icon: TrendingUp,
    title: "Прогресс и итоги",
    text: "День программы, выполненные шаги, просрочки, достижения за первый месяц.",
  },
  {
    icon: Users,
    title: "Группа и участники",
    text: "Состав комнаты, цель недели, прогресс каждого. Код приглашения — в профиле и настройках.",
  },
  {
    icon: ListChecks,
    title: "Панель наставника",
    text: "Обзор, задания с кнопками ответа, мероприятия, настройки комнаты и новый ключ.",
  },
];

const participantBenefits = [
  { icon: ClipboardList, text: "План на первый месяц: шаги недели, а не ежедневный чек-ин" },
  { icon: Bot, text: "ИИ-помощник по учёбе и университету" },
  { icon: MessageCircleQuestion, text: "Личный чат с наставником, без общей ленты" },
  { icon: CalendarDays, text: "Календарь встреч и отметка «пойду»" },
];

const curatorBenefits = [
  { icon: BellRing, text: "Сигнал, что кому-то нужна помощь" },
  { icon: ListChecks, text: "Задания с кнопками ответа и пометкой «сигнал»" },
  { icon: Users, text: "Прогресс каждого участника в одном месте" },
  { icon: CalendarDays, text: "Календарь группы: добавить встречу и увидеть отклики" },
];

export default function LandingPage() {
  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-30 border-b border-line/70 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Brand />
          <div className="flex items-center gap-2">
            <Link href="/login">
              <Button variant="ghost" size="sm">
                Войти
              </Button>
            </Link>
            <Link href="/join">
              <Button variant="ghost" size="sm">
                По коду
              </Button>
            </Link>
            <Link href="/create-group" className="hidden sm:block">
              <Button size="sm">Создать группу</Button>
            </Link>
          </div>
        </div>
      </header>

      <main>
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
                Комната на 30 дней: недельные шаги, календарь, ИИ-помощник по учёбе и наставник
                рядом. Наставник создаёт группу, участники входят по коду.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link href="/create-group" className="sm:w-auto">
                  <Button size="lg" fullWidth className="sm:w-auto sm:min-w-48">
                    Создать группу
                  </Button>
                </Link>
                <Link href="/join" className="sm:w-auto">
                  <Button variant="outline" size="lg" fullWidth className="sm:w-auto sm:min-w-48">
                    По коду
                  </Button>
                </Link>
              </div>

              <p className="mt-5 text-[13px] text-subtle">
                Для демонстрации используйте код{" "}
                <span className="font-mono font-semibold tracking-wider text-accent-strong">
                  {DEMO_INVITE_CODE}
                </span>
                {" "}или войдите готовым аккаунтом на странице входа.
              </p>
            </div>

            <HeroPreview />
          </div>
        </section>

        <section className="border-t border-line/70 bg-surface">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
            <div className="max-w-xl">
              <h2 className="text-3xl font-semibold sm:text-4xl">Как это устроено</h2>
              <p className="mt-3 text-[17px] text-muted">
                Одна комната, две роли: участник и наставник.
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

        <section>
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
            <div className="max-w-2xl">
              <h2 className="text-3xl font-semibold sm:text-4xl">Что есть на сайте сейчас</h2>
              <p className="mt-3 text-[17px] text-muted">
                Это не черновик идеи, а рабочий набор разделов. Ниже — то, чем можно пользоваться
                уже сегодня.
              </p>
            </div>

            <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {nowOnSite.map((item) => (
                <li key={item.title}>
                  <Card className="h-full p-5">
                    <span className="flex size-10 items-center justify-center rounded-2xl bg-accent-soft text-accent-strong">
                      <item.icon className="size-5" />
                    </span>
                    <h3 className="mt-4 text-base font-semibold">{item.title}</h3>
                    <p className="mt-2 text-[14px] leading-relaxed text-muted">{item.text}</p>
                  </Card>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="border-t border-line/70 bg-surface">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
            <h2 className="text-3xl font-semibold sm:text-4xl">Что получают обе стороны</h2>

            <div className="mt-10 grid gap-5 lg:grid-cols-2">
              <BenefitCard
                title="Для участника"
                subtitle="Сегодня, вопрос наставнику или ИИ, группа, мероприятия, прогресс и профиль."
                items={participantBenefits}
                tone="accent"
              />
              <BenefitCard
                title="Для наставника"
                subtitle="Обзор, участники, вопросы, задания, мероприятия и настройки комнаты."
                items={curatorBenefits}
                tone="success"
              />
            </div>
          </div>
        </section>

        <section>
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
            <Card tone="accent" className="p-8 text-center sm:p-14">
              <span className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-surface text-accent">
                <HeartHandshake className="size-6" />
              </span>
              <h2 className="mt-6 text-3xl font-semibold sm:text-4xl">Начать первые 30 дней</h2>
              <p className="mx-auto mt-3 max-w-md text-[17px] text-muted">
                Создайте комнату как наставник или войдите в существующую по коду приглашения.
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
          <p>Группы и аккаунты хранятся на сервере. Код приглашения — в профиле и в настройках.</p>
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

/** Статичный превью-снимок интерфейса — без функций, которых в приложении уже нет. */
function HeroPreview() {
  return (
    <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <Card className="p-5 sm:p-6">
        <div className="flex items-center justify-between">
          <Badge tone="accent">Шаг недели</Badge>
          <span className="text-[13px] text-subtle">Неделя 1</span>
        </div>
        <h3 className="mt-4 text-lg font-semibold">Познакомиться с наставником</h3>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          Сделано, когда понимаешь, к кому обращаться, и знаешь, как написать наставнику.
        </p>
        <div className="mt-5 h-11 flex items-center justify-center rounded-2xl bg-success-soft text-sm font-medium text-success-strong ring-1 ring-inset ring-success/25">
          Выполнено ✓
        </div>
      </Card>

      <Card className="p-5 sm:p-6">
        <p className="text-sm font-semibold">Задать вопрос</p>
        <div className="mt-4 space-y-2.5">
          <div className="flex items-center gap-3 rounded-2xl bg-accent-soft/80 px-3 py-3 ring-1 ring-inset ring-accent/25">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-surface text-accent">
              <Bot className="size-4" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold">ИИ-помощник</p>
              <p className="text-[12px] text-muted">По базе знаний университета</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-2xl bg-surface-muted px-3 py-3 ring-1 ring-inset ring-line">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-surface text-accent">
              <Users className="size-4" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold">Наставник</p>
              <p className="text-[12px] text-muted">Лично, группа не увидит</p>
            </div>
          </div>
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
          Сигнал, что кому-то нужна помощь: по просроченным шагам или если участник так ответил в
          задании.
        </p>
      </Card>
    </div>
  );
}
