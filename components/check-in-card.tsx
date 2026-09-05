"use client";

import { useState } from "react";
import { CheckCircle2, HeartHandshake } from "lucide-react";

import { EnergySelector } from "@/components/energy-selector";
import { MoodSelector } from "@/components/mood-selector";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { Textarea } from "@/components/ui/field";

export function CheckInCard({
  initialMood,
  initialEnergy,
  initialNote,
  saved,
  onSave,
}: {
  initialMood: number;
  initialEnergy: number;
  initialNote: string;
  /** true, если чек-ин за этот день уже сохранён. */
  saved: boolean;
  onSave: (input: { mood: number; energy: number; note: string }) => void;
}) {
  const [mood, setMood] = useState(initialMood);
  const [energy, setEnergy] = useState(initialEnergy);
  const [note, setNote] = useState(initialNote);
  const [error, setError] = useState<string | null>(null);

  const handleSave = () => {
    if (!mood || !energy) {
      setError("Отметьте настроение и энергию, чтобы сохранить день.");
      return;
    }

    setError(null);
    onSave({ mood, energy, note });
  };

  return (
    <Card className="p-5 sm:p-6">
      <CardHeader
        icon={<HeartHandshake className="size-5" />}
        title="Как прошёл твой день?"
        description="Две отметки и пара слов — этого достаточно."
        action={
          saved ? (
            <Badge tone="success">
              <CheckCircle2 className="size-3.5" />
              Сохранён
            </Badge>
          ) : undefined
        }
      />

      <div className="mt-6 space-y-6">
        <MoodSelector value={mood} onChange={setMood} />
        <EnergySelector value={energy} onChange={setEnergy} />

        <div className="space-y-2">
          <label htmlFor="day-note" className="block text-sm font-medium">
            Заметка
          </label>
          <Textarea
            id="day-note"
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Что хочется отметить сегодня?"
            maxLength={400}
          />
          <p className="text-right text-xs text-subtle tabular-nums">{note.length} / 400</p>
        </div>

        {error && <p className="text-[13px] text-danger">{error}</p>}

        <Button size="lg" fullWidth onClick={handleSave} disabled={!mood || !energy}>
          {saved ? "Обновить день" : "Сохранить день"}
        </Button>
      </div>
    </Card>
  );
}
