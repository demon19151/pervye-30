import { createInitialState, GROUP_ID, STATE_VERSION } from "../mockData";
import { generateInviteCode, normalizeInviteCode } from "../services/inviteCode";
import type {
  Announcement,
  AppState,
  CalendarEvent,
  CalendarEventResponse,
  CalendarEventView,
  DirectMessage,
  Group,
  Message,
  Session,
  SupportSignal,
  Task,
  TaskAnswer,
  TaskCompletion,
  User,
  UserRole,
} from "../types";
import { getSupabase } from "./client";

const SESSION_KEY = "pervye-30:session";

type GroupRow = {
  id: string;
  name: string;
  description: string;
  invite_code: string;
  duration: number;
  current_day: number;
  program_start_date: string | null;
  curator_id: string;
  weekly_goal_title: string | null;
  weekly_goal_target: number | null;
  weekly_goal_done: number | null;
};

function throwIfError(error: { message: string } | null, action: string) {
  if (error) throw new Error(`${action}: ${error.message}`);
}

function loadSession(): Session | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    return null;
  }
}

export function saveSession(session: Session | null) {
  if (typeof window === "undefined") return;
  if (!session) {
    window.localStorage.removeItem(SESSION_KEY);
    return;
  }
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

function mapGroup(row: GroupRow): Group {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    inviteCode: row.invite_code,
    duration: row.duration,
    currentDay: row.current_day,
    programStartDate: row.program_start_date ?? undefined,
    curatorId: row.curator_id,
    weeklyGoal:
      row.weekly_goal_title && row.weekly_goal_target != null && row.weekly_goal_done != null
        ? {
            title: row.weekly_goal_title,
            target: row.weekly_goal_target,
            done: row.weekly_goal_done,
          }
        : undefined,
  };
}

function groupRow(group: Group) {
  return {
    id: group.id,
    name: group.name,
    description: group.description,
    invite_code: group.inviteCode,
    duration: group.duration,
    current_day: group.currentDay,
    program_start_date: group.programStartDate ?? null,
    curator_id: group.curatorId,
    weekly_goal_title: group.weeklyGoal?.title ?? null,
    weekly_goal_target: group.weeklyGoal?.target ?? null,
    weekly_goal_done: group.weeklyGoal?.done ?? null,
  };
}

async function syncById<T extends { id: string }>(
  table: string,
  prev: T[],
  next: T[],
  toRow: (item: T) => Record<string, unknown>,
) {
  const db = getSupabase();
  const prevIds = new Set(prev.map((item) => item.id));
  const nextIds = new Set(next.map((item) => item.id));
  const removed = [...prevIds].filter((id) => !nextIds.has(id));

  if (removed.length > 0) {
    const { error } = await db.from(table).delete().in("id", removed);
    throwIfError(error, `delete ${table}`);
  }

  const changed = next.filter((item) => {
    const old = prev.find((entry) => entry.id === item.id);
    return !old || JSON.stringify(old) !== JSON.stringify(item);
  });

  if (changed.length > 0) {
    const { error } = await db.from(table).upsert(changed.map(toRow));
    throwIfError(error, `upsert ${table}`);
  }
}

export async function findGroupIdByInviteCode(code: string): Promise<string | null> {
  const db = getSupabase();
  const { data, error } = await db
    .from("groups")
    .select("id")
    .eq("invite_code", normalizeInviteCode(code))
    .maybeSingle();
  throwIfError(error, "find group");
  return (data?.id as string | undefined) ?? null;
}

export async function generateUniqueInviteCode(): Promise<string> {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const code = generateInviteCode();
    try {
      const existing = await findGroupIdByInviteCode(code);
      if (!existing) return code;
    } catch {
      return code;
    }
  }

  return generateInviteCode();
}

async function resolveGroupId(preferredGroupId?: string): Promise<string | null> {
  const db = getSupabase();

  if (preferredGroupId) {
    const { data, error } = await db.from("groups").select("id").eq("id", preferredGroupId).maybeSingle();
    throwIfError(error, "load group");
    if (data?.id) return data.id as string;
  }

  const session = loadSession();
  if (session?.userId) {
    const { data, error } = await db.from("users").select("group_id").eq("id", session.userId).maybeSingle();
    throwIfError(error, "load session user");
    if (data?.group_id) return data.group_id as string;
  }

  const { data: demo, error: demoError } = await db.from("groups").select("id").eq("id", GROUP_ID).maybeSingle();
  throwIfError(demoError, "load demo group");
  if (demo?.id) return demo.id as string;

  const { data: first, error: firstError } = await db.from("groups").select("id").limit(1).maybeSingle();
  throwIfError(firstError, "load first group");
  return (first?.id as string | undefined) ?? null;
}

