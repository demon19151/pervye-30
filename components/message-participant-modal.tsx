"use client";

import { useEffect, useState } from "react";
import { Send } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Field, Textarea } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import { toDative } from "@/lib/utils";

const suggestions = [
  "как ты? Если хочется — можем коротко поговорить сегодня.",
  "заметил, что первая неделя даётся непросто. Давай разберём вместе, что мешает?",
  "если есть вопрос, который неудобно задавать в группе — напиши мне напрямую.",
];

export function MessageParticipantModal({
  open,
  participantName,
  onClose,
  onSubmit,
}: {
  open: boolean;
  participantName: string;
  onClose: () => void;
  onSubmit: (text: string) => void;
}) {
  const [text, setText] = useState("");

  useEffect(() => {
    if (open) setText(suggestions[0]);
  }, [open]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Написать ${toDative(participantName)}`}
      description="Сообщение придёт только этому участнику — в личной переписке, не в общей ленте."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Отмена
          </Button>
          <Button onClick={() => onSubmit(text)} disabled={text.trim().length < 2}>
            <Send className="size-4" />
            Отправить
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <Field label="Сообщение" htmlFor="participant-message">
          <Textarea
            id="participant-message"
            value={text}
            onChange={(event) => setText(event.target.value)}
            maxLength={400}
            className="min-h-28"
          />
        </Field>

        <p className="text-[13px] text-muted">
          {participantName} увидит это во вкладке «Задать вопрос».
        </p>

        <div className="flex flex-wrap gap-1.5">
          {suggestions.map((suggestion, index) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => setText(suggestion)}
              className="rounded-full bg-surface-muted px-2.5 py-1 text-xs font-medium text-muted ring-1 ring-inset ring-line transition-colors hover:text-foreground"
            >
              Вариант {index + 1}
            </button>
          ))}
        </div>
      </div>
    </Modal>
  );
}
