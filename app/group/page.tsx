"use client";

import { Suspense } from "react";
import Link from "next/link";
import { CalendarDays, Check, Clock, ListChecks, Target, TrendingUp, Users } from "lucide-react";

import { InviteCodeCard } from "@/components/invite-code-card";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/page-header";
import { ProgressBar } from "@/components/progress-bar";
import { StatCard } from "@/components/stat-card";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { PageSkeleton } from "@/components/ui/states";
import { useToast } from "@/components/ui/toast";
import {
  cancelCalendarEventResponse,
  getUpcomingCalendarEvent,
  hasRespondedToEvent,
  respondToCalendarEvent,
} from "@/lib/services/calendarEventsService";
import { getAllParticipantStats, getGroupStats } from "@/lib/services/statsService";
import {
  getProgramWeek,
  getTasksByWeek,
  hasCompletedTask,
  isRequiredTask,
} from "@/lib/services/taskService";
import { useAppStore } from "@/lib/store/app-store";
import type { AppState, CalendarEvent } from "@/lib/types";
import { cn, pluralize } from "@/lib/utils";

export default function GroupPage() {
  return (
    <AppShell>
      <Suspense fallback={<PageSkeleton />}>
        <GroupOverview />
      </Suspense>
    </AppShell>
  );
}

function weekRequiredSteps(state: AppState, userId: string, week: number) {
  const required = getTasksByWeek(state, week).filter(isRequiredTask);
  return {
    done: required.filter((task) => hasCompletedTask(state, task.id, userId)).length,
    total: required.length,
  };
}

function GroupOverview() {
  const { state, currentUser, update } = useAppStore();
  const toast = useToast();

  if (!state || !currentUser) return null;

  const { group } = state;
  const participants = getAllParticipantStats(state);
  const stats = getGroupStats(state);
  const goal = group.weeklyGoal;
  const isCurator = currentUser.role === "curator";
  const week = getProgramWeek(group.currentDay, group.duration);
  const upcoming = getUpcomingCalendarEvent(state, group.currentDay);

  const onRespond = (eventId: string) => {
    update((current) => respondToCalendarEvent(current, eventId, currentUser.id));
    toast.toast("Записал тебя.", "success");
  };

  const onCancel = (eventId: string) => {
    update((current) => cancelCalendarEventResponse(current, eventId, currentUser.id));
    toast.toast("Ок, не идёшь.", "info");
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title={group.name}
        subtitle={group.description}
        action={
          <Badge tone="accent">
            {stats.participants}{" "}
            {pluralize(stats.participants, "участник", "участника", "участников")}
          </Badge>
        }
      />

      <div className="grid gap-5 lg:grid-cols-5">
        <div className="space-y-5 lg:col-span-3">
          <Card className="p-5 sm:p-6">
            <CardHeader
              icon={<TrendingUp className="size-5" />}
              title="Общий прогресс"
              description={`Средний прогресс группы — ${stats.averageProgress}%`}
            />

            <ProgressBar value={stats.averageProgress} className="mt-5" />

            <div className="mt-5 grid grid-cols-2 gap-3">
              <StatCard
                label="Выполненных заданий"
                value={stats.completedTasks}
                icon={<ListChecks className="size-4" />}
                tone="success"
              />
              <StatCard
                label={`${pluralize(stats.currentDay, "день", "дня", "дней")} программы`}
                value={stats.currentDay}
                hint={`из ${group.duration}`}
                icon={<CalendarDays className="size-4" />}
                tone="accent"
              />
            </div>
          </Card>

          {goal ? (
            <Card className="p-5 sm:p-6">
              <CardHeader
                icon={<Target className="size-5" />}
                title="Цель недели"
                action={
                  <Badge tone={goal.done >= goal.target ? "success" : "accent"}>
                    {goal.done} / {goal.target}
                  </Badge>
                }
              />
              <p className="mt-4 text-[15px] leading-relaxed text-muted">{goal.title}</p>
              <ProgressBar
                value={(goal.done / goal.target) * 100}
                tone={goal.done >= goal.target ? "success" : "accent"}
                className="mt-4"
              />
            </Card>
          ) : null}

          {upcoming ? (
            <UpcomingEventCard
              event={upcoming}
              isCurator={isCurator}
              responded={hasRespondedToEvent(state, upcoming.id, currentUser.id)}
              onRespond={() => onRespond(upcoming.id)}
              onCancel={() => onCancel(upcoming.id)}
            />
          ) : null}
        </div>

        <div className="space-y-5 lg:col-span-2">
          <Card className="p-5 sm:p-6">
            <CardHeader
              icon={<Users className="size-5" />}
              title="Участники"
              description={`Обязательные шаги недели ${week}.`}
            />

            <ul className="mt-5 space-y-2">
              {participants.map((item) => {
                const steps = weekRequiredSteps(state, item.user.id, week);
                const isMe = item.user.id === currentUser.id;
                const closed = steps.total > 0 && steps.done === steps.total;

                return (
                  <li
                    key={item.user.id}
                    className={cn(
                      "flex items-center gap-3 rounded-2xl px-2 py-2",
                      isMe && "bg-accent-soft/80 ring-1 ring-inset ring-accent/20",
                    )}
                  >
                    <Avatar name={item.user.name} emoji={item.user.avatar} size="sm" />
                    <div className="min-w-0 flex-1">
                      <div className="flex min-w-0 items-center gap-1.5">
                        <span className="truncate text-sm font-medium">{item.user.name}</span>
                        {isMe ? (
                          <span className="shrink-0 rounded-full bg-accent px-1.5 py-0.5 text-[10px] font-semibold leading-none text-white">
                            ты
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-0.5 text-[12px] text-muted">
                        {steps.total > 0
                          ? `обязательные шаги: ${steps.done} из ${steps.total}`
                          : "нет обязательных шагов"}
                      </p>
                      <ProgressBar
                        value={steps.total ? (steps.done / steps.total) * 100 : 0}
                        size="sm"
                        tone={closed ? "success" : "accent"}
                        className="mt-1.5"
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          </Card>

          <InviteCodeCard
            code={group.inviteCode}
            description="По этому коду в группу может войти новый участник."
          />
        </div>
      </div>
    </div>
  );
}

function UpcomingEventCard({
  event,
  isCurator,
  responded,
  onRespond,
  onCancel,
}: {
  event: CalendarEvent;
  isCurator: boolean;
  responded: boolean;
  onRespond: () => void;
  onCancel: () => void;
}) {
  return (
    <Card className="p-5 sm:p-6">
      <CardHeader
        icon={<CalendarDays className="size-5" />}
        title="Ближайшее мероприятие"
        action={
          <Link href="/events" className="text-[13px] font-medium text-accent hover:text-accent-strong">
            все
          </Link>
        }
      />

      <div className="mt-4 flex items-start gap-3">
        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex rounded-full bg-accent px-2.5 py-0.5 text-[12px] font-semibold text-white">
              День {event.day}
            </span>
            <span className="inline-flex items-center gap-1 text-[13px] text-muted">
              <Clock className="size-3.5 shrink-0" />
              {event.time}
            </span>
          </div>
          <p className="text-[16px] font-semibold">{event.title}</p>
          {event.location ? <p className="text-[13px] text-muted">{event.location}</p> : null}
        </div>

        {isCurator ? null : responded ? (
          <Button variant="secondary" size="sm" className="shrink-0" onClick={onCancel}>
            <Check className="size-3.5" />
            Я иду
          </Button>
        ) : (
          <Button size="sm" className="shrink-0" onClick={onRespond}>
            Пойду
          </Button>
        )}
      </div>
    </Card>
  );
}
