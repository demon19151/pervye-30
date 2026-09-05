"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import type { CreateTaskInput } from "@/lib/services/taskService";

export function CreateTaskModal({
  open,
  onClose,
  defaultDay,
  duration,
  error,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  defaultDay: number;
  duration: number;
  error?: string | null;
  onSubmit: (input: CreateTaskInput) => void;
}) {
  const [day, setDay] = useState(String(defaultDay));
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (open) {
      setDay(String(defaultDay));
      setTitle("");
      setDescription("");
    }
  }, [open, defaultDay]);

  const handleSubmit = () => {
    onSubmit({ day: Number(day), title, description });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Новое задание"
      description="Один небольшой шаг на день — этого достаточно."
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
        <Field label="День" htmlFor="task-day" hint={`От 1 до ${duration}`}>
          <Input
            id="task-day"
            type="number"
            min={1}
            max={duration}
            value={day}
            onChange={(event) => setDay(event.target.value)}
            className="max-w-28"
          />
        </Field>

        <Field label="Название" htmlFor="task-title">
          <Input
            id="task-title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Например: познакомиться с командой поддержки"
            maxLength={120}
          />
        </Field>

        <Field label="Описание" htmlFor="task-description" error={error ?? undefined}>
          <Textarea
            id="task-description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Коротко объясните, что нужно сделать и зачем."
            maxLength={400}
          />
        </Field>
      </div>
    </Modal>
  );
}
