/**
 * Идентификаторы новых строк. Снимок состояния живёт в Supabase
 * (`lib/supabase/persist.ts`); сессия устройства — в localStorage.
 */
export function createId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}
