"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { loadState, resetState, saveState } from "../storage";
import { getCurrentUser } from "../services/groupService";
import type { AppState, User } from "../types";

type AppStoreValue = {
  /** null, пока состояние не прочитано из localStorage (этап loading). */
  state: AppState | null;
  ready: boolean;
  currentUser: User | null;
  /** Применяет чистую функцию сервиса к состоянию и сохраняет результат. */
  update: (updater: (state: AppState) => AppState) => void;
  reset: () => void;
};

const AppStoreContext = createContext<AppStoreValue | null>(null);

export function AppStoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState | null>(null);

  // Читаем состояние только на клиенте: так серверный HTML не расходится с DOM.
  useEffect(() => {
    setState(loadState());
  }, []);

  const update = useCallback((updater: (state: AppState) => AppState) => {
    setState((current) => {
      if (!current) return current;

      const next = updater(current);
      saveState(next);
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    setState(resetState());
  }, []);

  const currentUser = useMemo(() => (state ? getCurrentUser(state) : null), [state]);

  const value = useMemo<AppStoreValue>(
    () => ({ state, ready: state !== null, currentUser, update, reset }),
    [state, currentUser, update, reset],
  );

  return <AppStoreContext.Provider value={value}>{children}</AppStoreContext.Provider>;
}

export function useAppStore(): AppStoreValue {
  const context = useContext(AppStoreContext);
  if (!context) {
    throw new Error("useAppStore должен использоваться внутри AppStoreProvider");
  }
  return context;
}
