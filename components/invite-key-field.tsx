"use client";

import { RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";

export function InviteKeyField({
  code,
  onRefresh,
  refreshing = false,
  hint = "Участники войдут в комнату по этому ключу.",
}: {
  code: string;
  onRefresh: () => void;
  refreshing?: boolean;
  hint?: string;
}) {
  return (
    <Field label="Ключ комнаты" hint={hint}>
      <div className="flex flex-wrap items-center gap-3">
        <p className="font-mono text-2xl font-semibold tracking-[0.2em] text-foreground">{code}</p>
        <Button type="button" variant="outline" size="sm" onClick={onRefresh} disabled={refreshing}>
          <RefreshCw className="size-4" />
          Другой ключ
        </Button>
      </div>
    </Field>
  );
}
