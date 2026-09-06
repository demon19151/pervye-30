import type {
  Announcement,
  AppState,
  CalendarEvent,
  DirectMessage,
  Group,
  Message,
  SupportSignal,
  Task,
  TaskCompletion,
  User,
} from "./types";

/** Демонстрационный код приглашения, который показывается на лендинге и в /join. */
export const DEMO_INVITE_CODE = "P30WORK";

export const DEFAULT_DURATION = 30;

export const CURATOR_ID = "u-elena";
export const DEMO_PARTICIPANT_ID = "u-anna";

export const GROUP_ID = "g-work";

const demoGroup: Group = {
  id: GROUP_ID,
  name: "Первые 30 дней в университете",
  description: "Небольшая группа для комфортной адаптации в первые недели.",
  inviteCode: DEMO_INVITE_CODE,
  duration: DEFAULT_DURATION,
  currentDay: 7,
  /** 28 августа — день после приказа о формировании академических групп. */
  programStartDate: "2026-08-28",
  curatorId: CURATOR_ID,
  weeklyGoal: {
    title: "Закрыть шаги первой недели: куратор, встреча, доступы.",
    target: 6,
    done: 4,
  },
};

const demoUsers: User[] = [
  { id: CURATOR_ID, name: "Елена", role: "curator", avatar: "👩‍🏫", groupId: GROUP_ID },
  { id: DEMO_PARTICIPANT_ID, name: "Анна", role: "participant", avatar: "👩", groupId: GROUP_ID },
  { id: "u-maxim", name: "Максим", role: "participant", avatar: "🧑", groupId: GROUP_ID },
  { id: "u-irina", name: "Ирина", role: "participant", avatar: "👩‍🦰", groupId: GROUP_ID },
  { id: "u-dmitry", name: "Дмитрий", role: "participant", avatar: "🧔", groupId: GROUP_ID },
];

/** Недельные шаги разных типов: обязательные, рекомендуемые, вопрос и статус. */
const demoTasks: Task[] = [
  {
    id: "t-w1-1",
    groupId: GROUP_ID,
    week: 1,
    kind: "required",
    title: "Познакомиться с куратором",
    description: "Сделано, когда ты понимаешь, к кому обращаться, и знаешь, как написать куратору.",
  },
  {
    id: "t-w1-8",
    groupId: GROUP_ID,
    week: 1,
    kind: "required",
    title: "Ознакомиться с расписанием своей группы",
    description: "Сделано, когда знаешь, где смотреть пары и какой корпус у ближайшего занятия.",
  },
  {
    id: "t-w1-3",
    groupId: GROUP_ID,
    week: 1,
    kind: "required",
    title: "Посетить вводную встречу",
    description: "Сделано, когда ты был на собрании или заранее написал куратору, если не смог прийти.",
  },
  {
    id: "t-w1-4",
    groupId: GROUP_ID,
    week: 1,
    kind: "required",
    title: "Найти учебный корпус, аудитории и деканат на карте",
    description: "Сделано, когда ты увереннее ориентируешься и не ищешь корпус в чате каждое утро.",
  },
  {
    id: "t-w1-6",
    groupId: GROUP_ID,
    week: 1,
    kind: "required",
    title: "Проверить доступ к почте, личному кабинету и учебным платформам",
    description: "Сделано, когда вход работает и ты можешь пользоваться нужными ресурсами.",
  },
  {
    id: "t-w1-7",
    groupId: GROUP_ID,
    week: 1,
    kind: "question",
    title: "Понимаешь ли ты, где искать расписание?",
    description: "Если пока нет — куратор увидит ответ и поможет. Это не провал, а сигнал.",
  },
  {
    id: "t-w1-2",
    groupId: GROUP_ID,
    week: 1,
    kind: "recommended",
    title: "Познакомиться хотя бы с тремя одногруппниками",
    description: "Не обязательно сегодня. Сделано, когда появилось первое живое общение в группе.",
  },
  {
    id: "t-w1-5",
    groupId: GROUP_ID,
    week: 1,
    kind: "recommended",
    title: "Узнать, где библиотека, столовая, медпункт и места отдыха",
    description: "Рекомендуем на этой неделе. Сделано, когда знаешь основные сервисы кампуса.",
  },
  {
    id: "t-w2-1",
    groupId: GROUP_ID,
    week: 2,
    kind: "required",
    title: "Ознакомиться с учебным планом и требованиями преподавателей",
    description: "Сделано, когда понимаешь структуру обучения и что ждут на ближайших дисциплинах.",
  },
  {
    id: "t-w2-2",
    groupId: GROUP_ID,
    week: 2,
    kind: "required",
    title: "Узнать правила посещения, сдачи работ и пересдач",
    description: "Сделано, когда меньше риска пропустить важное требование или дедлайн.",
  },
  {
    id: "t-w2-3",
    groupId: GROUP_ID,
    week: 2,
    kind: "required",
    title: "Найти контакты деканата, старосты и технической поддержки",
    description: "Сделано, когда знаешь, куда обращаться с разными вопросами — не только к куратору.",
  },
  {
    id: "t-w2-4",
    groupId: GROUP_ID,
    week: 2,
    kind: "status",
    title: "Как тебе даётся первая учебная неделя?",
    description: "Выбери статус — куратор увидит, если есть вопрос или нужна помощь.",
  },
  {
    id: "t-w3-3",
    groupId: GROUP_ID,
    week: 3,
    kind: "required",
    title: "Проверить первые учебные дедлайны",
    description: "Сделано, когда есть список ближайших сдач — и ты не держишь их только в голове.",
  },
  {
    id: "t-w3-2",
    groupId: GROUP_ID,
    week: 3,
    kind: "status",
    title: "Как проходит адаптация?",
    description: "Короткий статус для куратора: всё понятно, есть вопрос или нужна помощь.",
  },
  {
    id: "t-w3-1",
    groupId: GROUP_ID,
    week: 3,
    kind: "recommended",
    title: "Посетить одно мероприятие или вступить в студенческое объединение",
    description: "Сделано, когда ты откликнулся в календаре или записался в объединение.",
  },
  {
    id: "t-w4-1",
    groupId: GROUP_ID,
    week: 4,
    kind: "required",
    title: "Оценить свой первый месяц по шкале от 1 до 5",
    description: "Сделано, когда ты коротко записал, что получилось за первый месяц и что ещё хочешь закрыть.",
  },
  {
    id: "t-w4-2",
    groupId: GROUP_ID,
    week: 4,
    kind: "status",
    title: "Что осталось непонятным после первого месяца?",
    description: "Выбери статус. Если есть вопрос или нужна помощь — куратор увидит это отдельно.",
  },
  {
    id: "t-w4-3",
    groupId: GROUP_ID,
    week: 4,
    kind: "recommended",
    title: "Составить план на следующий месяц",
    description: "Сделано, когда есть 2–3 своих шага на октябрь: учёба, документы или внеучебка.",
  },
];

