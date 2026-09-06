export type ClassValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | ClassValue[]
  | Record<string, unknown>;

export function cn(...inputs: ClassValue[]) {
  // Локальная реализация. Для MVP достаточно “склейки” классов и поддержки
  // формата { 'class': boolean }. tailwind-merge/clsx оставляем в зависимостях
  // на будущее, но не используем здесь, чтобы не ловить проблемы RSC/webpack.
  const parts: string[] = [];

  const walk = (value: ClassValue): void => {
    if (!value) return;

    if (typeof value === "string" || typeof value === "number") {
      parts.push(String(value));
      return;
    }

    if (Array.isArray(value)) {
      value.forEach((item) => walk(item));
      return;
    }

    if (typeof value === "object") {
      for (const [key, enabled] of Object.entries(value)) {
        if (enabled) parts.push(key);
      }
    }
  };

  inputs.forEach((item) => walk(item));
  return parts.join(" ");
}

/** «4» вместо «4.0», но «4.3» там, где десятая доля важна. */
export function formatScore(value: number): string {
  if (!value) return "—";
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

export function formatDelta(value: number): string {
  const rounded = Math.round(value * 10) / 10;
  return `${rounded > 0 ? "+" : ""}${rounded.toFixed(1)}`;
}

/** Дата дня программы: день 1 от `programStartDate` (YYYY-MM-DD). */
export function formatProgramDate(startDate: string | undefined, day: number): string | undefined {
  if (!startDate || !Number.isInteger(day) || day < 1) return undefined;

  const [year, month, date] = startDate.split("-").map(Number);
  if (!year || !month || !date) return undefined;

  const value = new Date(year, month - 1, date + (day - 1));
  return value.toLocaleDateString("ru-RU", { day: "numeric", month: "long" });
}

export function formatWeekRange(
  startDate: string | undefined,
  startDay: number,
  endDay: number,
): string | undefined {
  const from = formatProgramDate(startDate, startDay);
  const to = formatProgramDate(startDate, endDay);
  if (!from || !to) return undefined;
  return `${from} — ${to}`;
}

const WEEKDAY_LABELS_FROM_MONDAY = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"] as const;

/** Подписи колонок календаря: всегда пн–вс. */
export function getProgramWeekdayLabels(_startDate?: string): string[] {
  return [...WEEKDAY_LABELS_FROM_MONDAY];
}

/** Сколько пустых ячеек до дня 1, если неделя начинается с понедельника. */
export function getProgramCalendarOffset(startDate?: string): number {
  if (!startDate) return 0;

  const [year, month, date] = startDate.split("-").map(Number);
  if (!year || !month || !date) return 0;

  const weekday = new Date(year, month - 1, date).getDay();
  return weekday === 0 ? 6 : weekday - 1;
}

export function formatTime(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
}

export function formatRelativeTime(iso: string): string {
  const diffMinutes = Math.round((Date.now() - new Date(iso).getTime()) / 60_000);

  if (diffMinutes < 1) return "только что";
  if (diffMinutes < 60) return `${diffMinutes} мин назад`;

  const hours = Math.floor(diffMinutes / 60);
  if (hours < 24) return `${hours} ч назад`;

  const days = Math.floor(hours / 24);
  if (days === 1) return "вчера";
  return `${days} дн назад`;
}

/**
 * Дательный падеж имени: «Написать Ирине», «Написать Максиму».
 * Правил ровно столько, сколько нужно для русских имён в интерфейсе.
 */
export function toDative(name: string): string {
  const value = name.trim();
  if (!value) return value;

  if (/ия$/.test(value)) return `${value.slice(0, -2)}ии`;
  if (/[ая]$/.test(value)) return `${value.slice(0, -1)}е`;
  if (/[йь]$/.test(value)) return `${value.slice(0, -1)}ю`;
  if (/[бвгджзклмнпрстфхцчшщ]$/i.test(value)) return `${value}у`;

  return value;
}

/** Женские имена в демо-группе оканчиваются на -а/-я — этого достаточно для согласования. */
export function isFeminineName(name: string): boolean {
  return /[ая]$/.test(name.trim());
}

/** Склонение русских существительных: pluralize(3, "день", "дня", "дней"). */
export function pluralize(count: number, one: string, few: string, many: string): string {
  const mod10 = count % 10;
  const mod100 = count % 100;

  if (mod100 >= 11 && mod100 <= 14) return many;
  if (mod10 === 1) return one;
  if (mod10 >= 2 && mod10 <= 4) return few;
  return many;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function average(values: number[]): number {
  if (values.length === 0) return 0;
  const sum = values.reduce((acc, value) => acc + value, 0);
  return Math.round((sum / values.length) * 10) / 10;
}
