import type { Metadata, Viewport } from "next";

import { ToastProvider } from "@/components/ui/toast";
import { AppStoreProvider } from "@/lib/store/app-store";

import "./globals.css";

export const metadata: Metadata = {
  title: "Первые 30 — не проходи первый месяц в одиночку",
  description:
    "Платформа для прохождения первых 30 дней важного этапа вместе с небольшой группой и куратором: ежедневные шаги, чек-ины состояния и поддержка рядом.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f5f5fb",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body>
        <AppStoreProvider>
          <ToastProvider>{children}</ToastProvider>
        </AppStoreProvider>
      </body>
    </html>
  );
}
