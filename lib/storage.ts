import { createInitialState, STATE_VERSION } from "./mockData";
import type { AppState } from "./types";

const STORAGE_KEY = "pervye-30:state";

/**
 * Единственное место, которое знает, где физически лежат данные.
 * Чтобы перейти на Supabase/PostgreSQL, достаточно заменить реализацию
 * `loadState` / `saveState` на сетевые вызовы — сервисы и UI не изменятся.
 */
export function loadState(): AppState {
  if (typeof window === "undefined") {
    return createInitialState();
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const fresh = createInitialState();
      saveState(fresh);
      return fresh;
    }

    const parsed = JSON.parse(raw) as AppState;
    if (!parsed || parsed.version !== STATE_VERSION) {
      const fresh = createInitialState();
      saveState(fresh);
      return fresh;
    }

    return parsed;
  } catch {
    const fresh = createInitialState();
    saveState(fresh);
    return fresh;
  }
}

export function saveState(state: AppState): void {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Приватный режим браузера или переполненное хранилище — работаем в памяти.
  }
}

export function resetState(): AppState {
  const fresh = createInitialState();
  saveState(fresh);
  return fresh;
}

export function createId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}
