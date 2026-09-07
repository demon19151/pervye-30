import { tokenizeQuery } from "./tokenize";
import { retrieve } from "./retrieve";
import { buildSearchQuery } from "./prompt";

describe("bot retrieval for clinic and military", () => {
  it("stems clinic and army queries to useful tokens", () => {
    const clinic = tokenizeQuery("Ты знаешь про поликлинику УрФУ?");
    const army = tokenizeQuery("Расскажи про отсрочку от армии");
    expect(clinic.some((token) => token.startsWith("поликлиник"))).toBe(true);
    expect(army.some((token) => token.startsWith("отсроч") || token.startsWith("арм"))).toBe(true);
  });

  it("finds clinic and military docs", async () => {
    const clinic = await retrieve("Ты знаешь про поликлинику УрФУ?");
    const army = await retrieve("Расскажи про отсрочку от армии");
    const clinicTitles = clinic.chunks.map((item) => item.chunk.title);
    const armyTitles = army.chunks.map((item) => item.chunk.title);

    expect(clinicTitles.some((title) => /поликлиник/i.test(title))).toBe(true);
    expect(armyTitles.some((title) => /военн|отсрочк/i.test(title))).toBe(true);
    expect(clinic.confidence).toBeGreaterThanOrEqual(0.12);
    expect(army.confidence).toBeGreaterThanOrEqual(0.12);
  });

  it("does not glue a new army question to a clinic question", () => {
    const query = buildSearchQuery("Расскажи про отсрочку от армии", [
      "Ты знаешь про поликлинику УрФУ?",
    ]);
    expect(query.toLowerCase()).not.toContain("поликлиник");
  });
});
