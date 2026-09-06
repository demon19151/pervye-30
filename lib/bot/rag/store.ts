import { readFile } from "node:fs/promises";
import path from "node:path";
import { tokenize } from "./tokenize";
import { buildKbIndexFromKnowledge } from "./build-kb-index";
import type { KbChunk, KbIndex } from "./types";

export type LexicalStats = {
  /** Частоты основ слов внутри каждого чанка. */
  termFrequencies: Map<string, number>[];
  /** Длина каждого чанка в токенах. */
  lengths: number[];
  /** Document frequency каждой основы. */
  documentFrequencies: Map<string, number>;
  averageLength: number;
};

export type KbStore = {
  index: KbIndex;
  lexical: LexicalStats;
  hasVectors: boolean;
};

const INDEX_PATH = path.join(process.cwd(), "data", "kb-index.json");

let cache: Promise<KbStore> | null = null;

/** Загружает индекс один раз на процесс (переиспользуется между запросами). */
export function getKbStore(): Promise<KbStore> {
  cache ??= loadKbStore();
  return cache;
}

async function loadKbStore(): Promise<KbStore> {
  let index: KbIndex;
  try {
    const raw = await readFile(INDEX_PATH, "utf8");
    index = JSON.parse(raw) as KbIndex;
  } catch {
    // Не всегда заранее есть возможность прогнать `npm run index`.
    index = await buildKbIndexFromKnowledge();
  }

  if (!Array.isArray(index.chunks) || index.chunks.length === 0) {
    throw new Error("Индекс базы знаний пуст. Проверьте files в knowledge/.");
  }

  return {
    index,
    lexical: buildLexicalStats(index.chunks),
    hasVectors: index.chunks.some((chunk) => Array.isArray(chunk.vector) && chunk.vector.length > 0),
  };
}

function buildLexicalStats(chunks: KbChunk[]): LexicalStats {
  const termFrequencies: Map<string, number>[] = [];
  const lengths: number[] = [];
  const documentFrequencies = new Map<string, number>();

  for (const chunk of chunks) {
    const tokens = tokenize(`${chunk.title} ${chunk.heading ?? ""} ${chunk.text}`);
    const frequencies = new Map<string, number>();

    for (const token of tokens) {
      frequencies.set(token, (frequencies.get(token) ?? 0) + 1);
    }

    for (const token of frequencies.keys()) {
      documentFrequencies.set(token, (documentFrequencies.get(token) ?? 0) + 1);
    }

    termFrequencies.push(frequencies);
    lengths.push(tokens.length);
  }

  const totalLength = lengths.reduce((sum, length) => sum + length, 0);
  return {
    termFrequencies,
    lengths,
    documentFrequencies,
    averageLength: totalLength / Math.max(1, lengths.length),
  };
}

