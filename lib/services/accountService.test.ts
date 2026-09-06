import { describe, expect, it } from "vitest";

import {
  accountErrorMessage,
  sanitizeLogin,
  sanitizeName,
  validateLogin,
  validateName,
  validatePassword,
  validatePasswordConfirm,
} from "./accountService";

describe("accountService", () => {
  it("sanitizeLogin оставляет латиницу, цифры и _", () => {
    expect(sanitizeLogin("  Olga.K! ")).toBe("olgak");
    expect(sanitizeLogin("Curator_01")).toBe("curator_01");
  });

  it("sanitizeName оставляет только буквы", () => {
    expect(sanitizeName("Ольга2")).toBe("Ольга");
  });

  it("validateLogin принимает корректный логин", () => {
    expect(validateLogin("olga_1")).toBeNull();
    expect(validateLogin("ab")).toBeTruthy();
  });

  it("validateName требует буквы", () => {
    expect(validateName("Ольга")).toBeNull();
    expect(validateName("A")).toBeTruthy();
  });

  it("validatePassword проверяет длину и совпадение", () => {
    expect(validatePassword("12345")).toBeTruthy();
    expect(validatePassword("secret1")).toBeNull();
    expect(validatePasswordConfirm("secret1", "secret2")).toBeTruthy();
    expect(validatePasswordConfirm("secret1", "secret1")).toBeNull();
  });

  it("accountErrorMessage переводит коды базы", () => {
    expect(accountErrorMessage(new Error("LOGIN_TAKEN"))).toBe("Такой логин уже занят.");
    expect(accountErrorMessage(new Error("GROUP_NOT_FOUND"))).toBe("Код группы не найден.");
    expect(accountErrorMessage({ message: "GROUP_NOT_FOUND" })).toBe("Код группы не найден.");
    expect(accountErrorMessage({ foo: 1 })).toBe("Не удалось создать аккаунт. Проверьте код группы и логин.");
  });
});