/** Шаблон шагов для новой комнаты — без id и groupId. */
export function getProgramTaskTemplates(): Omit<Task, "id" | "groupId">[] {
  return demoTasks.map(({ week, kind, title, description }) => ({ week, kind, title, description }));
}

function buildTaskCompletions(): TaskCompletion[] {
  const now = new Date().toISOString();
  const mark = (userId: string, taskIds: string[]): TaskCompletion[] =>
    taskIds.map((taskId, index) => ({
      id: `tc-${userId}-${index + 1}`,
      taskId,
      userId,
      createdAt: now,
    }));

  return [
    ...mark(DEMO_PARTICIPANT_ID, ["t-w1-1", "t-w1-2", "t-w1-3", "t-w1-4"]),
    ...mark("u-maxim", ["t-w1-1", "t-w1-3"]),
    ...mark("u-irina", ["t-w1-1"]),
    ...mark("u-dmitry", ["t-w1-1", "t-w1-2", "t-w1-3", "t-w1-4", "t-w1-5", "t-w1-6", "t-w1-8"]),
    {
      id: "tc-dmitry-q",
      taskId: "t-w1-7",
      userId: "u-dmitry",
      createdAt: now,
      answer: "yes",
    },
  ];
}

function buildMessages(now: Date): Message[] {
  const minutesAgo = (minutes: number) =>
    new Date(now.getTime() - minutes * 60_000).toISOString();

  return [
    {
      id: "m-1",
      groupId: GROUP_ID,
      userId: CURATOR_ID,
      text: "Всем привет! На этой неделе фокус простой — знакомимся с сокурсниками и разбираемся в правилах учёбы.",
      createdAt: minutesAgo(320),
      reactions: { "❤️": 3, "👍": 2 },
    },
    {
      id: "m-2",
      groupId: GROUP_ID,
      userId: DEMO_PARTICIPANT_ID,
      text: "Сегодня наконец разобралась с тем, как оформляются учебные заявления и документы.",
      createdAt: minutesAgo(190),
      reactions: { "👏": 2, "🔥": 1 },
    },
    {
      id: "m-3",
      groupId: GROUP_ID,
      userId: "u-maxim",
      text: "Познакомился ещё с двумя сокурсниками. Уже становится намного проще.",
      createdAt: minutesAgo(120),
      reactions: { "👍": 2 },
    },
    {
      id: "m-4",
      groupId: GROUP_ID,
      userId: "u-irina",
      text: "Сегодня было немного сложно, но я разобралась с основной задачей.",
      createdAt: minutesAgo(74),
      reactions: { "❤️": 2, "👏": 1 },
    },
    {
      id: "m-5",
      groupId: GROUP_ID,
      userId: "u-dmitry",
      text: "Получил первую обратную связь от преподавателя 👍",
      createdAt: minutesAgo(35),
      reactions: { "🔥": 2, "👏": 1 },
    },
  ];
}

