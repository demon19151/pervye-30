import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { StatCard } from "./stat-card";

describe("StatCard", () => {
  it("отображает значение и подпись", () => {
    render(<StatCard label="Участников" value={5} />);
    expect(screen.getByText("5")).toBeInTheDocument();
    expect(screen.getByText("Участников")).toBeInTheDocument();
  });

  it("отображает hint, если передан", () => {
    render(<StatCard label="Прогресс" value="80%" hint="за неделю" />);
    expect(screen.getByText("за неделю")).toBeInTheDocument();
  });

  it("не отображает hint, если он не передан", () => {
    render(<StatCard label="Прогресс" value="80%" />);
    expect(screen.queryByText("за неделю")).not.toBeInTheDocument();
  });
});
