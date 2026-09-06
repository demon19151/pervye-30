import { describe, expect, it } from "vitest";
import {
  average,
  clamp,
  cn,
  formatDelta,
  formatRelativeTime,
  formatScore,
  formatTime,
  getProgramCalendarOffset,
  getProgramWeekdayLabels,
  isFeminineName,
  pluralize,
  toDative,
} from "./utils";

describe("cn", () => {
  it("склеивает строки через пробел", () => {
    expect(cn("a", "b", "c")).toBe("a b c");
  });

  it("игнорирует falsy значения", () => {
    expect(cn("a", null, undefined, false, "b")).toBe("a b");
  });

  it("разворачивает массивы", () => {
    expect(cn(["a", "b"], "c")).toBe("a b c");
  });

  it("поддерживает объектный формат { class: boolean }", () => {
    expect(cn({ active: true, hidden: false })).toBe("active");
  });
});

describe("formatScore", () => {
  it("возвращает тире для нуля", () => {
    expect(formatScore(0)).toBe("—");
  });

  it("не показывает десятую долю для целых чисел", () => {
    expect(formatScore(4)).toBe("4");
  });

  it("показывает десятую долю для нецелых чисел", () => {
    expect(formatScore(4.3)).toBe("4.3");
  });
});

describe("formatDelta", () => {
  it("добавляет плюс для положительных значений", () => {
    expect(formatDelta(0.8)).toBe("+0.8");
  });

  it("не добавляет плюс для отрицательных значений", () => {
    expect(formatDelta(-1.2)).toBe("-1.2");
  });

  it("корректно обрабатывает ноль", () => {
    expect(formatDelta(0)).toBe("0.0");
  });
});

describe("formatTime / formatRelativeTime", () => {
  it("formatTime возвращает строку времени", () => {
    const result = formatTime(new Date().toISOString());
    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(0);
  });

  it('formatRelativeTime возвращает "только что" для текущего момента', () => {
    expect(formatRelativeTime(new Date().toISOString())).toBe("только что");
  });

  it("formatRelativeTime возвращает минуты для недавнего времени", () => {
    const iso = new Date(Date.now() - 5 * 60_000).toISOString();
    expect(formatRelativeTime(iso)).toBe("5 мин назад");
  });

  it("formatRelativeTime возвращает часы", () => {
    const iso = new Date(Date.now() - 3 * 60 * 60_000).toISOString();
    expect(formatRelativeTime(iso)).toBe("3 ч назад");
  });

  it('formatRelativeTime возвращает "вчера"', () => {
    const iso = new Date(Date.now() - 25 * 60 * 60_000).toISOString();
    expect(formatRelativeTime(iso)).toBe("вчера");
  });

  it("formatRelativeTime возвращает дни", () => {
    const iso = new Date(Date.now() - 3 * 24 * 60 * 60_000).toISOString();
    expect(formatRelativeTime(iso)).toBe("3 дн назад");
  });
});

describe("toDative", () => {
  it("склоняет имена на -ия", () => {
    expect(toDative("Мария")).toBe("Марии");
  });

  it("склоняет имена на -а/-я", () => {
    expect(toDative("Анна")).toBe("Анне");
    expect(toDative("Илья")).toBe("Илье");
  });

  it("склоняет имена на -й/-ь", () => {
    expect(toDative("Андрей")).toBe("Андрею");
  });

  it("склоняет имена на согласную", () => {
    expect(toDative("Максим")).toBe("Максиму");
  });

  it("возвращает пустую строку для пустого имени", () => {
    expect(toDative("  ")).toBe("");
  });
});

describe("isFeminineName", () => {
  it("определяет женские имена", () => {
    expect(isFeminineName("Анна")).toBe(true);
    expect(isFeminineName("Илья")).toBe(true);
  });

  it("определяет мужские имена", () => {
    expect(isFeminineName("Максим")).toBe(false);
  });
});

describe("pluralize", () => {
  it("выбирает форму one", () => {
    expect(pluralize(1, "день", "дня", "дней")).toBe("день");
    expect(pluralize(21, "день", "дня", "дней")).toBe("день");
  });

  it("выбирает форму few", () => {
    expect(pluralize(2, "день", "дня", "дней")).toBe("дня");
    expect(pluralize(3, "день", "дня", "дней")).toBe("дня");
  });

  it("выбирает форму many", () => {
    expect(pluralize(5, "день", "дня", "дней")).toBe("дней");
    expect(pluralize(11, "день", "дня", "дней")).toBe("дней");
    expect(pluralize(0, "день", "дня", "дней")).toBe("дней");
  });
});

describe("getProgramWeekdayLabels", () => {
  it("всегда показывает пн–вс", () => {
    expect(getProgramWeekdayLabels("2026-08-28")).toEqual([
      "Пн",
      "Вт",
      "Ср",
      "Чт",
      "Пт",
      "Сб",
      "Вс",
    ]);
    expect(getProgramWeekdayLabels()).toEqual(["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"]);
  });
});

describe("getProgramCalendarOffset", () => {
  it("сдвигает старт 28 августа 2026 на четыре клетки — пятница", () => {
    expect(getProgramCalendarOffset("2026-08-28")).toBe(4);
  });

  it("не сдвигает понедельник и дату без значения", () => {
    expect(getProgramCalendarOffset("2026-08-31")).toBe(0);
    expect(getProgramCalendarOffset()).toBe(0);
  });
});

describe("clamp", () => {
  it("ограничивает значение сверху и снизу", () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(-5, 0, 10)).toBe(0);
    expect(clamp(15, 0, 10)).toBe(10);
  });
});

describe("average", () => {
  it("возвращает 0 для пустого массива", () => {
    expect(average([])).toBe(0);
  });

  it("считает среднее с округлением до десятых", () => {
    expect(average([1, 2, 3])).toBe(2);
    expect(average([1, 2])).toBe(1.5);
    expect(average([4, 4, 5])).toBe(4.3);
  });
});
