"use client";

import { cn } from "@/lib/utils";

const energyOptions = [
  { value: 1, label: "Очень низкая" },
  { value: 2, label: "Низкая" },
  { value: 3, label: "Средняя" },
  { value: 4, label: "Высокая" },
  { value: 5, label: "Очень высокая" },
];

export function EnergySelector({
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
      <legend className="text-sm font-medium">Энергия</legend>
      <div className="grid grid-cols-5 gap-2">
        {energyOptions.map((option) => {
          const active = value === option.value;

          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(option.value)}
              aria-pressed={active}
              aria-label={option.label}
              title={option.label}
              className={cn(
                "flex flex-col items-center justify-end gap-1.5 rounded-2xl px-1 pt-3 pb-2.5 ring-1 ring-inset transition-all duration-200",
                "disabled:opacity-60",
                active
                  ? "bg-accent-soft ring-2 ring-accent shadow-soft"
                  : "bg-surface-muted ring-line hover:bg-accent-soft/60 hover:ring-accent-ring",
              )}
            >
              <span
                className={cn(
                  "w-1.5 rounded-full transition-all duration-200",
                  active ? "bg-accent" : "bg-accent-ring",
                )}
                style={{ height: 8 + option.value * 5 }}
                aria-hidden
              />
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
        {value
          ? energyOptions.find((option) => option.value === value)?.label
          : "От «очень низкой» до «очень высокой»"}
      </p>
    </fieldset>
  );
}