function buildSignals(_now: Date): SupportSignal[] {
  return [];
}

function buildDirectMessages(now: Date): DirectMessage[] {
  const minutesAgo = (minutes: number) =>
    new Date(now.getTime() - minutes * 60_000).toISOString();

  return [
    {
      id: "dm-1",
      groupId: GROUP_ID,
      fromUserId: CURATOR_ID,
      toUserId: DEMO_PARTICIPANT_ID,
      text: "Анна, если что-то будет непонятно — пиши сюда. Это только между нами, группа не увидит.",
      createdAt: minutesAgo(250),
    },
    {
      id: "dm-2",
      groupId: GROUP_ID,
      fromUserId: DEMO_PARTICIPANT_ID,
      toUserId: CURATOR_ID,
      text: "Спасибо! Как раз хотела уточнить про оформление учебных документов, но в общем чате стеснялась.",
      createdAt: minutesAgo(210),
    },
  ];
}

function buildAnnouncements(now: Date): Announcement[] {
  return [
    {
      id: "a-1",
      groupId: GROUP_ID,
      curatorId: CURATOR_ID,
      text: "В пятницу в 16:00 короткая встреча группы — обсудим итоги первой недели.",
      createdAt: new Date(now.getTime() - 240 * 60_000).toISOString(),
    },
  ];
}

/** Значения для предпросмотра итоговой страницы, пока программа не завершена. */
export const SUMMARY_PREVIEW = {
  completedTasks: 23,
  closedWeeks: 4,
};

/** Согласуется по роду, чтобы текст не звучал чужим для участницы. */
export function curatorSummaryNote(feminine: boolean): string {
  return `Ты хорошо ${feminine ? "вошла" : "вошёл"} в ритм команды. Особенно заметно, как изменилось твоё понимание процессов за последний месяц.`;
}

export const STATE_VERSION = 11;

/** Собирает полный демонстрационный снимок состояния. */
export function createInitialState(now: Date = new Date()): AppState {
  return {
    version: STATE_VERSION,
    group: { ...demoGroup, weeklyGoal: { ...demoGroup.weeklyGoal! } },
    users: demoUsers.map((user) => ({ ...user })),
    tasks: demoTasks.map((task) => ({ ...task })),
    taskCompletions: buildTaskCompletions(),
    messages: buildMessages(now),
    directMessages: buildDirectMessages(now),
    signals: buildSignals(now),
    announcements: buildAnnouncements(now),
    calendarEventViews: [],
    calendarEventResponses: [],
    calendarEvents: [
      {
        id: "ce-meeting",
        groupId: GROUP_ID,
        day: 5,
        time: "10:00",
        title: "Собрание первокурсников",
        location: "ГУК, холл 1 этажа",
        description: "Первая встреча курса: куда ходить на пары, кто куратор и где появится чат группы.",
        createdAt: new Date(now.getTime() - 4 * 24 * 60_000).toISOString(),
        updatedAt: new Date(now.getTime() - 2 * 24 * 60_000).toISOString(),
      },
      {
        id: "ce-1",
        groupId: GROUP_ID,
        day: 25,
        time: "10:00",
        title: "Хакатон",
        location: "Онлайн (пример)",
        link: "https://example.com/hackathon",
        description: "Короткий хакатон с командной работой. Уточни детали по ссылке и отметься, пойдёшь ли.",
        createdAt: new Date(now.getTime() - 3 * 24 * 60_000).toISOString(),
        updatedAt: new Date(now.getTime() - 24 * 60_000).toISOString(),
      },
    ],
    session: null,
  };
}
