"use client";

import { CalendarDays, ListChecks, Sparkles } from "lucide-react";

import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { SummaryReflectionForm } from "@/components/summary-reflection";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { buildSummary } from "@/lib/services/summaryService";
import { useAppStore } from "@/lib/store/app-store";
import { cn, isFeminineName } from "@/lib/utils";

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

  if (!state || !currentUser) return null;

  const report = buildSummary(state, currentUser.id);
  if (!report) return null;

  const feminine = isFeminineName(currentUser.name);

  return (
    <div className="space-y-5">
      <PageHeader
        title={`Ты ${feminine ? "прошла" : "прошёл"} первые 30 дней 🎉`}
        subtitle={`${state.group.name} — день ${state.group.currentDay} из ${state.group.duration}.`}
        action={report.preview ? <Badge tone="accent">Предпросмотр итогов</Badge> : undefined}
      />

      {report.preview && (
        <p className="rounded-2xl bg-accent-soft/60 px-4 py-3 text-[13px] leading-relaxed text-accent-strong ring-1 ring-inset ring-accent/15">
          Программа ещё идёт — это предпросмотр итогового отчёта.
        </p>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <StatCard
          label="Выполненных заданий"
          value={report.completedTasks}
          icon={<ListChecks className="size-4" />}
          tone="accent"
        />
        <StatCard
          label="Закрытых недель"
          value={report.closedWeeks}
          icon={<CalendarDays className="size-4" />}
          tone="success"
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

        <SummaryReflectionForm onSaved={() => toast("Отзыв сохранён")} />
      </div>
    </div>
  );
}
