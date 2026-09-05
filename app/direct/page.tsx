"use client";

import { Card } from "@/components/ui/card";
import { DirectThread } from "@/components/direct-thread";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/page-header";
import { useAppStore } from "@/lib/store/app-store";
import { getCurator } from "@/lib/services/groupService";

export default function DirectPage() {
  return (
    <AppShell role="participant">
      <div className="space-y-5">
        <PageHeader
          title="Сообщения с куратором"
          subtitle="Личная переписка — группа не видит эти сообщения."
        />
        <DirectThreadForParticipant />
      </div>
    </AppShell>
  );
}

function DirectThreadForParticipant() {
  const { state, currentUser } = useAppStore();

  if (!state || !currentUser) return null;

  const curator = getCurator(state);

  if (!curator) {
    return (
      <Card className="p-6">
        <p className="text-sm text-muted">Куратор группы ещё не назначен.</p>
      </Card>
    );
  }

  return (
    <DirectThread
      counterpart={curator}
      title={`Переписка с куратором`}
      description="Только вы двое видите эту переписку."
    />
  );
}

