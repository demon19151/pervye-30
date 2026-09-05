"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

import { DirectInbox } from "@/components/direct-inbox";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/page-header";
import { PageSkeleton } from "@/components/ui/states";

export default function CuratorMessagesPage() {
  return (
    <AppShell role="curator">
      <Suspense fallback={<PageSkeleton />}>
        <CuratorMessages />
      </Suspense>
    </AppShell>
  );
}

function CuratorMessages() {
  const searchParams = useSearchParams();

  return (
    <div className="space-y-5">
      <PageHeader
        title="Личные сообщения"
        subtitle="Переписка с участником не попадает в общую ленту группы."
      />
      <DirectInbox initialUserId={searchParams.get("with") ?? undefined} />
    </div>
  );
}
