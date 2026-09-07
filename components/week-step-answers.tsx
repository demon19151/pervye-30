"use client";

import { useState } from "react";
import { Check, CircleHelp, ListChecks, MessageCircle, MessageCircleQuestion } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/states";
import type {
  SilentStepParticipant,
  WeekRequiredStepTracking,
  WeekStepAnswerTracking,
  WeekTrackingSummary,
} from "@/lib/services/statsService";
import {
  getAnswerLabel,
  getTaskKind,
  needsCuratorAttention,
  TASK_KIND_LABELS,
} from "@/lib/services/taskService";
import type { Task, TaskAnswer, User } from "@/lib/types";
import { cn, formatRelativeTime, pluralize } from "@/lib/utils";

type StepFilter = "all" | "question" | "required";

const FILTERS: Array<{ id: StepFilter; label: string }> = [
  { id: "all", label: "Все" },
  { id: "question", label: "Вопрос" },
  { id: "required", label: "Обязательно" },
];

/** Список участников; дальше прокручивается внутри панели. */
const PARTICIPANT_LIST_MAX = "max-h-[min(24rem,calc(6*4.75rem))]";

function answerTone(
  answer?: TaskAnswer,
  completed = false,
  task?: Task,
): "success" | "warning" | "caution" | "neutral" {
  if (!completed) return "neutral";
  if (needsCuratorAttention(answer, task)) return answer === "no" ? "caution" : "warning";
  return "success";
}

