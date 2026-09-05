"use client";

import { HeartHandshake } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function SupportRequestCard({
  pending,
  onOpen,
}: {
  /** true, если сигнал уже отправлен и куратор его ещё не закрыл. */
  pending: boolean;
  onOpen: () => void;
}) {
  return (
    <Card tone={pending ? "accent" : "default"} className="p-5 sm:p-6">
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent-strong">
          <HeartHandshake className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-base font-semibold">Нужна поддержка?</h2>
            {pending && <Badge tone="accent">Сигнал отправлен</Badge>}
          </div>
          <p className="mt-1.5 text-sm leading-relaxed text-muted">
            {pending
              ? "Куратор уже видит, что тебе может понадобиться поддержка. Он свяжется с тобой."
              : "Иногда достаточно сказать, что сейчас непросто. Куратор увидит сигнал и напишет первым."}
          </p>

          <Button
            variant={pending ? "outline" : "secondary"}
            size="sm"
            className="mt-4"
            onClick={onOpen}
          >
            {pending ? "Отправить ещё раз" : "Нужна поддержка"}
          </Button>
        </div>
      </div>
    </Card>
  );
}
