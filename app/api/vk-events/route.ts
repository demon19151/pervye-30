import { NextResponse } from "next/server";

import { fetchVkEvents } from "@/lib/vk/fetchEvents";
import { vkCommunities } from "@/lib/vk/sources";

export const revalidate = 480;

export async function GET() {
  try {
    const result = await fetchVkEvents();

    return NextResponse.json({
      communities: vkCommunities.map((item) => ({
        id: item.id,
        title: item.shortTitle,
        fullTitle: item.title,
        url: item.url,
      })),
      events: result.events,
      fetchedAt: result.fetchedAt,
      errors: result.errors,
    });
  } catch {
    return NextResponse.json(
      { error: "Не удалось загрузить мероприятия из ВКонтакте." },
      { status: 502 },
    );
  }
}
