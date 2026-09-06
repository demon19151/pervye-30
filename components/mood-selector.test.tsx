import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MoodSelector } from "./mood-selector";

describe("MoodSelector", () => {
  it("отображает все варианты настроения", () => {
    render(<MoodSelector value={0} onChange={() => {}} />);
    expect(screen.getAllByRole("button")).toHaveLength(5);
  });

  it("вызывает onChange с выбранным значением", async () => {
    const onChange = vi.fn();
    render(<MoodSelector value={0} onChange={onChange} />);

    await userEvent.click(screen.getByLabelText("Хорошо — 4 из 5"));
    expect(onChange).toHaveBeenCalledWith(4);
  });

  it("отмечает выбранную опцию через aria-pressed", () => {
    render(<MoodSelector value={3} onChange={() => {}} />);
    expect(screen.getByLabelText("Нормально — 3 из 5")).toHaveAttribute("aria-pressed", "true");
  });

  it("блокирует выбор, если disabled=true", () => {
    render(<MoodSelector value={0} onChange={() => {}} disabled />);
    expect(screen.getByRole("group")).toBeDisabled();
  });

  it('показывает подсказку по умолчанию, если значение не выбрано', () => {
    render(<MoodSelector value={0} onChange={() => {}} />);
    expect(screen.getByText("Выбери, как ты себя чувствуешь")).toBeInTheDocument();
  });
});
