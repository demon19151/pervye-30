import type { ReactNode } from "react";

import { cn, formatWeekRange, getProgramWeekdayLabels } from "@/lib/utils";

/** Календарь программы: по 7 дней в строке, последняя неделя может быть короче. */
export function ProgramWeekCalendar({
  duration,
  startDate,
  className,
  renderDay,
}: {
  duration: number;
  startDate?: string;
  className?: string;
  renderDay: (day: number) => ReactNode;
}) {
  const weekCount = Math.max(1, Math.ceil(duration / 7));
  const weekdays = getProgramWeekdayLabels(startDate);
  const lastWeekLength = duration - (weekCount - 1) * 7;
  const lastWeekIsFinale = lastWeekLength > 0 && lastWeekLength < 7;

  return (
    <div className={cn("w-full space-y-3", className)}>
      <div className="grid grid-cols-7 gap-1.5" aria-hidden>
        {weekdays.map((label, index) => (
          <p
            key={`${label}-${index}`}
            className="text-center text-[11px] font-medium text-subtle"
          >
            {label}
          </p>
        ))}
      </div>

      {Array.from({ length: weekCount }, (_, index) => {
        const week = index + 1;
        const start = index * 7 + 1;
        const end = Math.min(start + 6, duration);
        const range = formatWeekRange(startDate, start, end);
        const isFinale = week === weekCount && lastWeekIsFinale;

        return (
          <div key={week} className="space-y-1.5">
            <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-0.5">
              <p className="text-[13px] font-semibold">
                {isFinale ? `Неделя ${week} · финал` : `Неделя ${week}`}
              </p>
              {range ? <p className="text-[12px] text-subtle">{range}</p> : null}
            </div>
            <div className="grid grid-cols-7 gap-1.5">
              {Array.from({ length: 7 }, (_, offset) => {
                const day = start + offset;
                if (day > duration) {
                  return (
                    <div
                      key={`empty-${week}-${offset}`}
                      aria-hidden
                      className="aspect-square rounded-xl bg-[#f3f2f8]/30"
                    />
                  );
                }
                return <div key={day}>{renderDay(day)}</div>;
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
