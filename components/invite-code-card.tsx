"use client";

import { useState } from "react";
import { Check, Copy, KeyRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function InviteCodeCard({
  code,
  description = "Отправьте код участникам — по нему они войдут в группу.",
  className,
}: {
  code: string;
  description?: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      // Буфер обмена может быть недоступен — код всё равно виден на экране.
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card tone="accent" className={cn("p-5 sm:p-6", className)}>
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-surface text-accent-strong">
          <KeyRound className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-accent-strong">Код приглашения</p>
          <p className="mt-2 font-mono text-3xl font-semibold tracking-[0.2em] text-foreground sm:text-4xl">
            {code}
          </p>
          <p className="mt-2.5 text-[13px] text-muted">{description}</p>

          <Button
            variant={copied ? "success" : "outline"}
            size="sm"
            className="mt-4"
            onClick={handleCopy}
          >
            {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
            {copied ? "Скопировано" : "Скопировать код"}
          </Button>
        </div>
      </div>
    </Card>
  );
}
