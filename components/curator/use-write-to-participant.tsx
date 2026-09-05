"use client";

import { useState } from "react";

import { MessageParticipantModal } from "@/components/message-participant-modal";
import { useToast } from "@/components/ui/toast";
import { addDirectMessage } from "@/lib/services/directMessageService";
import { resolveAttentionForUser } from "@/lib/services/supportService";
import { useAppStore } from "@/lib/store/app-store";
import type { User } from "@/lib/types";
import { toDative } from "@/lib/utils";

/**
 * Личное сообщение куратора участнику.
 * Уходит в приватную переписку и закрывает сигнал поддержки.
 */
export function useWriteToParticipant() {
  const { currentUser, update } = useAppStore();
  const { toast } = useToast();
  const [target, setTarget] = useState<User | null>(null);

  const submit = (text: string) => {
    if (!currentUser || !target) return;

    const recipient = target;

    update((current) => {
      const result = addDirectMessage(current, currentUser.id, recipient.id, text);
      const next = "error" in result ? current : result.state;
      return resolveAttentionForUser(next, recipient.id);
    });

    toast(`Сообщение отправлено ${toDative(recipient.name)}`);
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
