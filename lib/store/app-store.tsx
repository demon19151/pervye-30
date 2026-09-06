"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { fetchState, persistState, resetRemoteState, saveSession } from "../supabase/persist";
import { getCurrentUser } from "../services/groupService";
import type { AppState, User } from "../types";

type AppStoreValue = {
  /** null, пока состояние не прочитано из Supabase. */
  state: AppState | null;
  ready: boolean;
  error: string | null;
  currentUser: User | null;
  /** Применяет чистую функцию сервиса к состоянию и сохраняет результат. */
  update: (updater: (state: AppState) => AppState) => void;
  /** Как update, но дожидается записи — нужно перед attach_account. */
  updateAsync: (updater: (state: AppState) => AppState) => Promise<AppState | null>;
  /** Подменяет снимок без записи таблиц — вход в комнату или аккаунт. */
  hydrate: (next: AppState) => void;
  reset: () => void;
};

const AppStoreContext = createContext<AppStoreValue | null>(null);

export function AppStoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const persistedRef = useRef<AppState | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetchState()
      .then((next) => {
        if (cancelled) return;
        persistedRef.current = next;
        setState(next);
        setError(null);
      })
      .catch((cause: unknown) => {
        if (cancelled) return;
        setError(cause instanceof Error ? cause.message : "Не удалось загрузить данные.");
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const update = useCallback((updater: (state: AppState) => AppState) => {
    setState((current) => {
      if (!current) return current;

      const next = updater(current);
      const previous = persistedRef.current ?? current;
      persistedRef.current = next;
      void persistState(previous, next).catch((cause: unknown) => {
        setError(cause instanceof Error ? cause.message : "Не удалось сохранить данные.");
      });
      return next;
    });
  }, []);

  const updateAsync = useCallback(async (updater: (state: AppState) => AppState) => {
    const current = persistedRef.current;
    if (!current) return null;

    const next = updater(current);
    persistedRef.current = next;
    setState(next);
    await persistState(current, next);
    return next;
  }, []);

  const hydrate = useCallback((next: AppState) => {
    persistedRef.current = next;
    setState(next);
    saveSession(next.session);
    setError(null);
  }, []);

  const reset = useCallback(() => {
    void resetRemoteState()
      .then((next) => {
        persistedRef.current = next;
        setState(next);
        setError(null);
      })
      .catch((cause: unknown) => {
        setError(cause instanceof Error ? cause.message : "Не удалось сбросить демо-данные.");
      });
  }, []);

  const currentUser = useMemo(() => (state ? getCurrentUser(state) : null), [state]);

  const value = useMemo<AppStoreValue>(
    () => ({ state, ready: state !== null, error, currentUser, update, updateAsync, hydrate, reset }),
    [state, error, currentUser, update, updateAsync, hydrate, reset],
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
