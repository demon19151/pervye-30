import { ExternalLink } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { VkEvent } from "@/lib/vk/sources";

export function VkEventCard({ event }: { event: VkEvent }) {
  return (
    <article>
      <Card interactive className="overflow-hidden">
        {event.imageUrl && (
          <div className="aspect-[16/8] overflow-hidden bg-surface-muted">
            {/* Внешние картинки ВК: домены userapi.com заранее известны. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={event.imageUrl}
              alt=""
              className="h-full w-full object-cover"
            />
          </div>
        )}

        <div className="space-y-3 p-5">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={event.communityId === "sport" ? "success" : "accent"}>
              {event.communityTitle}
            </Badge>
            <span className="text-[13px] text-subtle">{event.dateLabel}</span>
          </div>

          <h2 className="text-lg font-semibold leading-snug">{event.title}</h2>
          <p className="line-clamp-5 text-[15px] leading-relaxed text-muted whitespace-pre-line">
            {event.text}
          </p>

          <a
            href={event.postUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-accent transition-colors hover:text-accent-strong"
          >
            Открыть во ВКонтакте
            <ExternalLink className="size-3.5" />
          </a>
        </div>
      </Card>
    </article>
  );
}
