"use client";

import { useEffect, useState } from "react";
import { Check, HeartHandshake } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { supportOptions } from "@/lib/services/supportService";
import { cn } from "@/lib/utils";

/**
 * «Нужна поддержка» — обычная человеческая просьба обратить внимание.
 * Никаких оценок состояния: только выбор из трёх нейтральных формулировок.
 */
export function SupportSignalModal({
  open,
  onClose,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (option: string) => void;
}) {
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    if (open) setSelected(null);
  }, [open]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Нужна поддержка"
      description="Куратор увидит, что тебе может понадобиться поддержка."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Не сейчас
          </Button>
          <Button onClick={() => selected && onSubmit(selected)} disabled={!selected}>
            <HeartHandshake className="size-4" />
            Отправить сигнал
          </Button>
        </>
      }
    >
      <div className="space-y-2">
        {supportOptions.map((option) => {
          const active = selected === option;

          return (
            <button
              key={option}
              type="button"
              onClick={() => setSelected(option)}
              aria-pressed={active}
              className={cn(
                "flex w-full items-center justify-between gap-3 rounded-2xl px-4 py-3.5 text-left text-[15px] ring-1 ring-inset transition-all duration-200",
                active
                  ? "bg-accent-soft font-medium text-accent-strong ring-2 ring-accent"
                  : "bg-surface-muted ring-line hover:bg-accent-soft/60 hover:ring-accent-ring",
              )}
            >
              {option}
              {active && <Check className="size-5 shrink-0" />}
            </button>
          );
        })}
      </div>
    </Modal>
  );
}
