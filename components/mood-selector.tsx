"use client";

import { cn } from "@/lib/utils";

const moodOptions = [
  { value: 1, emoji: "😞", label: "Тяжело" },
  { value: 2, emoji: "🙁", label: "Не очень" },
  { value: 3, emoji: "😐", label: "Нормально" },
  { value: 4, emoji: "🙂", label: "Хорошо" },
  { value: 5, emoji: "😄", label: "Отлично" },
];

export function MoodSelector({
  value,
  onChange,
  disabled,
}: {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}) {
  return (
    <fieldset disabled={disabled} className="space-y-2.5">
      <legend className="text-sm font-medium">Настроение</legend>
      <div className="grid grid-cols-5 gap-2">
        {moodOptions.map((option) => {
          const active = value === option.value;

          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(option.value)}
              aria-pressed={active}
              aria-label={`${option.label} — ${option.value} из 5`}
              className={cn(
                "flex flex-col items-center gap-1 rounded-2xl px-1 py-3 ring-1 ring-inset transition-all duration-200",
                "disabled:opacity-60",
                active
                  ? "bg-accent-soft ring-2 ring-accent shadow-soft"
                  : "bg-surface-muted ring-line hover:bg-accent-soft/60 hover:ring-accent-ring",
              )}
            >
              <span className="text-2xl leading-none">{option.emoji}</span>
              <span
                className={cn(
                  "text-[11px] font-medium tabular-nums",
                  active ? "text-accent-strong" : "text-subtle",
                )}
              >
                {option.value}
              </span>
            </button>
          );
        })}
      </div>
      <p className="text-[13px] text-muted">
        {value ? moodOptions.find((option) => option.value === value)?.label : "Выбери, как ты себя чувствуешь"}
      </p>
    </fieldset>
  );
}
