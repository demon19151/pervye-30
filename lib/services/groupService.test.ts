import { describe, expect, it } from "vitest";
import { createInitialState, DEMO_INVITE_CODE, CURATOR_ID } from "../mockData";
import {
  createGroup,
  getCurator,
  getCurrentUser,
  getParticipants,
  isValidInviteCode,
  joinGroup,
  setCurrentUser,
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

  it("createGroup обновляет параметры группы", () => {
    const state = createInitialState();
    const next = createGroup(state, { name: "Новая группа", description: "Описание", duration: 45 });
    expect(next.group.name).toBe("Новая группа");
    expect(next.group.duration).toBe(45);
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
});
