"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarDays, ExternalLink, RefreshCw } from "lucide-react";

import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/page-header";
import { VkEventCard } from "@/components/vk-event-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState, PageSkeleton } from "@/components/ui/states";
import type { VkEvent } from "@/lib/vk/sources";
import { cn } from "@/lib/utils";

type CommunityInfo = {
  id: string;
  title: string;
  fullTitle: string;
  url: string;
};

type EventsResponse = {
  communities: CommunityInfo[];
  events: VkEvent[];
  fetchedAt: string;
  errors: string[];
  error?: string;
};

type FilterId = "all" | string;

export default function EventsPage() {
  return (
    <AppShell>
      <EventsFeed />
    </AppShell>
  );
}

function EventsFeed() {
  const [data, setData] = useState<EventsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterId>("all");
  const [failed, setFailed] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setFailed(null);

    try {
      const response = await fetch("/api/vk-events");
      const payload = (await response.json()) as EventsResponse;

      if (!response.ok) {
        setFailed(payload.error ?? "Не удалось загрузить мероприятия.");
        setData(null);
        return;
      }

      setData(payload);
    } catch {
      setFailed("Нет соединения с сервером. Попробуйте обновить страницу.");
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const visible = useMemo(() => {
    if (!data) return [];
    if (filter === "all") return data.events;
    return data.events.filter((event) => event.communityId === filter);
  }, [data, filter]);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Мероприятия"
        subtitle="Свежие посты из сообществ ИРИТ-РТФ и спорта УрФУ во ВКонтакте."
        action={
          <Button variant="outline" size="sm" onClick={() => void load()} disabled={loading}>
            <RefreshCw className={cn("size-4", loading && "animate-spin")} />
            Обновить
          </Button>
        }
      />

      {data?.communities && (
        <div className="flex flex-wrap gap-2">
          {data.communities.map((community) => (
            <a
              key={community.id}
              href={community.url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full bg-surface px-3 py-1.5 text-[13px] font-medium text-muted ring-1 ring-inset ring-line transition-colors hover:text-foreground"
            >
              {community.fullTitle}
              <ExternalLink className="size-3.5" />
            </a>
          ))}
        </div>
      )}

      <div
        role="tablist"
        aria-label="Фильтр сообществ"
        className="grid grid-cols-3 gap-1 rounded-2xl bg-surface-muted p-1 ring-1 ring-inset ring-line"
      >
        {[
          { id: "all" as const, label: "Все" },
          ...(data?.communities.map((community) => ({
            id: community.id,
            label: community.title,
          })) ?? []),
        ].map((item) => {
          const active = filter === item.id;

          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setFilter(item.id)}
              className={cn(
                "rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                active ? "bg-surface text-accent-strong shadow-soft" : "text-muted hover:text-foreground",
              )}
            >
              {item.label}
            </button>
          );
        })}
      </div>

      {loading && !data ? (
        <PageSkeleton />
      ) : failed ? (
        <Card className="p-6">
          <EmptyState
            icon={<CalendarDays className="size-5" />}
            title="Мероприятия сейчас недоступны"
            description={failed}
            action={
              <Button variant="outline" onClick={() => void load()}>
                Попробовать снова
              </Button>
            }
          />
        </Card>
      ) : visible.length === 0 ? (
        <Card className="p-6">
          <EmptyState
            icon={<CalendarDays className="size-5" />}
            title="Пока нет записей"
            description="Как только сообщества опубликуют новые посты, они появятся здесь."
          />
        </Card>
      ) : (
        <div className="space-y-4">
          {data?.errors && data.errors.length > 0 && (
            <p className="rounded-2xl bg-warning-soft px-4 py-3 text-[13px] text-warning">
              Часть ленты не загрузилась: {data.errors.join(" ")}
            </p>
          )}

          <div className="flex items-center justify-between gap-3">
            <Badge tone="neutral">{visible.length} записей</Badge>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            {visible.map((event) => (
              <VkEventCard key={event.id} event={event} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
