import type { VkCommunity, VkEvent } from "./sources";

function decodeEntities(value: string): string {
  return value
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCharCode(parseInt(code, 16)))
    .replace(/&nbsp;/g, " ")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}

function stripHtml(value: string): string {
  return decodeEntities(
    value
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<button[\s\S]*?<\/button>/gi, "")
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<[^>]+>/g, "")
      .replace(/\u00a0/g, " ")
      .replace(/[ \t]+\n/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim(),
  );
}

function firstLine(text: string): string {
  const line = text.split("\n").map((item) => item.trim()).find(Boolean);
  if (!line) return "Запись сообщества";
  return line.length > 110 ? `${line.slice(0, 107).trim()}…` : line;
}

function pickImage(block: string): string | undefined {
  const fromThumb = block.match(
    /page_post_thumb_wrap[^>]+background-image:\s*url\((['"]?)(https:[^'")]+)\1\)/i,
  );
  if (fromThumb?.[2]) return fromThumb[2];

  const fromImg = block.match(/page_post_sized_thumbs[\s\S]{0,1200}?<img[^>]+src="(https:[^"]+)"/i);
  if (fromImg?.[1] && !fromImg[1].includes("emoji")) return fromImg[1];

  return undefined;
}

export function parseCommunityWidget(html: string, community: VkCommunity): VkEvent[] {
  const blocks = html.split(/<div id="post-\d+_\d+"/);
  const events: VkEvent[] = [];

  for (const block of blocks) {
    const idMatch = block.match(/data-post-id="(-?\d+)_(\d+)"/);
    if (!idMatch) continue;

    const ownerId = idMatch[1];
    const postId = idMatch[2];
    const textBlock = block.match(/<div class="wall_post_text"[^>]*>([\s\S]*?)<\/div>/);
    const text = textBlock ? stripHtml(textBlock[1]) : "";
    if (!text) continue;

    const timestamp = Number(block.match(/data-date="(\d+)"/)?.[1] ?? 0);
    const rawDate = block.match(/class="rel_date[^"]*"[^>]*>([^<]+)</)?.[1] ?? "";

    events.push({
      id: `${ownerId}_${postId}`,
      communityId: community.id,
      communityTitle: community.shortTitle,
      communityUrl: community.url,
      text,
      title: firstLine(text),
      publishedAt: timestamp,
      dateLabel: decodeEntities(rawDate) || "недавно",
      imageUrl: pickImage(block),
      postUrl: `https://vk.ru/wall${ownerId}_${postId}`,
    });
  }

  return events;
}