function emptyRelatedState(base: AppState): AppState {
  return {
    ...base,
    users: [],
    tasks: [],
    taskCompletions: [],
    messages: [],
    directMessages: [],
    signals: [],
    announcements: [],
    calendarEvents: [],
    calendarEventResponses: [],
    calendarEventViews: [],
    session: null,
  };
}

async function assembleState(groupId: string): Promise<AppState> {
  const db = getSupabase();

  const [group, users, tasks, messages, directMessages, announcements, events] = await Promise.all([
    db.from("groups").select("*").eq("id", groupId).maybeSingle(),
    db.from("users").select("*").eq("group_id", groupId),
    db.from("tasks").select("*").eq("group_id", groupId),
    db.from("messages").select("*").eq("group_id", groupId),
    db.from("direct_messages").select("*").eq("group_id", groupId),
    db.from("announcements").select("*").eq("group_id", groupId),
    db.from("calendar_events").select("*").eq("group_id", groupId),
  ]);

  for (const result of [group, users, tasks, messages, directMessages, announcements, events]) {
    throwIfError(result.error, "load");
  }

  if (!group.data) {
    throw new Error("load: группа не найдена.");
  }

  const userIds = (users.data ?? []).map((row) => row.id as string);
  const eventIds = (events.data ?? []).map((row) => row.id as string);

  const [completions, signals, responses, views] = await Promise.all([
    userIds.length
      ? db.from("task_completions").select("*").in("user_id", userIds)
      : Promise.resolve({ data: [], error: null }),
    userIds.length
      ? db.from("signals").select("*").in("user_id", userIds)
      : Promise.resolve({ data: [], error: null }),
    eventIds.length
      ? db.from("calendar_event_responses").select("*").in("event_id", eventIds)
      : Promise.resolve({ data: [], error: null }),
    userIds.length
      ? db.from("calendar_event_views").select("*").in("user_id", userIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  for (const result of [completions, signals, responses, views]) {
    throwIfError(result.error, "load");
  }

  return {
    version: STATE_VERSION,
    group: mapGroup(group.data as GroupRow),
    users: (users.data ?? []).map((row) => ({
      id: row.id as string,
      name: row.name as string,
      role: row.role as UserRole,
      avatar: (row.avatar as string | null) ?? undefined,
      groupId: row.group_id as string,
    })),
    tasks: (tasks.data ?? []).map((row) => ({
      id: row.id as string,
      groupId: row.group_id as string,
      week: row.week as number,
      kind: row.kind as Task["kind"],
      title: row.title as string,
      description: row.description as string,
    })),
    taskCompletions: (completions.data ?? []).map((row) => ({
      id: row.id as string,
      taskId: row.task_id as string,
      userId: row.user_id as string,
      createdAt: row.created_at as string,
      answer: (row.answer as TaskAnswer | null) ?? undefined,
    })),
    messages: (messages.data ?? []).map((row) => ({
      id: row.id as string,
      groupId: row.group_id as string,
      userId: row.user_id as string,
      text: row.text as string,
      createdAt: row.created_at as string,
      reactions: (row.reactions as Record<string, number>) ?? {},
    })),
    directMessages: (directMessages.data ?? []).map((row) => ({
      id: row.id as string,
      groupId: row.group_id as string,
      fromUserId: row.from_user_id as string,
      toUserId: row.to_user_id as string,
      text: row.text as string,
      createdAt: row.created_at as string,
    })),
    signals: (signals.data ?? []).map((row) => ({
      id: row.id as string,
      userId: row.user_id as string,
      type: row.type as SupportSignal["type"],
      message: (row.message as string | null) ?? undefined,
      createdAt: row.created_at as string,
      resolved: Boolean(row.resolved),
    })),
    announcements: (announcements.data ?? []).map((row) => ({
      id: row.id as string,
      groupId: row.group_id as string,
      curatorId: row.curator_id as string,
      text: row.text as string,
      createdAt: row.created_at as string,
    })),
    calendarEvents: (events.data ?? []).map((row) => ({
      id: row.id as string,
      groupId: row.group_id as string,
      day: row.day as number,
      time: row.time as string,
      title: row.title as string,
      location: (row.location as string | null) ?? undefined,
      link: (row.link as string | null) ?? undefined,
      description: (row.description as string | null) ?? undefined,
      createdAt: row.created_at as string,
      updatedAt: row.updated_at as string,
    })),
    calendarEventResponses: (responses.data ?? []).map((row) => ({
      id: row.id as string,
      eventId: row.event_id as string,
      userId: row.user_id as string,
      createdAt: row.created_at as string,
    })),
    calendarEventViews: (views.data ?? []).map((row) => ({
      userId: row.user_id as string,
      lastSeenAt: row.last_seen_at as string,
    })),
    session: loadSession(),
  };
}

export async function fetchState(preferredGroupId?: string): Promise<AppState> {
  const groupId = await resolveGroupId(preferredGroupId);

  if (!groupId) {
    const fresh = createInitialState();
    await persistState(emptyRelatedState(fresh), fresh);
    return { ...fresh, session: loadSession() };
  }

  return assembleState(groupId);
}

export async function persistState(prev: AppState, next: AppState): Promise<void> {
  const db = getSupabase();
  const previous = prev.group.id === next.group.id ? prev : emptyRelatedState(prev);

  const { error: groupError } = await db.from("groups").upsert(groupRow(next.group));
  throwIfError(groupError, "upsert groups");

  await syncById<User>("users", previous.users, next.users, (user) => ({
    id: user.id,
    name: user.name,
    role: user.role,
    avatar: user.avatar ?? null,
    group_id: user.groupId,
  }));

  await syncById<Task>("tasks", previous.tasks, next.tasks, (task) => ({
    id: task.id,
    group_id: task.groupId,
    week: task.week,
    kind: task.kind,
    title: task.title,
    description: task.description,
  }));

  await syncById<TaskCompletion>("task_completions", previous.taskCompletions, next.taskCompletions, (item) => ({
    id: item.id,
    task_id: item.taskId,
    user_id: item.userId,
    created_at: item.createdAt,
    answer: item.answer ?? null,
  }));

  await syncById<Message>("messages", previous.messages, next.messages, (item) => ({
    id: item.id,
    group_id: item.groupId,
    user_id: item.userId,
    text: item.text,
    created_at: item.createdAt,
    reactions: item.reactions,
  }));

  await syncById<DirectMessage>("direct_messages", previous.directMessages, next.directMessages, (item) => ({
    id: item.id,
    group_id: item.groupId,
    from_user_id: item.fromUserId,
    to_user_id: item.toUserId,
    text: item.text,
    created_at: item.createdAt,
  }));

  await syncById<SupportSignal>("signals", previous.signals, next.signals, (item) => ({
    id: item.id,
    user_id: item.userId,
    type: item.type,
    message: item.message ?? null,
    created_at: item.createdAt,
    resolved: item.resolved,
  }));

  await syncById<Announcement>("announcements", previous.announcements, next.announcements, (item) => ({
    id: item.id,
    group_id: item.groupId,
    curator_id: item.curatorId,
    text: item.text,
    created_at: item.createdAt,
  }));

  await syncById<CalendarEvent>("calendar_events", previous.calendarEvents, next.calendarEvents, (item) => ({
    id: item.id,
    group_id: item.groupId,
    day: item.day,
    time: item.time,
    title: item.title,
    location: item.location ?? null,
    link: item.link ?? null,
    description: item.description ?? null,
    created_at: item.createdAt,
    updated_at: item.updatedAt,
  }));

  await syncById<CalendarEventResponse>(
    "calendar_event_responses",
    previous.calendarEventResponses,
    next.calendarEventResponses,
    (item) => ({
      id: item.id,
      event_id: item.eventId,
      user_id: item.userId,
      created_at: item.createdAt,
    }),
  );

  const prevViews = previous.calendarEventViews;
  const nextViews = next.calendarEventViews;
  const removedViews = prevViews
    .filter((view) => !nextViews.some((item) => item.userId === view.userId))
    .map((view) => view.userId);

  if (removedViews.length > 0) {
    const { error } = await db.from("calendar_event_views").delete().in("user_id", removedViews);
    throwIfError(error, "delete calendar_event_views");
  }

  const changedViews = nextViews.filter((view) => {
    const old = prevViews.find((item) => item.userId === view.userId);
    return !old || JSON.stringify(old) !== JSON.stringify(view);
  });

  if (changedViews.length > 0) {
    const { error } = await db.from("calendar_event_views").upsert(
      changedViews.map((view: CalendarEventView) => ({
        user_id: view.userId,
        last_seen_at: view.lastSeenAt,
      })),
    );
    throwIfError(error, "upsert calendar_event_views");
  }

  saveSession(next.session);
}

export async function resetRemoteState(): Promise<AppState> {
  const db = getSupabase();
  const tables = [
    "calendar_event_responses",
    "calendar_event_views",
    "calendar_events",
    "task_completions",
    "tasks",
    "messages",
    "direct_messages",
    "signals",
    "announcements",
    "users",
    "groups",
  ];

  for (const table of tables) {
    const column = table === "calendar_event_views" ? "user_id" : "id";
    const { error } = await db.from(table).delete().neq(column, "");
    throwIfError(error, `reset ${table}`);
  }

  const fresh = createInitialState();
  await persistState(
    {
      ...fresh,
      users: [],
      tasks: [],
      taskCompletions: [],
      messages: [],
      directMessages: [],
      signals: [],
      announcements: [],
      calendarEvents: [],
      calendarEventResponses: [],
      calendarEventViews: [],
      session: null,
    },
    { ...fresh, session: null },
  );
  saveSession(null);
  return { ...fresh, session: null };
}
