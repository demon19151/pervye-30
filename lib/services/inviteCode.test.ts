import { describe, expect, it } from "vitest";

import { generateInviteCode, normalizeInviteCode } from "./inviteCode";

describe("inviteCode", () => {
  it("generateInviteCode выдаёт P30 и 4 символа без 0/O/1/I", () => {
    const code = generateInviteCode();
    expect(code).toMatch(/^P30[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{4}$/);
  });

  it("normalizeInviteCode приводит код к верхнему регистру", () => {
    expect(normalizeInviteCode("  p30work ")).toBe("P30WORK");
    expect(normalizeInviteCode("P30 WORK")).toBe("P30WORK");
  });
});
