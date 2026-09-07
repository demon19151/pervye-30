"use client";

import { cn } from "@/lib/utils";

export const AVATAR_CHOICES = [
  "🙂",
  "😊",
  "👩",
  "👨",
  "🧑",
  "👩‍🎓",
  "👨‍🎓",
  "👩‍🏫",
  "🧑‍🏫",
  "🐱",
  "🦊",
  "🐼",
  "🌻",
  "🌙",
  "⭐",
  "🌿",
] as const;

export function AvatarPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const selected = value || "🙂";

  return (
    <div className="flex flex-wrap gap-1.5">
      {AVATAR_CHOICES.map((emoji) => (
        <button
          key={emoji}
          type="button"
          onClick={() => onChange(emoji)}
          aria-label={`Аватар ${emoji}`}
          aria-pressed={emoji === selected}
          className={cn(
            "flex size-10 items-center justify-center rounded-xl text-lg transition-colors",
            emoji === selected
              ? "bg-accent-soft ring-2 ring-accent"
              : "bg-surface-muted ring-1 ring-inset ring-line hover:ring-accent-ring",
          )}
        >
          {emoji}
        </button>
      ))}
    </div>
  );
}
