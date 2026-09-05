"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { CheckCircle2, Info, TriangleAlert } from "lucide-react";

import { cn } from "@/lib/utils";

type ToastTone = "success" | "info" | "warning";

type Toast = {
  id: number;
  text: string;
  tone: ToastTone;
};

type ToastContextValue = {
  toast: (text: string, tone?: ToastTone) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const tones: Record<ToastTone, { icon: ReactNode; className: string }> = {
  success: {
    icon: <CheckCircle2 className="size-5 text-success" />,
    className: "ring-success/25",
  },
  info: {
    icon: <Info className="size-5 text-accent" />,
    className: "ring-accent/20",
  },
  warning: {
    icon: <TriangleAlert className="size-5 text-warning" />,
    className: "ring-warning/30",
  },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((text: string, tone: ToastTone = "success") => {
    const id = Date.now() + Math.random();
    setToasts((current) => [...current, { id, text, tone }]);

    window.setTimeout(() => {
      setToasts((current) => current.filter((item) => item.id !== id));
    }, 3200);
  }, []);

  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}

      <div
        className="pointer-events-none fixed inset-x-4 bottom-24 z-[60] flex flex-col items-center gap-2 sm:inset-x-auto sm:right-6 sm:bottom-6 sm:items-end"
        aria-live="polite"
      >
        {toasts.map((item) => (
          <div
            key={item.id}
            className={cn(
              "pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-2xl bg-surface px-4 py-3.5 text-sm font-medium shadow-raised ring-1 ring-inset animate-rise",
              tones[item.tone].className,
            )}
          >
            {tones[item.tone].icon}
            <span className="min-w-0">{item.text}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast должен использоваться внутри ToastProvider");
  return context;
}
