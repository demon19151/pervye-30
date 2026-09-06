import type {
  Announcement,
  AppState,
  CalendarEvent,
  DailyCheckIn,
  DirectMessage,
  Group,
  Message,
  SupportSignal,
  Task,
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
  curatorId: CURATOR_ID,
  weeklyGoal: {
    title: "Познакомиться с сокурсниками и понять основные правила учёбы.",
    target: 4,
    done: 3,
  },
};

const demoUsers: User[] = [
  { id: CURATOR_ID, name: "Елена", role: "curator", avatar: "👩‍🏫", groupId: GROUP_ID },
  { id: DEMO_PARTICIPANT_ID, name: "Анна", role: "participant", avatar: "👩", groupId: GROUP_ID },
  { id: "u-maxim", name: "Максим", role: "participant", avatar: "🧑", groupId: GROUP_ID },
  { id: "u-irina", name: "Ирина", role: "participant", avatar: "👩‍🦰", groupId: GROUP_ID },
  { id: "u-dmitry", name: "Дмитрий", role: "participant", avatar: "🧔", groupId: GROUP_ID },
];

/** Задания первой недели программы «Первые 30 дней в университете». */
const demoTasks: Task[] = [
  {
    id: "t-1",
    groupId: GROUP_ID,
    day: 1,
    title: "Записать свои ожидания от первого месяца",
    description:
      "Опиши, каким ты хочешь видеть себя через месяц: что понимать, что уметь и с кем уже свободно общаться.",
  },
  {
    id: "t-2",
    groupId: GROUP_ID,
    day: 2,
    title: "Познакомиться с тремя сокурсниками",
    description:
      "Найди трёх человек из группы и коротко поговори с ними: что у вас по учёбе и как вы будете пересекаться в университете.",
  },
  {
    id: "t-3",
    groupId: GROUP_ID,
    day: 3,
    title: "Узнать, как устроены основные процессы",
    description:
      "Разберись, как в команде появляются задачи, кто их согласует и где смотреть статус. Запиши шаги своими словами.",
  },
  {
    id: "t-4",
    groupId: GROUP_ID,
    day: 4,
    title: "Задать один вопрос, который давно откладывался",
    description:
      "Выбери вопрос, который кажется «слишком простым», и всё-таки задай его. Обычно именно он экономит больше всего времени.",
  },
  {
    id: "t-5",
    groupId: GROUP_ID,
    day: 5,
    title: "Отметить первое маленькое достижение",
    description:
      "Найди то, что уже получилось — пусть даже небольшое. Запиши, что именно помогло этого добиться.",
  },
  {
    id: "t-6",
    groupId: GROUP_ID,
    day: 6,
    title: "Попросить обратную связь",
    description:
      "Попроси преподавателя или тьютора коротко сказать, что уже идёт хорошо и на что стоит обратить внимание.",
  },
  {
    id: "t-7",
    groupId: GROUP_ID,
    day: 7,
    title: "Подвести итоги первой недели",
    description:
      "Запиши, что уже получилось узнать, что удивило и что хотелось бы улучшить на следующей неделе.",
  },
];

type CheckInSeed = {
  userId: string;
  /** Значения по дням, начиная с первого дня программы. */
  days: Array<{ completed: boolean; mood: number; energy: number; note?: string }>;
};

/**
 * Демонстрационные состояния участников (§20 брифа).
 *
 * «Текущий день» участника выводится из данных: это первый день без чек-ина,
 * ограниченный текущим днём группы. Поэтому у Анны — день 7, у Максима — 6,
 * у Ирины — 5, а у Дмитрия, закрывшего седьмой день, — 7.
 */
