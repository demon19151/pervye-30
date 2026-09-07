import { describe, expect, it } from "@jest/globals";
import { createInitialState, DEMO_INVITE_CODE, CURATOR_ID } from "../mockData";
import { getProgramTaskTemplates } from "../mockData";
import {
  archiveGroup,
  createGroup,
  createRoom,
  getCurator,
  getCurrentUser,
  getParticipantDay,
  getParticipants,
  isEnrollmentOpen,
  isValidInviteCode,
  joinGroup,
  removeParticipant,
  rotateInviteCode,
  setCurrentUser,
  setEnrollmentOpen,
  setProgramWeek,
  signOut,
  switchRole,
  updateWeeklyGoal,
} from "./groupService";

describe("groupService", () => {
  it("isValidInviteCode принимает код без учёта регистра", () => {
    const state = createInitialState();
    expect(isValidInviteCode(state, DEMO_INVITE_CODE.toLowerCase())).toBe(true);
    expect(isValidInviteCode(state, "WRONG")).toBe(false);
  });

  describe("joinGroup", () => {
    it("возвращает ошибку для слишком короткого имени", () => {
      const state = createInitialState();
      const result = joinGroup(state, { name: "A", code: DEMO_INVITE_CODE, role: "participant" });
      expect("error" in result).toBe(true);
    });

    it("возвращает ошибку для имени с цифрами", () => {
      const state = createInitialState();
      const result = joinGroup(state, { name: "Anna1", code: DEMO_INVITE_CODE, role: "participant" });
      expect("error" in result).toBe(true);
    });

    it("возвращает ошибку для неверного кода приглашения", () => {
      const state = createInitialState();
      const result = joinGroup(state, { name: "Никита", code: "WRONG", role: "participant" });
      expect("error" in result).toBe(true);
    });

    it("создаёт нового участника при валидных данных", () => {
      const state = createInitialState();
      const result = joinGroup(state, { name: "Никита", code: DEMO_INVITE_CODE, role: "participant" });

      expect("user" in result).toBe(true);
      if ("user" in result) {
        expect(result.user.name).toBe("Никита");
        expect(result.state.session?.userId).toBe(result.user.id);
      }
    });

    it("переиспользует существующего пользователя с тем же именем и ролью", () => {
      const state = createInitialState();
      const first = joinGroup(state, { name: "Никита", code: DEMO_INVITE_CODE, role: "participant" });
      if (!("user" in first)) throw new Error("expected success");

      const second = joinGroup(first.state, {
        name: "никита",
        code: DEMO_INVITE_CODE,
        role: "participant",
      });
      if (!("user" in second)) throw new Error("expected success");

      expect(second.user.id).toBe(first.user.id);
      expect(second.state.users.filter((u) => u.name.toLowerCase() === "никита")).toHaveLength(1);
    });
  });

  it("signOut очищает сессию", () => {
    const state = createInitialState();
    const withSession = { ...state, session: { userId: CURATOR_ID, role: "curator" as const } };
    expect(signOut(withSession).session).toBeNull();
  });

  it("switchRole переключает на первого пользователя нужной роли", () => {
    const state = createInitialState();
    const next = switchRole(state, "curator");
    expect(next.session?.role).toBe("curator");
  });

  it("switchRole не меняет состояние, если роли нет", () => {
    const state = createInitialState();
    const withoutCurator = { ...state, users: state.users.filter((u) => u.role !== "curator") };
    const next = switchRole(withoutCurator, "curator");
    expect(next).toBe(withoutCurator);
  });

  it("setCurrentUser задаёт сессию для существующего пользователя", () => {
    const state = createInitialState();
    const next = setCurrentUser(state, CURATOR_ID);
    expect(next.session?.userId).toBe(CURATOR_ID);
  });

  it("getCurrentUser возвращает null без сессии", () => {
    const state = createInitialState();
    expect(getCurrentUser(state)).toBeNull();
  });

  it("getCurrentUser возвращает пользователя из сессии", () => {
    const state = createInitialState();
    const next = setCurrentUser(state, CURATOR_ID);
    expect(getCurrentUser(next)?.id).toBe(CURATOR_ID);
  });

  it("getParticipants возвращает только участников", () => {
    const state = createInitialState();
    const participants = getParticipants(state);
    expect(participants.every((u) => u.role === "participant")).toBe(true);
  });

  it("getCurator возвращает куратора группы", () => {
    const state = createInitialState();
    expect(getCurator(state)?.id).toBe(CURATOR_ID);
  });

  it("createGroup обновляет параметры группы и сохраняет код", () => {
    const state = createInitialState();
    const next = createGroup(state, { name: "Новая группа", description: "Описание", duration: 45 });
    expect(next.group.name).toBe("Новая группа");
    expect(next.group.duration).toBe(45);
    expect(next.group.inviteCode).toBe(state.group.inviteCode);
    expect(next.group.id).toBe(state.group.id);
  });

  it("createRoom создаёт отдельную комнату с новым ключом", () => {
    const state = createInitialState();
    const next = createRoom(state, {
      name: "Рабочая группа",
      description: "Новый поток",
      duration: 30,
      inviteCode: "P30TEST",
      curatorName: "Ольга",
    });

    expect(next.group.id).not.toBe(state.group.id);
    expect(next.group.inviteCode).toBe("P30TEST");
    expect(next.group.currentDay).toBe(1);
    expect(next.group.programStartDate).toBeDefined();
    expect(next.group.enrollmentOpen).toBe(true);
    expect(next.users).toHaveLength(1);
    expect(next.users[0]?.name).toBe("Ольга");
    expect(next.users[0]?.role).toBe("curator");
    expect(next.session?.userId).toBe(next.users[0]?.id);
    expect(next.tasks).toHaveLength(getProgramTaskTemplates().length);
    expect(next.tasks.every((task) => task.groupId === next.group.id)).toBe(true);
    expect(next.tasks.some((task) => state.tasks.some((demo) => demo.id === task.id))).toBe(false);
    expect(next.calendarEvents).toHaveLength(0);
    expect(next.taskCompletions).toHaveLength(0);
  });

  it("createRoom ставит дату старта и считает текущий день от неё", () => {
    const state = createInitialState();
    const next = createRoom(state, {
      name: "Рабочая группа",
      description: "Новый поток",
      duration: 30,
      programStartDate: "2026-09-01",
      inviteCode: "P30DATE",
      curatorName: "Ольга",
    });

    expect(next.group.programStartDate).toBe("2026-09-01");
    expect(next.group.currentDay).toBeGreaterThanOrEqual(1);
    expect(next.group.currentDay).toBeLessThanOrEqual(30);
  });

  it("createGroup обновляет дату старта", () => {
    const state = createInitialState();
    const next = createGroup(state, {
      name: state.group.name,
      description: state.group.description,
      duration: state.group.duration,
      programStartDate: "2026-09-01",
    });
    expect(next.group.programStartDate).toBe("2026-09-01");
  });

  it("закрытый набор не пускает по ключу", () => {
    const state = createInitialState();
    const closed = setEnrollmentOpen(state, false);
    expect(isEnrollmentOpen(closed.group)).toBe(false);

    const result = joinGroup(closed, { name: "Никита", code: DEMO_INVITE_CODE, role: "participant" });
    expect("error" in result).toBe(true);
    if ("error" in result) expect(result.error).toMatch(/закрыт/i);
  });

  it("archiveGroup закрывает набор", () => {
    const state = createInitialState();
    const archived = archiveGroup(state);
    expect(archived.group.archivedAt).toBeTruthy();
    expect(isEnrollmentOpen(archived.group)).toBe(false);
  });

  it("removeParticipant убирает студента и его отметки", () => {
    const state = createInitialState();
    const next = removeParticipant(state, "u-anna");
    expect(next.users.some((user) => user.id === "u-anna")).toBe(false);
    expect(next.taskCompletions.some((item) => item.userId === "u-anna")).toBe(false);
  });

  it("rotateInviteCode меняет только ключ текущей комнаты", () => {
    const state = createInitialState();
    const next = rotateInviteCode(state, "P30NEWX");
    expect(next.group.id).toBe(state.group.id);
    expect(next.group.inviteCode).toBe("P30NEWX");
  });

  it("createGroup не позволяет duration быть меньше текущего дня", () => {
    const state = createInitialState();
    const next = createGroup(state, { name: "X", description: "", duration: 1 });
    expect(next.group.duration).toBe(state.group.currentDay);
  });

  it("updateWeeklyGoal обновляет прогресс недельной цели", () => {
    const state = createInitialState();
    const next = updateWeeklyGoal(state, 4);
    expect(next.group.weeklyGoal?.done).toBe(4);
  });

  it("setProgramWeek переключает текущий день на начало выбранной недели", () => {
    const state = createInitialState();
    expect(state.group.currentDay).toBe(7);

    const week2 = setProgramWeek(state, 2);
    expect(week2.group.currentDay).toBe(8);

    const week4 = setProgramWeek(week2, 4);
    expect(week4.group.currentDay).toBe(22);

    const sameWeek = setProgramWeek(week4, 4);
    expect(sameWeek).toBe(week4);
  });

  it("getParticipantDay совпадает с текущим днём группы", () => {
    const state = createInitialState();
    expect(getParticipantDay(state, "u-anna")).toBe(state.group.currentDay);
  });
});
