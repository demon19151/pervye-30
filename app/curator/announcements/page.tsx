"use client";

import { useState } from "react";
import { Megaphone } from "lucide-react";

import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { Field, Textarea } from "@/components/ui/field";
import { EmptyState } from "@/components/ui/states";
import { useToast } from "@/components/ui/toast";
import { addAnnouncement, getAnnouncements } from "@/lib/services/announcementService";
import { useAppStore } from "@/lib/store/app-store";
import { formatRelativeTime } from "@/lib/utils";

const suggestion = "Завтра в 11:00 знакомимся с командой продукта.";

export default function CuratorAnnouncementsPage() {
  return (
    <AppShell role="curator">
      <CuratorAnnouncements />
    </AppShell>
  );
}

function CuratorAnnouncements() {
  const { state, currentUser, update } = useAppStore();
  const { toast } = useToast();
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (!state || !currentUser) return null;

  const announcements = getAnnouncements(state);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    const result = addAnnouncement(state, currentUser.id, text);

    if ("error" in result) {
      setError(result.error);
      return;
    }

    update(() => result.state);
    setError(null);
    setText("");
    toast("Объявление отправлено группе");
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Объявления"
        subtitle="Короткие сообщения, которые видят все участники группы."
      />

      <div className="grid gap-5 lg:grid-cols-5">
        <div className="space-y-5 lg:col-span-3">
          <Card className="p-5 sm:p-6">
            <CardHeader
              icon={<Megaphone className="size-5" />}
              title="Новое объявление"
              description="Появится в ленте группы у всех участников."
            />

            <form onSubmit={handleSubmit} className="mt-5 space-y-3">
              <Field label="Текст" htmlFor="announcement" error={error ?? undefined}>
                <Textarea
                  id="announcement"
                  value={text}
                  onChange={(event) => setText(event.target.value)}
                  placeholder={suggestion}
                  maxLength={300}
                />
              </Field>

              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <button
                  type="button"
                  onClick={() => setText(suggestion)}
                  className="text-left text-[13px] font-medium text-accent transition-colors hover:text-accent-strong"
                >
                  Подставить пример
                </button>

                <Button type="submit" disabled={text.trim().length < 3}>
                  <Megaphone className="size-4" />
                  Отправить группе
                </Button>
              </div>
            </form>
          </Card>

          <Card className="p-5 sm:p-6">
            <CardHeader title="Отправленные" description={`Всего ${announcements.length}.`} />

            <div className="mt-5 space-y-2.5">
              {announcements.length === 0 ? (
                <EmptyState
                  icon={<Megaphone className="size-5" />}
                  title="Объявлений пока нет"
                  description="Первое объявление — хороший способ задать тон группе."
                />
              ) : (
                announcements.map((announcement) => (
                  <div
                    key={announcement.id}
                    className="rounded-2xl bg-surface-muted px-4 py-3.5 ring-1 ring-inset ring-line"
                  >
                    <p className="text-[15px] leading-relaxed">{announcement.text}</p>
                    <p className="mt-2 text-xs text-subtle">
                      {formatRelativeTime(announcement.createdAt)}
                    </p>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>

        {/* Чат группы (GroupFeed) удалён */}
      </div>
    </div>
  );
}