const checkInSeeds: CheckInSeed[] = [
  {
    // Анна — активная: 6 закрытых дней, седьмой ждёт её в демо-сценарии.
    userId: DEMO_PARTICIPANT_ID,
    days: [
      { completed: true, mood: 3, energy: 3, note: "Много новых имён, но первый день прошёл спокойно." },
      { completed: true, mood: 4, energy: 3 },
      { completed: true, mood: 4, energy: 4, note: "Разобралась, где искать статусы задач." },
      { completed: true, mood: 4, energy: 4 },
      { completed: true, mood: 4, energy: 4 },
      { completed: true, mood: 4, energy: 4, note: "Получила первую обратную связь, оказалось не страшно." },
    ],
  },
  {
    // Максим — один пропуск на четвёртом дне.
    userId: "u-maxim",
    days: [
      { completed: true, mood: 3, energy: 4 },
      { completed: true, mood: 4, energy: 3 },
      { completed: true, mood: 4, energy: 3 },
      { completed: false, mood: 4, energy: 3, note: "День ушёл на встречи, задание не успел." },
      { completed: true, mood: 4, energy: 3 },
    ],
  },
  {
    // Ирина — низкое настроение и два пропущенных дня.
    userId: "u-irina",
    days: [
      { completed: true, mood: 3, energy: 3 },
      { completed: true, mood: 2, energy: 2 },
      { completed: false, mood: 2, energy: 2, note: "Пока сложно понять, к кому идти с вопросами." },
      { completed: false, mood: 2, energy: 2 },
    ],
  },
  {
    // Дмитрий — очень активный, седьмой день уже закрыт.
    userId: "u-dmitry",
    days: [
      { completed: true, mood: 4, energy: 3 },
      { completed: true, mood: 4, energy: 4 },
      { completed: true, mood: 5, energy: 4 },
      { completed: true, mood: 5, energy: 4 },
      { completed: true, mood: 5, energy: 4 },
      { completed: true, mood: 5, energy: 4 },
      { completed: true, mood: 5, energy: 4, note: "Первая неделя прошла лучше, чем я ожидал." },
    ],
  },
];

function buildCheckIns(now: Date): DailyCheckIn[] {
  const result: DailyCheckIn[] = [];

  for (const seed of checkInSeeds) {
    seed.days.forEach((value, index) => {
      const day = index + 1;
      const updatedAt = new Date(now);
      updatedAt.setDate(updatedAt.getDate() - (demoGroup.currentDay - day));

      result.push({
        id: `ci-${seed.userId}-${day}`,
        userId: seed.userId,
        day,
        completed: value.completed,
        mood: value.mood,
        energy: value.energy,
        note: value.note,
        updatedAt: updatedAt.toISOString(),
      });
    });
  }

  return result;
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

function buildSignals(now: Date): SupportSignal[] {
  return [
    {
      id: "s-1",
      userId: "u-irina",
      type: "manual",
      message: "Сейчас просто тяжело",
      createdAt: new Date(now.getTime() - 96 * 60_000).toISOString(),
      resolved: false,
    },
  ];
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
  activeDays: 27,
  moodDelta: 0.8,
};

/** Согласуется по роду, чтобы текст не звучал чужим для участницы. */
export function curatorSummaryNote(feminine: boolean): string {
  return `Ты хорошо ${feminine ? "вошла" : "вошёл"} в ритм команды. Особенно заметно, как изменилось твоё понимание процессов за последний месяц.`;
}

export const STATE_VERSION = 6;

/** Собирает полный демонстрационный снимок состояния. */
export function createInitialState(now: Date = new Date()): AppState {
  return {
    version: STATE_VERSION,
    group: { ...demoGroup, weeklyGoal: { ...demoGroup.weeklyGoal! } },
    users: demoUsers.map((user) => ({ ...user })),
    tasks: demoTasks.map((task) => ({ ...task })),
    checkIns: buildCheckIns(now),
    messages: buildMessages(now),
    directMessages: buildDirectMessages(now),
    signals: buildSignals(now),
    announcements: buildAnnouncements(now),
    calendarEventViews: [],
    calendarEventResponses: [],
    calendarEvents: [
      {
        id: "ce-1",
        groupId: GROUP_ID,
        day: 4,
        time: "10:00",
        title: "Хакатон",
        location: "Онлайн (пример)",
        link: "https://example.com/hackathon",
        description: "Тестовое мероприятие: короткий хакатон с командной работой. Уточни детали по ссылке.",
        createdAt: new Date(now.getTime() - 3 * 24 * 60_000).toISOString(),
        updatedAt: new Date(now.getTime() - 24 * 60_000).toISOString(),
      },
    ],
    session: null,
  };
}
