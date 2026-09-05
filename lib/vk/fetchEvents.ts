import { parseCommunityWidget } from "./parseWidget";
import { vkCommunities, type VkCommunity, type VkEvent } from "./sources";

const CACHE_MS = 8 * 60 * 1000;

type CacheEntry = {
  expiresAt: number;
  events: VkEvent[];
  fetchedAt: string;
  errors: string[];
};

let cache: CacheEntry | null = null;

async function fetchWidgetHtml(community: VkCommunity): Promise<string> {
  const url = `https://vk.com/widget_community.php?gid=${community.gid}&mode=4&wide=1&width=500&height=1400`;

  const response = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
      Accept: "text/html,application/xhtml+xml",
      "Accept-Language": "ru-RU,ru;q=0.9,en;q=0.8",
      Cookie: "remixlang=0",
    },
  });

  if (!response.ok) {
    throw new Error(`VK ответил ${response.status} для ${community.screenName}`);
  }

  const buffer = await response.arrayBuffer();
  return new TextDecoder("windows-1251").decode(buffer);
}

export async function fetchVkEvents(force = false): Promise<CacheEntry> {
  if (!force && cache && cache.expiresAt > Date.now()) {
    return cache;
  }

  const errors: string[] = [];
  const collected: VkEvent[] = [];

  await Promise.all(
    vkCommunities.map(async (community) => {
      try {
        const html = await fetchWidgetHtml(community);
        const events = parseCommunityWidget(html, community);
        if (events.length === 0) {
          errors.push(`В ${community.shortTitle} посты не найдены.`);
          return;
        }
        collected.push(...events);
      } catch (error) {
        errors.push(
          error instanceof Error ? error.message : `Не удалось загрузить ${community.shortTitle}`,
        );
      }
    }),
  );

  collected.sort((a, b) => b.publishedAt - a.publishedAt);

  cache = {
    expiresAt: Date.now() + CACHE_MS,
    events: collected,
    fetchedAt: new Date().toISOString(),
    errors,
  };

  return cache;
}
