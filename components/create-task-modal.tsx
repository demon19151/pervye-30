"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import {
  getWeekCount,
  TASK_KIND_LABELS,
  TASK_KINDS,
  type CreateTaskInput,
} from "@/lib/services/taskService";
import type { TaskKind } from "@/lib/types";
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
  const weekCount = getWeekCount(duration);

  useEffect(() => {
    if (open) {
      setWeek(String(defaultWeek));
      setKind("required");
      setTitle("");
      setDescription("");
    }
  }, [open, defaultWeek]);

  const handleSubmit = () => {
    onSubmit({ week: Number(week), title, description, kind });
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
          <KindPicker value={kind} onChange={setKind} />
        </Field>

        <Field label="Название" htmlFor="task-title">
          <Input
            id="task-title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Например: познакомиться с куратором"
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
      </div>
    </Modal>
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
    <div className="grid grid-cols-2 gap-2">
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
