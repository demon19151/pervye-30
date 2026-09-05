"use client";

import { useState } from "react";

import { MessageParticipantModal } from "@/components/message-participant-modal";
import { useToast } from "@/components/ui/toast";
import { addDirectMessage } from "@/lib/services/messageService";
import { resolveSignalsForUser } from "@/lib/services/supportService";
import { useAppStore } from "@/lib/store/app-store";
import type { User } from "@/lib/types";
import { toDative } from "@/lib/utils";

/**
 * Сообщение куратора конкретному участнику.
 * Отправка одновременно закрывает сигнал поддержки — куратор уже отреагировал.
 */
export function useWriteToParticipant() {
  const { currentUser, update } = useAppStore();
  const { toast } = useToast();
  const [target, setTarget] = useState<User | null>(null);

  const submit = (text: string) => {
    if (!currentUser || !target) return;

    update((current) => {
      const result = addDirectMessage(current, currentUser.id, target.name, text);
      const next = "error" in result ? current : result.state;
      return resolveSignalsForUser(next, target.id);
    });

    toast(`Сообщение отправлено ${toDative(target.name)}`);
    setTarget(null);
  };

  const modal = (
    <MessageParticipantModal
      open={target !== null}
      participantName={target?.name ?? ""}
      onClose={() => setTarget(null)}
      onSubmit={submit}
    />
  );

  return { openFor: (user: User) => setTarget(user), modal };
}
