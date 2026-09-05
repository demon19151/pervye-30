import {
  CalendarCheck,
  CalendarDays,
  LayoutDashboard,
  ListChecks,
  Megaphone,
  MessagesSquare,
  Settings,
  Trophy,
  TrendingUp,
  UserRound,
  Users,
  type LucideIcon,
} from "lucide-react";

import type { UserRole } from "./types";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Показывать в нижней навигации на мобильном. */
  mobile?: boolean;
};

export const participantNav: NavItem[] = [
  { label: "Сегодня", href: "/participant", icon: CalendarCheck, mobile: true },
  { label: "Сообщения", href: "/direct", icon: MessagesSquare, mobile: true },
  { label: "Группа", href: "/group", icon: Users },
  { label: "Мероприятия", href: "/events", icon: CalendarDays },
  { label: "Прогресс", href: "/progress", icon: TrendingUp, mobile: true },
  { label: "Итоги", href: "/summary", icon: Trophy },
  { label: "Профиль", href: "/profile", icon: UserRound, mobile: true },
];

export const curatorNav: NavItem[] = [
  { label: "Обзор", href: "/curator", icon: LayoutDashboard, mobile: true },
  { label: "Участники", href: "/curator/participants", icon: Users, mobile: true },
  { label: "Сообщения", href: "/curator/messages", icon: MessagesSquare, mobile: true },
  { label: "Мероприятия", href: "/events", icon: CalendarDays, mobile: true },
  { label: "Задания", href: "/curator/tasks", icon: ListChecks },
  { label: "Объявления", href: "/curator/announcements", icon: Megaphone },
  { label: "Настройки", href: "/curator/settings", icon: Settings },
];

export function navForRole(role: UserRole): NavItem[] {
  return role === "curator" ? curatorNav : participantNav;
}

export const groupFeedIcon = MessagesSquare;

/** Куда отправлять пользователя после входа. */
export function homeForRole(role: UserRole): string {
  return role === "curator" ? "/curator" : "/participant";
}
