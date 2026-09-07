/**
 * Доменная модель «Первые 30».
 *
 * Слой типов не зависит от способа хранения: снимок собирается из Supabase,
 * сессия устройства остаётся в localStorage.
 */

export type UserRole = "participant" | "curator";

export type User = {
  id: string;
  name: string;
  role: UserRole;
  /** Эмодзи-аватар: для MVP этого достаточно, поле совместимо с URL картинки. */
  avatar?: string;
  groupId: string;
};

export type Group = {
  id: string;
  name: string;
  description: string;
  inviteCode: string;
  /** Длительность программы в днях. */
  duration: number;
  /** Текущий день программы (1..duration). */
  currentDay: number;
  /** Календарная дата дня 1, YYYY-MM-DD. День 1 = 28 августа после приказа о группах. */
  programStartDate?: string;
  /** false — по ключу больше нельзя войти. По умолчанию набор открыт. */
  enrollmentOpen?: boolean;
  /** Когда наставник завершил программу. Комната остаётся, новые люди не входят. */
  archivedAt?: string;
  curatorId: string;
  weeklyGoal?: WeeklyGoal;
};

export type WeeklyGoal = {
  title: string;
  target: number;
  done: number;
};

export type TaskKind = "required" | "recommended" | "question";

/** Значение ответа: стандартное (yes/no/…) или id кнопки, которую задал куратор. */
export type TaskAnswer = string;

export type TaskAnswerOption = {
  id: string;
  label: string;
  /** Этот вариант подсвечивается куратору как сигнал. */
  needsAttention?: boolean;
};

export type Task = {
  id: string;
  groupId: string;
  /** Неделя программы: 1..4 при стандартных 30 днях. */
  week: number;
  kind: TaskKind;
  title: string;
  description: string;
  /** Кнопки ответа для вопроса. Если нет — стандартные. */
  answerOptions?: TaskAnswerOption[];
};

/** Отметка, что участник закрыл конкретное недельное задание. */
export type TaskCompletion = {
  id: string;
  taskId: string;
  userId: string;
  createdAt: string;
  answer?: TaskAnswer;
  /** Свободный комментарий к шагу-вопросу — его видит наставник. */
  answerNote?: string;
};

export type Message = {
  id: string;
  groupId: string;
  userId: string;
  text: string;
  createdAt: string;
  /** Эмодзи → количество. */
  reactions: Record<string, number>;
  /** Реакции текущего пользователя, чтобы их можно было снять. */
  myReactions?: string[];
};

/** Личная переписка куратора и участника — не попадает в общую ленту группы. */
export type DirectMessage = {
  id: string;
  groupId: string;
  fromUserId: string;
  toUserId: string;
  text: string;
  createdAt: string;
};

export type SupportSignalType = "manual" | "missed_tasks";

export type SupportSignal = {
  id: string;
  userId: string;
  type: SupportSignalType;
  message?: string;
  createdAt: string;
  resolved: boolean;
};

export type Announcement = {
  id: string;
  groupId: string;
  curatorId: string;
  text: string;
  createdAt: string;
};

export type CalendarEventView = {
  userId: string;
  /** Когда участник последний раз открывал вкладку «Мероприятия». */
  lastSeenAt: string;
};

export type CalendarEventResponse = {
  id: string;
  eventId: string;
  userId: string;
  createdAt: string;
};

export type CalendarEvent = {
  id: string;
  groupId: string;
  /** День программы: 1..duration. */
  day: number;
  /** Время в формате HH:mm (например, 10:00). */
  time: string;
  /** Название мероприятия. */
  title: string;
  /** Место (опционально). */
  location?: string;
  /** Ссылка (опционально). */
  link?: string;
  /** Краткое описание. */
  description?: string;
  createdAt: string;
  updatedAt: string;
};

export type Achievement = {
  id: string;
  title: string;
  unlocked: boolean;
};

export type SummaryReflection = {
  id: string;
  userId: string;
  mentorNote: string;
  useful: string;
  unclear: string;
  updatedAt: string;
};

/** Единый снимок состояния приложения — собирается из таблиц Supabase. */
export type AppState = {
  version: number;
  group: Group;
  users: User[];
  tasks: Task[];
  taskCompletions: TaskCompletion[];
  messages: Message[];
  directMessages: DirectMessage[];
  signals: SupportSignal[];
  announcements: Announcement[];
  calendarEvents: CalendarEvent[];
  calendarEventViews: CalendarEventView[];
  calendarEventResponses: CalendarEventResponse[];
  summaryReflections: SummaryReflection[];
  /** Кто сейчас в системе. null — не авторизован. */
  session: Session | null;
};

export type Session = {
  userId: string;
  role: UserRole;
};

/** Производные метрики участника — считаются сервисами, не в UI. */
export type ParticipantStats = {
  user: User;
  /** Выполнение программы к текущему дню, 0..100. */
  progress: number;
  currentDay: number;
  /** Просроченные обязательные задания прошлых недель. */
  missedDays: number;
  completedTasks: number;
  /** Недели, где закрыты все обязательные шаги. */
  closedWeeks: number;
  activeToday: boolean;
  status: ParticipantStatus;
  warnings: Warning[];
};

export type ParticipantStatus = "active" | "missed" | "needs_support";

export type WarningReason = "missed_tasks" | "manual";

export type Warning = {
  reason: WarningReason;
  label: string;
};

export type SummaryReport = {
  user: User;
  completedTasks: number;
  closedWeeks: number;
  achievements: Achievement[];
  /** true, если программа ещё не завершена. */
  preview: boolean;
};
