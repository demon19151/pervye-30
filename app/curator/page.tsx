"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Activity,
  HeartHandshake,
  ListChecks,
  Megaphone,
  TrendingUp,
  Users,
} from "lucide-react";

import { AnnouncementModal } from "@/components/announcement-modal";
import { CreateTaskModal } from "@/components/create-task-modal";
import { useWriteToParticipant } from "@/components/curator/use-write-to-participant";
import { GroupFeed } from "@/components/group-feed";
import { InviteCodeCard } from "@/components/invite-code-card";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/page-header";
import { ParticipantTable } from "@/components/participant-table";
import { StatCard } from "@/components/stat-card";
import { SupportAlert } from "@/components/support-alert";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { addAnnouncement } from "@/lib/services/announcementService";
import { getAllParticipantStats, getGroupStats } from "@/lib/services/statsService";
import { resolveSignalsForUser } from "@/lib/services/supportService";
import { addTask, getNextFreeDay, type CreateTaskInput } from "@/lib/services/taskService";
import { useAppStore } from "@/lib/store/app-store";
import type { ParticipantStats } from "@/lib/types";
import { toDative } from "@/lib/utils";

export default function CuratorPage() {
  return (
    <AppShell role="curator">
      <CuratorOverview />
    </AppShell>
  );
}

function CuratorOverview() {
  const { state, currentUser, update } = useAppStore();
  const { toast } = useToast();
  const write = useWriteToParticipant();

  const [taskOpen, setTaskOpen] = useState(false);
  const [taskError, setTaskError] = useState<string | null>(null);
  const [announcementOpen, setAnnouncementOpen] = useState(false);
  const [announcementError, setAnnouncementError] = useState<string | null>(null);

  if (!state || !currentUser) return null;

  const stats = getGroupStats(state);
  const participants = getAllParticipantStats(state);
  const flagged = participants.filter((item) => item.warnings.length > 0);

  const handleAddTask = (input: CreateTaskInput) => {
    const result = addTask(state, input);

    if ("error" in result) {
      setTaskError(result.error);
      return;
    }

    update(() => result.state);
    setTaskError(null);
    setTaskOpen(false);
    toast(`Задание на день ${result.task.day} добавлено`);
  };

  const handleAddAnnouncement = (text: string) => {
    const result = addAnnouncement(state, currentUser.id, text);

    if ("error" in result) {
      setAnnouncementError(result.error);
      return;
    }

    update(() => result.state);
    setAnnouncementError(null);
    setAnnouncementOpen(false);
    toast("Объявление отправлено группе");
  };

  const handleResolve = (item: ParticipantStats) => {
    update((current) => resolveSignalsForUser(current, item.user.id));
    toast(`Сигнал по ${toDative(item.user.name)} отмечен как просмотренный`, "info");
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Панель куратора"
        subtitle={state.group.name}
        action={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => setTaskOpen(true)}>
              <ListChecks className="size-4" />
              Новое задание
            </Button>
            <Button size="sm" onClick={() => setAnnouncementOpen(true)}>
              <Megaphone className="size-4" />
              Объявление
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Участников"
          value={stats.participants}
          icon={<Users className="size-4" />}
          tone="accent"
        />
        <StatCard
          label="Средний прогресс"
          value={`${stats.averageProgress}%`}
          icon={<TrendingUp className="size-4" />}
          tone="accent"
        />
        <StatCard
          label="Активны сегодня"
          value={stats.activeToday}
          hint={`день ${stats.currentDay} из ${stats.duration}`}
          icon={<Activity className="size-4" />}
          tone="success"
        />
        <StatCard
          label="Требуют внимания"
          value={stats.needAttention}
          icon={<HeartHandshake className="size-4" />}
          tone={stats.needAttention > 0 ? "warning" : "neutral"}
        />
      </div>

      <SupportAlert flagged={flagged} onWrite={(item) => write.openFor(item.user)} onResolve={handleResolve} />

      <section className="space-y-3">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="text-lg font-semibold">Участники</h2>
          <Link
            href="/curator/participants"
            className="text-[13px] font-medium text-accent hover:text-accent-strong"
          >
            Подробнее по каждому
          </Link>
        </div>

        <ParticipantTable
          participants={participants}
          duration={state.group.duration}
          onWrite={(item) => write.openFor(item.user)}
        />
      </section>

      <div className="grid gap-5 lg:grid-cols-5">
        <GroupFeed
          limit={5}
          description="Что происходит в группе прямо сейчас."
          className="lg:col-span-3"
        />

        <div className="space-y-5 lg:col-span-2">
          <InviteCodeCard code={state.group.inviteCode} />
        </div>
      </div>

      <CreateTaskModal
        open={taskOpen}
        onClose={() => {
          setTaskOpen(false);
          setTaskError(null);
        }}
        defaultDay={getNextFreeDay(state)}
        duration={state.group.duration}
        error={taskError}
        onSubmit={handleAddTask}
      />

      <AnnouncementModal
        open={announcementOpen}
        onClose={() => {
          setAnnouncementOpen(false);
          setAnnouncementError(null);
        }}
        error={announcementError}
        onSubmit={handleAddAnnouncement}
      />

      {write.modal}
    </div>
  );
}
