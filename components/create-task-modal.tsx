"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import { createId } from "@/lib/storage";
import {
  defaultAnswerOptions,
  getWeekCount,
  MAX_ANSWER_OPTIONS,
  MIN_ANSWER_OPTIONS,
  TASK_KIND_LABELS,
  TASK_KINDS,
  type CreateTaskInput,
} from "@/lib/services/taskService";
import type { TaskAnswerOption, TaskKind } from "@/lib/types";
import { cn } from "@/lib/utils";

export function CreateTaskModal({
  open,
  onClose,
  defaultWeek,
  duration,
  error,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  defaultWeek: number;
  duration: number;
  error?: string | null;
  onSubmit: (input: CreateTaskInput) => void;
}) {
  const [week, setWeek] = useState(String(defaultWeek));
  const [kind, setKind] = useState<TaskKind>("required");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [answerOptions, setAnswerOptions] = useState<TaskAnswerOption[]>(() =>
    defaultAnswerOptions("question"),
  );
  const weekCount = getWeekCount(duration);
  const isAnswerKind = kind === "question";

  useEffect(() => {
    if (open) {
      setWeek(String(defaultWeek));
      setKind("required");
      setTitle("");
      setDescription("");
      setAnswerOptions(defaultAnswerOptions("question"));
    }
  }, [open, defaultWeek]);

  const handleKindChange = (next: TaskKind) => {
    setKind(next);
    if (next === "question") {
      setAnswerOptions(defaultAnswerOptions(next));
    }
  };

  const handleSubmit = () => {
    onSubmit({
      week: Number(week),
      title,
      description,
      kind,
      answerOptions: isAnswerKind ? answerOptions : undefined,
    });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Новое задание"
      description="Один шаг на неделю — студент закроет его в любой день."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Отмена
          </Button>
          <Button onClick={handleSubmit} disabled={title.trim().length < 3}>
            Добавить задание
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Неделя" htmlFor="task-week" hint={`От 1 до ${weekCount}`}>
          <Input
            id="task-week"
            type="number"
            min={1}
            max={weekCount}
            value={week}
            onChange={(event) => setWeek(event.target.value)}
            className="max-w-28"
          />
        </Field>

        <Field label="Тип">
          <KindPicker value={kind} onChange={handleKindChange} />
        </Field>

        <Field label="Название" htmlFor="task-title">
          <Input
            id="task-title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Например: познакомиться с наставником"
            maxLength={120}
          />
        </Field>

        <Field label="Когда сделано" htmlFor="task-description" error={error ?? undefined}>
          <Textarea
            id="task-description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Сделано, когда студент понимает, к кому обращаться."
            maxLength={400}
          />
        </Field>

        {isAnswerKind ? (
          <AnswerOptionsEditor value={answerOptions} onChange={setAnswerOptions} />
        ) : null}
      </div>
    </Modal>
  );
}

export function AnswerOptionsEditor({
  value,
  onChange,
}: {
  value: TaskAnswerOption[];
  onChange: (options: TaskAnswerOption[]) => void;
}) {
  const updateOption = (id: string, patch: Partial<TaskAnswerOption>) => {
    onChange(value.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  };

  return (
    <Field
      label="Кнопки ответа"
      hint="Студент нажмёт одну из них. Можно также написать комментарий — он появится у вас в вопросах недели. «Сигнал» подсветит ответ наставнику."
    >
      <div className="space-y-2">
        {value.map((item, index) => (
          <div key={item.id} className="flex items-center gap-2">
            <Input
              aria-label={`Текст кнопки ${index + 1}`}
              value={item.label}
              onChange={(event) => updateOption(item.id, { label: event.target.value })}
              placeholder={`Кнопка ${index + 1}`}
              maxLength={40}
              className="h-11"
            />
            <button
              type="button"
              onClick={() => updateOption(item.id, { needsAttention: !item.needsAttention })}
              className={cn(
                "h-11 shrink-0 rounded-2xl px-3 text-[12px] font-medium ring-1 ring-inset transition-colors",
                item.needsAttention
                  ? "bg-warning-soft text-warning ring-warning/30"
                  : "bg-surface text-muted ring-line hover:ring-accent-ring",
              )}
            >
              {item.needsAttention ? "Сигнал" : "Ок"}
            </button>
            {value.length > MIN_ANSWER_OPTIONS ? (
              <button
                type="button"
                onClick={() => onChange(value.filter((option) => option.id !== item.id))}
                aria-label={`Удалить кнопку «${item.label || index + 1}»`}
                className="flex size-11 shrink-0 items-center justify-center rounded-2xl text-subtle transition-colors hover:bg-danger-soft hover:text-danger"
              >
                <Trash2 className="size-4" />
              </button>
            ) : null}
          </div>
        ))}
        {value.length < MAX_ANSWER_OPTIONS ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() =>
              onChange([...value, { id: createId("ao"), label: "", needsAttention: false }])
            }
          >
            <Plus className="size-3.5" />
            Ещё кнопка
          </Button>
        ) : null}
      </div>
    </Field>
  );
}

export function KindPicker({
  value,
  onChange,
}: {
  value: TaskKind;
  onChange: (kind: TaskKind) => void;
}) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {TASK_KINDS.map((kind) => (
        <button
          key={kind}
          type="button"
          onClick={() => onChange(kind)}
          className={cn(
            "rounded-2xl px-3 py-2.5 text-left text-[13px] font-medium ring-1 ring-inset transition-colors",
            value === kind
              ? "bg-accent-soft text-accent-strong ring-accent/30"
              : "bg-surface text-muted ring-line hover:ring-accent-ring",
          )}
        >
          {TASK_KIND_LABELS[kind]}
        </button>
      ))}
    </div>
  );
}
