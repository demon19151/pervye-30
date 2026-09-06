import type { ReactNode } from "react";

import {
  cn,
  formatWeekRange,
  getProgramCalendarOffset,
  getProgramWeekdayLabels,
} from "@/lib/utils";

/** Календарь программы: колонки пн–вс, день 1 стоит на своём дне недели. */
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
  const weekdays = getProgramWeekdayLabels();
  const offset = getProgramCalendarOffset(startDate);
  const weekCount = Math.max(1, Math.ceil((offset + duration) / 7));

  return (
    <div className={cn("w-full space-y-3", className)}>
      <div className="grid grid-cols-7 gap-1.5" aria-hidden>
        {weekdays.map((label) => (
          <p key={label} className="text-center text-[11px] font-medium text-subtle">
            {label}
          </p>
        ))}
      </div>

      {Array.from({ length: weekCount }, (_, index) => {
        const week = index + 1;
        const days = Array.from({ length: 7 }, (_, column) => {
          const day = index * 7 + column - offset + 1;
          return day >= 1 && day <= duration ? day : null;
        });
        const firstDay = days.find((day) => day !== null);
        const lastDay = [...days].reverse().find((day) => day !== null);
        const range =
          firstDay != null && lastDay != null
            ? formatWeekRange(startDate, firstDay, lastDay)
            : undefined;
        const filled = days.filter((day) => day !== null).length;
        const isFinale = week === weekCount && filled > 0 && filled < 7;

        return (
          <div key={week} className="space-y-1.5">
            <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-0.5">
              <p className="text-[13px] font-semibold">
                {isFinale ? `Неделя ${week} · финал` : `Неделя ${week}`}
              </p>
              {range ? <p className="text-[12px] text-subtle">{range}</p> : null}
            </div>
            <div className="grid grid-cols-7 gap-1.5">
              {days.map((day, column) =>
                day == null ? (
                  <div
                    key={`empty-${week}-${column}`}
                    aria-hidden
                    className="aspect-square rounded-xl bg-[#f3f2f8]/30"
                  />
                ) : (
                  <div key={day}>{renderDay(day)}</div>
                ),
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
