"use client";

import { useEffect, useState } from "react";
import { Megaphone } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Field, Textarea } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";

const suggestion = "Завтра в 11:00 знакомимся с командой продукта.";

export function AnnouncementModal({
  open,
  onClose,
  error,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  error?: string | null;
  onSubmit: (text: string) => void;
}) {
  const [text, setText] = useState("");

  useEffect(() => {
    if (open) setText("");
  }, [open]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Новое объявление"
      description="Объявление появится в ленте группы у всех участников."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Отмена
          </Button>
          <Button onClick={() => onSubmit(text)} disabled={text.trim().length < 3}>
            <Megaphone className="size-4" />
            Отправить группе
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <Field label="Текст объявления" htmlFor="announcement-text" error={error ?? undefined}>
          <Textarea
            id="announcement-text"
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder={suggestion}
            maxLength={300}
            autoFocus
          />
        </Field>

        <button
          type="button"
          onClick={() => setText(suggestion)}
          className="text-[13px] font-medium text-accent transition-colors hover:text-accent-strong"
        >
          Подставить пример: «{suggestion}»
        </button>
      </div>
    </Modal>
  );
}
