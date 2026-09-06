import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EnergySelector } from "./energy-selector";

describe("EnergySelector", () => {
  it("отображает все варианты энергии", () => {
    render(<EnergySelector value={0} onChange={() => {}} />);
    expect(screen.getAllByRole("button")).toHaveLength(5);
  });

  it("вызывает onChange с выбранным значением", async () => {
    const onChange = vi.fn();
    render(<EnergySelector value={0} onChange={onChange} />);

    await userEvent.click(screen.getByLabelText("Высокая"));
    expect(onChange).toHaveBeenCalledWith(4);
  });

  it("отмечает активную опцию", () => {
    render(<EnergySelector value={2} onChange={() => {}} />);
    expect(screen.getByLabelText("Низкая")).toHaveAttribute("aria-pressed", "true");
  });
});
