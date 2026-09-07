import type { Metadata, Viewport } from "next";

import { ToastProvider } from "@/components/ui/toast";
import { AppStoreProvider } from "@/lib/store/app-store";

import "./globals.css";

export const metadata: Metadata = {
  title: "Первые 30 — не проходи первый месяц в одиночку",
  description:
    "Комната на первые 30 дней в университете: недельные шаги, календарь, ИИ-помощник по учёбе и наставник рядом. Наставник создаёт группу, участники входят по коду.",
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/apple-touch-icon.svg", type: "image/svg+xml", sizes: "180x180" }],
  },
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
