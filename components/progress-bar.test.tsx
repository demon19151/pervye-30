import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { ProgressBar, ProgressRing } from "./progress-bar";

describe("ProgressBar", () => {
  it("отображает label и hint", () => {
    render(<ProgressBar value={50} label="Прогресс" hint="7/30" />);
    expect(screen.getByText("Прогресс")).toBeInTheDocument();
    expect(screen.getByText("7/30")).toBeInTheDocument();
  });

  it("ограничивает значение сверху и снизу", () => {
    render(<ProgressBar value={150} label="over" />);
    const bar = screen.getByRole("progressbar", { name: "over" });
    expect(bar).toHaveAttribute("aria-valuenow", "100");
  });

  it("не уходит ниже нуля", () => {
    render(<ProgressBar value={-10} label="under" />);
    const bar = screen.getByRole("progressbar", { name: "under" });
    expect(bar).toHaveAttribute("aria-valuenow", "0");
  });

  it("округляет значение", () => {
    render(<ProgressBar value={49.6} label="round" />);
    const bar = screen.getByRole("progressbar", { name: "round" });
    expect(bar).toHaveAttribute("aria-valuenow", "50");
  });
});

describe("ProgressRing", () => {
  it("отображает процент и подпись", () => {
    render(<ProgressRing value={73} caption="выполнено" />);
    expect(screen.getByText("73%")).toBeInTheDocument();
    expect(screen.getByText("выполнено")).toBeInTheDocument();
  });

  it("ограничивает значение диапазоном 0..100", () => {
    render(<ProgressRing value={200} />);
    const ring = screen.getByRole("progressbar");
    expect(ring).toHaveAttribute("aria-valuenow", "100");
  });
});
