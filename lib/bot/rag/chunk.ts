export type ParsedDoc = {
  title: string;
  category: string;
  source: string | null;
  body: string;
};

export type RawChunk = {
  heading: string | null;
  text: string;
};

/** Минимальный парсер YAML-frontmatter (нужны только строковые поля). */
export function parseFrontmatter(raw: string, fallbackTitle: string): ParsedDoc {
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(raw);
  if (!match) {
    return { title: fallbackTitle, category: "общее", source: null, body: raw.trim() };
  }

  const meta: Record<string, string> = {};
  for (const line of match[1].split(/\r?\n/)) {
    const separator = line.indexOf(":");
    if (separator === -1) continue;
    const key = line.slice(0, separator).trim();
    const value = line.slice(separator + 1).trim().replace(/^["']|["']$/g, "");
    if (key) meta[key] = value;
  }

  return {
    title: meta.title || fallbackTitle,
    category: meta.category || "общее",
    source: meta.source || null,
    body: raw.slice(match[0].length).trim(),
  };
}

const MAX_CHARS = 1100;
const OVERLAP_CHARS = 150;

/**
 * Делит документ на чанки по markdown-заголовкам, а слишком длинные секции —
 * на части по границам абзацев с небольшим перекрытием.
 * Заголовок секции дублируется в тексте чанка.
 */
export function chunkMarkdown(body: string): RawChunk[] {
  const sections: RawChunk[] = [];
  let heading: string | null = null;
  let buffer: string[] = [];

  const flush = () => {
    const text = buffer.join("\n").trim();
    if (text) sections.push({ heading, text });
    buffer = [];
  };

  for (const line of body.split(/\r?\n/)) {
    const headingMatch = /^(#{1,4})\s+(.*)$/.exec(line);
    if (headingMatch) {
      flush();
      heading = headingMatch[2].trim();
      continue;
    }
    buffer.push(line);
  }
  flush();

  const chunks: RawChunk[] = [];
  for (const section of sections) {
    const prefix = section.heading ? `${section.heading}\n` : "";
    for (const part of splitByLength(section.text)) {
      chunks.push({ heading: section.heading, text: `${prefix}${part}`.trim() });
    }
  }
  return chunks;
}

function splitByLength(text: string): string[] {
  if (text.length <= MAX_CHARS) return [text];

  const paragraphs = text.split(/\n{2,}/);
  const parts: string[] = [];
  let current = "";

  for (const paragraph of paragraphs) {
    if (current && current.length + paragraph.length + 2 > MAX_CHARS) {
      parts.push(current.trim());
      current = `${current.slice(-OVERLAP_CHARS)}\n\n${paragraph}`;
    } else {
      current = current ? `${current}\n\n${paragraph}` : paragraph;
    }
  }
  if (current.trim()) parts.push(current.trim());

  return parts.flatMap((part) => (part.length <= MAX_CHARS * 1.5 ? [part] : hardSplit(part)));
}

function hardSplit(text: string): string[] {
  const parts: string[] = [];
  for (let offset = 0; offset < text.length; offset += MAX_CHARS - OVERLAP_CHARS) {
    parts.push(text.slice(offset, offset + MAX_CHARS));
  }
  return parts;
}

