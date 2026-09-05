"use client";

import { useState } from "react";
import { ArrowRight, CheckCircle2, ListChecks, Quote, Smile, Sparkles } from "lucide-react";

import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { getCurator } from "@/lib/services/groupService";
import { buildSummary, nextPlanGoals } from "@/lib/services/summaryService";
import { useAppStore } from "@/lib/store/app-store";
import { cn, formatDelta, isFeminineName } from "@/lib/utils";

export default function SummaryPage() {
  return (
    <AppShell role="participant">
      <Summary />
    </AppShell>
  );
}

function Summary() {
  const { state, currentUser } = useAppStore();
  const { toast } = useToast();
  const [planOpen, setPlanOpen] = useState(false);
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);

  if (!state || !currentUser) return null;

  const report = buildSummary(state, currentUser.id);
  if (!report) return null;

  const curator = getCurator(state);
  const feminine = isFeminineName(currentUser.name);

  const toggleGoal = (goal: string) => {
    setSelectedGoals((current) =>
      current.includes(goal) ? current.filter((item) => item !== goal) : [...current, goal],
    );
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title={`Ты ${feminine ? "прошла" : "прошёл"} первые 30 дней 🎉`}
        subtitle={`${state.group.name} — ${state.group.duration} дней позади.`}
        action={report.preview ? <Badge tone="accent">Предпросмотр итогов</Badge> : undefined}
      />

      {report.preview && (
        <p className="rounded-2xl bg-accent-soft/60 px-4 py-3 text-[13px] leading-relaxed text-accent-strong ring-1 ring-inset ring-accent/15">
          Программа ещё идёт — это предпросмотр того, как будет выглядеть итоговый отчёт после
          тридцатого дня.
        </p>
      )}

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard
          label="Выполненных заданий"
          value={report.completedTasks}
          icon={<ListChecks className="size-4" />}
          tone="accent"
        />
        <StatCard
          label="Активных дней"
          value={report.activeDays}
          icon={<CheckCircle2 className="size-4" />}
          tone="success"
        />
        <StatCard
          label="Изменение настроения"
          value={formatDelta(report.moodDelta)}
          hint="в среднем за программу"
          icon={<Smile className="size-4" />}
          tone={report.moodDelta >= 0 ? "success" : "warning"}
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card className="p-5 sm:p-6">
          <CardHeader
            icon={<Sparkles className="size-5" />}
            title="Личные достижения"
            description="То, что получилось за первый месяц."
          />

          <ul className="mt-5 space-y-2.5">
            {report.achievements.map((achievement) => (
              <li
                key={achievement.id}
                className={cn(
                  "flex items-center gap-3 rounded-2xl px-4 py-3.5 ring-1 ring-inset transition-colors",
                  achievement.unlocked
                    ? "bg-success-soft/60 ring-success/20"
                    : "bg-surface-muted ring-line",
                )}
              >
                <span className={cn("text-xl", !achievement.unlocked && "opacity-35 grayscale")}>
                  🏆
                </span>
                <span
                  className={cn(
                    "text-[15px]",
                    achievement.unlocked ? "font-medium" : "text-subtle",
                  )}
                >
                  {achievement.title}
                </span>
                {!achievement.unlocked && (
                  <span className="ml-auto text-[11px] text-subtle">ещё впереди</span>
                )}
              </li>
            ))}
          </ul>
        </Card>

        <div className="space-y-5">
          <Card className="p-5 sm:p-6">
            <div className="flex items-start gap-3">
              <Avatar name={curator?.name ?? "Куратор"} emoji={curator?.avatar} />
              <div className="min-w-0">
                <p className="text-sm font-semibold">Сообщение куратора</p>
                <p className="text-[13px] text-muted">{curator?.name ?? "Куратор"}</p>
              </div>
            </div>

            <blockquote className="mt-4 rounded-2xl bg-surface-muted p-4">
              <Quote className="size-4 text-accent" aria-hidden />
              <p className="mt-2 text-[15px] leading-relaxed">{report.curatorNote}</p>
            </blockquote>
          </Card>

          <Card tone="accent" className="p-5 sm:p-6">
            <h2 className="text-lg font-semibold">Что дальше?</h2>
            <p className="mt-2 text-[15px] leading-relaxed text-muted">
              Продолжай развивать то, что {feminine ? "начала" : "начал"} в первый месяц.
            </p>

            {selectedGoals.length > 0 && (
              <ul className="mt-4 space-y-2">
                {selectedGoals.map((goal) => (
                  <li
                    key={goal}
                    className="flex items-start gap-2.5 rounded-xl bg-surface px-3.5 py-2.5 text-[14px] leading-snug"
                  >
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" />
                    {goal}
                  </li>
                ))}
              </ul>
            )}

            <Button className="mt-5" onClick={() => setPlanOpen(true)}>
              {selectedGoals.length > 0 ? "Изменить план" : "Составить план"}
              <ArrowRight className="size-4" />
            </Button>
          </Card>
        </div>
      </div>

      <Modal
        open={planOpen}
        onClose={() => setPlanOpen(false)}
        title="Следующие 30 дней"
        description="Выберите цели, с которыми хочется продолжить."
        footer={
          <>
            <Button variant="ghost" onClick={() => setPlanOpen(false)}>
              Отмена
            </Button>
            <Button
              disabled={selectedGoals.length === 0}
              onClick={() => {
                setPlanOpen(false);
                toast("План на следующие 30 дней сохранён");
              }}
            >
              Сохранить план
            </Button>
          </>
        }
      >
        <div className="space-y-2">
          {nextPlanGoals.map((goal) => {
            const active = selectedGoals.includes(goal);

            return (
              <button
                key={goal}
                type="button"
                onClick={() => toggleGoal(goal)}
                aria-pressed={active}
                className={cn(
                  "flex w-full items-start gap-3 rounded-2xl px-4 py-3.5 text-left text-[15px] leading-snug ring-1 ring-inset transition-all duration-200",
                  active
                    ? "bg-accent-soft font-medium text-accent-strong ring-2 ring-accent"
                    : "bg-surface-muted ring-line hover:bg-accent-soft/60 hover:ring-accent-ring",
                )}
              >
                <CheckCircle2
                  className={cn("mt-0.5 size-5 shrink-0", active ? "text-accent" : "text-subtle")}
                />
                {goal}
              </button>
            );
          })}
        </div>
      </Modal>
    </div>
  );
}
