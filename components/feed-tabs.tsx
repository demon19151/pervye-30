"use client";

import { cn } from "@/lib/utils";

export type FeedTab = "group" | "direct";

export function FeedTabs({
  value,
  onChange,
  directLabel,
}: {
  value: FeedTab;
  onChange: (tab: FeedTab) => void;
  directLabel: string;
}) {
  const tabs: { id: FeedTab; label: string }[] = [
    { id: "group", label: "Лента группы" },
    { id: "direct", label: directLabel },
  ];

  return (
    <div
      role="tablist"
      aria-label="Сообщения"
      className="grid grid-cols-2 gap-1 rounded-2xl bg-surface-muted p-1 ring-1 ring-inset ring-line"
    >
      {tabs.map((tab) => {
        const active = value === tab.id;

        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(tab.id)}
            className={cn(
              "rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
              active
                ? "bg-surface text-accent-strong shadow-soft"
                : "text-muted hover:text-foreground",
            )}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
