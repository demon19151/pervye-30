"use client";

import { useEffect, useState } from "react";
import { HeartHandshake } from "lucide-react";

import { ConversationList } from "@/components/conversation-list";
import { DirectThread } from "@/components/direct-thread";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/states";
import { getCuratorConversations } from "@/lib/services/directMessageService";
import { getUserById } from "@/lib/services/groupService";
import { useAppStore } from "@/lib/store/app-store";

export function DirectInbox({
  initialUserId,
  className,
}: {
  initialUserId?: string;
  className?: string;
}) {
  const { state } = useAppStore();
  const [selectedId, setSelectedId] = useState(initialUserId);

  useEffect(() => {
    if (initialUserId) setSelectedId(initialUserId);
  }, [initialUserId]);

  if (!state) return null;

  const conversations = getCuratorConversations(state);
  const selected =
    (selectedId ? getUserById(state, selectedId) : undefined) ??
    conversations.find((item) => item.count > 0)?.participant ??
    conversations[0]?.participant;

  return (
    <div className={className}>
      <div className="grid gap-5 lg:grid-cols-5">
        <Card className="p-3 sm:p-4 lg:col-span-2">
          <p className="px-2 pt-1 pb-3 text-sm font-semibold">Участники</p>
          <ConversationList
            conversations={conversations}
            selectedId={selected?.id}
            onSelect={setSelectedId}
          />
        </Card>

        {selected ? (
          <DirectThread
            counterpart={selected}
            title={selected.name}
            description="Только вы двое видите эту переписку."
            className="lg:col-span-3"
          />
        ) : (
          <Card className="p-6 lg:col-span-3">
            <EmptyState
              icon={<HeartHandshake className="size-5" />}
              title="Пока некому писать"
              description="Когда в группе появятся участники, личные сообщения будут здесь."
            />
          </Card>
        )}
      </div>
    </div>
  );
}
