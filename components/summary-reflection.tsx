"use client";

import { useEffect, useState } from "react";
import { MessageSquareQuote, PenLine } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { Field, Textarea } from "@/components/ui/field";
import {
  getSummaryReflection,
  hasReflectionText,
  MAX_REFLECTION,
  saveSummaryReflection,
} from "@/lib/services/summaryService";
import { useAppStore } from "@/lib/store/app-store";
import type { SummaryReflection } from "@/lib/types";
import { formatRelativeTime } from "@/lib/utils";

function countHint(value: string) {
  return `${value.length} / ${MAX_REFLECTION}`;
}

export function SummaryReflectionForm({
  onSaved,
}: {
  onSaved?: () => void;
}) {
  const { state, currentUser, update } = useAppStore();
  const saved = state && currentUser ? getSummaryReflection(state, currentUser.id) : undefined;
  const [mentorNote, setMentorNote] = useState(saved?.mentorNote ?? "");
  const [useful, setUseful] = useState(saved?.useful ?? "");
  const [unclear, setUnclear] = useState(saved?.unclear ?? "");

  useEffect(() => {
    setMentorNote(saved?.mentorNote ?? "");
    setUseful(saved?.useful ?? "");
    setUnclear(saved?.unclear ?? "");
  }, [currentUser?.id, saved?.updatedAt, saved?.mentorNote, saved?.useful, saved?.unclear]);

  if (!state || !currentUser) return null;

  const dirty =
    mentorNote !== (saved?.mentorNote ?? "") ||
    useful !== (saved?.useful ?? "") ||
    unclear !== (saved?.unclear ?? "");

  return (
    <Card className="p-5 sm:p-6">
      <CardHeader
        icon={<PenLine className="size-5" />}
        title="Отзыв о программе"
        description="Наставник увидит ответы на странице участников."
      />

      <div className="mt-5 space-y-4">
        <Field
          label="Отзыв о наставнике"
          htmlFor="summary-mentor"
          hint={countHint(mentorNote)}
        >
          <Textarea
            id="summary-mentor"
            value={mentorNote}
            maxLength={MAX_REFLECTION}
            placeholder="Как наставник помогал в эти 30 дней?"
            onChange={(event) => setMentorNote(event.target.value)}
          />
        </Field>

        <Field
          label="Что было самым полезным"
          htmlFor="summary-useful"
          hint={countHint(useful)}
        >
          <Textarea
            id="summary-useful"
            value={useful}
            maxLength={MAX_REFLECTION}
            placeholder="Какой шаг, встреча или совет больше всего помогли?"
            onChange={(event) => setUseful(event.target.value)}
          />
        </Field>

        <Field
          label="Что осталось непонятным"
          htmlFor="summary-unclear"
          hint={countHint(unclear)}
        >
          <Textarea
            id="summary-unclear"
            value={unclear}
            maxLength={MAX_REFLECTION}
            placeholder="Что всё ещё хочется разобрать?"
            onChange={(event) => setUnclear(event.target.value)}
          />
        </Field>

        <Button
          disabled={!dirty}
          onClick={() => {
            update((current) =>
              saveSummaryReflection(current, currentUser.id, { mentorNote, useful, unclear }),
            );
            onSaved?.();
          }}
        >
          {saved ? "Сохранить изменения" : "Сохранить отзыв"}
        </Button>
      </div>
    </Card>
  );
}

const REFLECTION_FIELDS: Array<{ key: keyof Pick<SummaryReflection, "mentorNote" | "useful" | "unclear">; label: string }> = [
  { key: "mentorNote", label: "О наставнике" },
  { key: "useful", label: "Самое полезное" },
  { key: "unclear", label: "Осталось непонятным" },
];

export function ParticipantSummaryReflection({ reflection }: { reflection?: SummaryReflection }) {
  if (!hasReflectionText(reflection) || !reflection) return null;

  return (
    <div className="mt-4 space-y-2">
      <p className="flex items-center gap-1.5 text-[13px] font-medium text-muted">
        <MessageSquareQuote className="size-3.5" />
        Отзыв об итогах
      </p>
      <ul className="space-y-2">
        {REFLECTION_FIELDS.map((field) => {
          const text = reflection[field.key].trim();
          if (!text) return null;

          return (
            <li
              key={field.key}
              className="rounded-xl bg-surface-muted px-3 py-2.5 ring-1 ring-inset ring-line"
            >
              <p className="text-[12px] font-medium text-subtle">{field.label}</p>
              <p className="mt-1 text-[13px] leading-relaxed break-all [overflow-wrap:anywhere]">
                {text}
              </p>
            </li>
          );
        })}
      </ul>
      <p className="text-[12px] text-subtle">{formatRelativeTime(reflection.updatedAt)}</p>
    </div>
  );
}
