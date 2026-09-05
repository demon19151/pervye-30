"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, LogOut, RotateCcw, Trophy, UsersRound } from "lucide-react";

import { InviteCodeCard } from "@/components/invite-code-card";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/page-header";
import { ProgressBar } from "@/components/progress-bar";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { getParticipants, setCurrentUser, signOut, switchRole } from "@/lib/services/groupService";
import { getParticipantStats } from "@/lib/services/statsService";
import { useAppStore } from "@/lib/store/app-store";
import { cn } from "@/lib/utils";

export default function ProfilePage() {
  return (
    <AppShell role="participant">
      <Profile />
    </AppShell>
  );
}

function Profile() {
  const { state, currentUser, update, reset } = useAppStore();
  const { toast } = useToast();
  const router = useRouter();

  if (!state || !currentUser) return null;

  const stats = getParticipantStats(state, currentUser.id);
  const participants = getParticipants(state);

  return (
    <div className="space-y-5">
      <PageHeader title="Профиль" subtitle="Кто вы в этой группе и как идут дела." />

      <Card className="p-5 sm:p-6">
        <div className="flex items-center gap-4">
          <Avatar name={currentUser.name} emoji={currentUser.avatar} size="lg" />
          <div className="min-w-0 flex-1">
            <p className="text-xl font-semibold">{currentUser.name}</p>
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              <Badge tone="accent">Участник</Badge>
              <span className="text-[13px] text-muted">{state.group.name}</span>
            </div>
          </div>
        </div>

        {stats && (
          <ProgressBar
            value={stats.progress}
            label="Выполнение программы"
            hint={`${stats.progress}%`}
            className="mt-5"
          />
        )}
      </Card>

      <Link href="/summary">
        <Card interactive className="flex items-center gap-4 p-5">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent-strong">
            <Trophy className="size-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-semibold">Итоги программы</p>
            <p className="text-[13px] text-muted">Достижения, статистика и слова куратора.</p>
          </div>
          <ArrowRight className="size-4 shrink-0 text-subtle" />
        </Card>
      </Link>

      <Card className="p-5 sm:p-6">
        <CardHeader
          icon={<UsersRound className="size-5" />}
          title="Демонстрационный режим"
          description="Посмотрите приложение глазами другого участника или куратора."
        />

        <div className="mt-5 space-y-4">
          <div className="space-y-2">
            <p className="text-[13px] font-medium text-muted">Смотреть как участник</p>
            <div className="flex flex-wrap gap-2">
              {participants.map((participant) => (
                <button
                  key={participant.id}
                  type="button"
                  onClick={() => {
                    update((current) => setCurrentUser(current, participant.id));
                    toast(`Теперь вы смотрите как ${participant.name}`, "info");
                  }}
                  className={cn(
                    "rounded-full px-3 py-1.5 text-[13px] font-medium transition-colors",
                    participant.id === currentUser.id
                      ? "bg-accent text-white"
                      : "bg-surface-muted text-muted ring-1 ring-inset ring-line hover:text-foreground",
                  )}
                >
                  {participant.avatar} {participant.name}
                </button>
              ))}
            </div>
          </div>

          <Button
            variant="outline"
            fullWidth
            onClick={() => {
              update((current) => switchRole(current, "curator"));
              router.push("/curator");
            }}
          >
            Открыть панель куратора
            <ArrowRight className="size-4" />
          </Button>
        </div>
      </Card>

      <InviteCodeCard
        code={state.group.inviteCode}
        description="Код группы, по которому подключаются участники."
      />

      <div className="flex flex-col gap-2 sm:flex-row">
        <Button
          variant="outline"
          fullWidth
          onClick={() => {
            reset();
            toast("Демо-данные сброшены");
            router.push("/");
          }}
        >
          <RotateCcw className="size-4" />
          Сбросить демо-данные
        </Button>
        <Button
          variant="ghost"
          fullWidth
          onClick={() => {
            update(signOut);
            router.push("/");
          }}
        >
          <LogOut className="size-4" />
          Выйти
        </Button>
      </div>
    </div>
  );
}