export function WeekStepAnswersCard({
  week,
  currentWeek,
  tracking,
  required,
  summary,
  silent,
  onWeekChange,
  onWrite,
}: {
  week: number;
  currentWeek: number;
  tracking: WeekStepAnswerTracking[];
  required: WeekRequiredStepTracking[];
  summary: WeekTrackingSummary;
  silent: SilentStepParticipant[];
  onWeekChange: (week: number) => void;
  onWrite: (user: User) => void;
}) {
  const [filter, setFilter] = useState<StepFilter>("all");
  const weeks = Array.from({ length: currentWeek }, (_, index) => index + 1);
  const questions = tracking.filter((item) => getTaskKind(item.task) === "question");
  const answerCards = filter === "question" ? questions : filter === "all" ? tracking : [];
  const showRequired = filter === "all" || filter === "required";
  const showAnswers = filter !== "required";

  return (
    <Card className="p-5 sm:p-6">
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone="accent">
          <MessageCircleQuestion className="size-3.5" />
          Неделя {week}
        </Badge>
        {week === currentWeek ? <Badge tone="neutral">текущая</Badge> : null}
      </div>
      <h2 className="mt-3 text-xl font-semibold tracking-tight">Ответы на шаги недели</h2>
      <p className="mt-1.5 text-[15px] leading-relaxed text-muted">
        Вопросы и обязательные шаги. Сначала те, кому нужна помощь, затем без ответа.
      </p>

      {weeks.length > 1 ? (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {weeks.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => onWeekChange(item)}
              className={cn(
                "rounded-full px-3 py-1.5 text-[13px] font-medium transition-colors",
                item === week
                  ? "bg-accent text-white"
                  : "bg-surface-muted text-muted ring-1 ring-inset ring-line hover:text-foreground",
              )}
            >
              Неделя {item}
            </button>
          ))}
        </div>
      ) : null}

      <dl className="mt-4 grid grid-cols-3 gap-2 text-center">
        <SummaryMetric label="Нет ответа" value={summary.unansweredCount} />
        <SummaryMetric
          label="Просят внимания"
          value={summary.attentionCount}
          tone={summary.attentionCount > 0 ? "warning" : "default"}
        />
        <SummaryMetric
          label="Не закрыли обязательные"
          value={summary.requiredOpenCount}
          tone={summary.requiredOpenCount > 0 ? "warning" : "default"}
        />
      </dl>

      {silent.length > 0 ? (
        <div className="mt-4 rounded-2xl bg-warning-soft/70 px-4 py-3">
          <p className="text-[13px] font-medium text-warning">Молчат уже несколько недель</p>
          <ul className="mt-1.5 space-y-1">
            {silent.map((item) => (
              <li key={item.user.id} className="flex items-center justify-between gap-3">
                <span className="text-[13px] text-muted">
                  {item.user.name} · {item.weeks}{" "}
                  {pluralize(item.weeks, "неделя", "недели", "недель")} без ответа на вопросы
                </span>
                <Button variant="ghost" size="sm" onClick={() => onWrite(item.user)}>
                  <MessageCircle className="size-3.5" />
                  Написать
                </Button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-1.5">
        {FILTERS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setFilter(item.id)}
            className={cn(
              "rounded-full px-3 py-1.5 text-[13px] font-medium transition-colors",
              item.id === filter
                ? "bg-accent-soft text-accent-strong"
                : "bg-surface-muted text-muted ring-1 ring-inset ring-line hover:text-foreground",
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      {showRequired && (required.length > 0 || filter === "required") ? (
        <div className="mt-6 space-y-3">
          <div className="flex items-center gap-2">
            <ListChecks className="size-4 text-accent" />
            <h3 className="text-[15px] font-semibold">Обязательные шаги</h3>
          </div>
          {required.length === 0 ? (
            <EmptyState
              icon={<ListChecks className="size-5" />}
              title="На этой неделе нет обязательных шагов"
              description="Когда появятся обязательные шаги, прогресс группы будет здесь."
            />
          ) : (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {required.map((item) => {
                const pending = item.responses.filter((response) => !response.completed);

                return (
                  <div
                    key={item.task.id}
                    className="rounded-2xl bg-surface-muted px-4 py-3.5 ring-1 ring-inset ring-line"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <p className="min-w-0 text-[14px] font-medium leading-snug break-all [overflow-wrap:anywhere]">{item.task.title}</p>
                      <span className="shrink-0 text-[13px] text-muted">
                        {item.doneCount} из {item.doneCount + item.pendingCount}
                      </span>
                    </div>
                    {pending.length === 0 ? (
                      <p className="mt-2 flex items-center gap-1.5 text-[13px] text-success-strong">
                        <Check className="size-3.5" />
                        Все сделали
                      </p>
                    ) : (
                      <ul className="mt-2 flex flex-wrap gap-1.5">
                        {pending.map((response) => (
                          <li key={response.user.id}>
                            <Badge tone="caution">{response.user.name}</Badge>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : null}

      {showAnswers && (answerCards.length > 0 || filter === "question") ? (
        <div className="mt-6 space-y-3">
          <div className="flex items-center gap-2">
            <CircleHelp className="size-4 text-accent" />
            <h3 className="text-[15px] font-semibold">Вопросы</h3>
          </div>
          {answerCards.length === 0 ? (
            <EmptyState
              icon={<CircleHelp className="size-5" />}
              title="На этой неделе нет шагов-вопросов"
              description="Когда наставник добавит такой шаг, ответы появятся здесь."
            />
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {answerCards.map((item) => (
                <AnswerPanel key={item.task.id} item={item} onWrite={onWrite} />
              ))}
            </div>
          )}
        </div>
      ) : null}
    </Card>
  );
}

function AnswerPanel({
  item,
  onWrite,
}: {
  item: WeekStepAnswerTracking;
  onWrite: (user: User) => void;
}) {
  return (
    <div className="flex min-h-0 flex-col rounded-2xl bg-surface-muted px-4 py-4 ring-1 ring-inset ring-line">
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone={getTaskKind(item.task) === "question" ? "accent" : "neutral"}>
          {TASK_KIND_LABELS[getTaskKind(item.task)]}
        </Badge>
        <span className="text-[13px] text-muted">
          {item.answeredCount} из {item.answeredCount + item.pendingCount}
        </span>
        {item.attentionCount > 0 ? (
          <Badge tone="warning">
            {item.attentionCount}{" "}
            {pluralize(item.attentionCount, "просит внимания", "просят внимания", "просят внимания")}
          </Badge>
        ) : null}
      </div>
      <p className="mt-2.5 text-[16px] font-semibold leading-snug break-all [overflow-wrap:anywhere]">{item.task.title}</p>
      <ul
        className={cn(
          "mt-3 min-h-0 space-y-2 overflow-y-auto overscroll-contain pr-1",
          PARTICIPANT_LIST_MAX,
        )}
      >
        {item.responses.map((response) => {
          const needsHelp = response.completed && needsCuratorAttention(response.answer, item.task);
          const note = response.note?.trim();
          const canWrite = needsHelp || Boolean(note);

          return (
            <li key={response.user.id} className="flex shrink-0 items-start gap-2.5">
              <Avatar name={response.user.name} emoji={response.user.avatar} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[14px] font-medium">{response.user.name}</p>
                {response.completedAt ? (
                  <p className="truncate text-[12px] text-subtle">
                    {formatRelativeTime(response.completedAt)}
                  </p>
                ) : null}
                {note ? (
                  <p className="mt-1 text-[13px] leading-relaxed break-all text-foreground [overflow-wrap:anywhere]">
                    {note}
                  </p>
                ) : null}
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1.5">
                <Badge tone={answerTone(response.answer, response.completed, item.task)}>
                  {response.completed
                    ? (getAnswerLabel(response.answer, item.task) ?? "Отмечено")
                    : "Нет ответа"}
                </Badge>
                {canWrite ? (
                  <Button variant="outline" size="sm" onClick={() => onWrite(response.user)}>
                    <MessageCircle className="size-3.5" />
                    Написать
                  </Button>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function SummaryMetric({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: number;
  tone?: "default" | "warning";
}) {
  return (
    <div className="rounded-xl bg-surface-muted px-2 py-2.5">
      <dt className="text-[11px] text-subtle">{label}</dt>
      <dd
        className={cn(
          "text-sm font-semibold tabular-nums",
          tone === "warning" && "text-warning",
        )}
      >
        {value}
      </dd>
    </div>
  );
}

export function ParticipantWeekAnswers({
  answers,
  required,
  silentWeeks,
  onWrite,
}: {
  answers: Array<{
    task: Task;
    answer?: TaskAnswer;
    note?: string;
    completed: boolean;
    completedAt?: string;
  }>;
  required: { done: number; total: number };
  silentWeeks: number;
  onWrite?: () => void;
}) {
  const hasAnswers = answers.length > 0;
  const hasRequired = required.total > 0;
  if (!hasAnswers && !hasRequired && silentWeeks < 2) return null;

  return (
    <div className="mt-4 space-y-2">
      {silentWeeks >= 2 ? (
        <p className="text-[13px] font-medium text-warning">
          {silentWeeks} {pluralize(silentWeeks, "неделя", "недели", "недель")} без ответа на вопросы
        </p>
      ) : null}
      {hasRequired ? (
        <p className="text-[13px] font-medium text-muted">
          Обязательные шаги: {required.done} из {required.total}
        </p>
      ) : null}
      {hasAnswers ? (
        <>
          <p className="text-[13px] font-medium text-muted">Ответы на шаги недели</p>
          <ul className="space-y-2">
            {answers.map((item) => {
              const needsHelp = item.completed && needsCuratorAttention(item.answer, item.task);
              const note = item.note?.trim();

              return (
                <li
                  key={item.task.id}
                  className={cn(
                    "flex items-start justify-between gap-3 rounded-xl px-3 py-2.5 ring-1 ring-inset",
                    needsHelp ? "bg-warning-soft/60 ring-warning/25" : "bg-surface-muted ring-line",
                  )}
                >
                  <div className="min-w-0">
                    <p className="text-[13px] leading-snug break-all [overflow-wrap:anywhere]">{item.task.title}</p>
                    {item.completedAt ? (
                      <p className="mt-0.5 text-[12px] text-subtle">
                        {formatRelativeTime(item.completedAt)}
                      </p>
                    ) : null}
                    {note ? (
                      <p className="mt-1.5 text-[13px] leading-relaxed break-all [overflow-wrap:anywhere]">
                        {note}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1.5">
                    <Badge tone={answerTone(item.answer, item.completed, item.task)}>
                      {item.completed
                        ? (getAnswerLabel(item.answer, item.task) ?? "Отмечено")
                        : "Нет ответа"}
                    </Badge>
                    {needsHelp && onWrite ? (
                      <Button variant="ghost" size="sm" onClick={onWrite}>
                        <MessageCircle className="size-3.5" />
                        Написать
                      </Button>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        </>
      ) : null}
    </div>
  );
}
