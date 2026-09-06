import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { chunkMarkdown, parseFrontmatter } from "./chunk";
import { embedTexts, getEmbeddingsConfig } from "./embeddings";
import type { KbChunk, KbIndex } from "./types";

const KNOWLEDGE_DIR = path.join(process.cwd(), "knowledge");
const BATCH_SIZE = 48;

async function collectMarkdownFiles(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectMarkdownFiles(fullPath)));
    } else if (entry.name.endsWith(".md")) {
      files.push(fullPath);
    }
  }

  return files.sort();
}

/**
 * Строит индекс RAG из файлов в `bot/knowledge/` (markdown).
 * Векторы считаются только если задан `EMBEDDINGS_API_KEY` (иначе будет только BM25).
 */
export async function buildKbIndexFromKnowledge(): Promise<KbIndex> {
  const files = await collectMarkdownFiles(KNOWLEDGE_DIR).catch(() => []);
  if (files.length === 0) {
    throw new Error(`Не найдено ни одного .md файла в ${KNOWLEDGE_DIR}`);
  }

  const chunks: KbChunk[] = [];

  for (const file of files) {
    const docId = path.basename(file, ".md");
    const raw = await readFile(file, "utf8");
    const doc = parseFrontmatter(raw, docId);

    chunkMarkdown(doc.body).forEach((rawChunk, position) => {
      chunks.push({
        id: `${docId}#${position}`,
        docId,
        title: doc.title,
        category: doc.category,
        source: doc.source,
        heading: rawChunk.heading,
        text: rawChunk.text,
        vector: null,
      });
    });
  }

  const embeddingsConfig = getEmbeddingsConfig();
  let embeddingsMeta: KbIndex["embeddings"] = null;

  if (embeddingsConfig) {
    for (let offset = 0; offset < chunks.length; offset += BATCH_SIZE) {
      const batch = chunks.slice(offset, offset + BATCH_SIZE);
      const vectors = await embedTexts(
        batch.map((chunk) => `${chunk.title}. ${chunk.text}`),
        embeddingsConfig,
      );
      batch.forEach((chunk, position) => {
        chunk.vector = vectors[position].map((value) => Number(value.toFixed(6)));
      });
    }

    embeddingsMeta = { model: embeddingsConfig.model, dim: chunks[0].vector?.length ?? 0 };
  }

  return {
    version: 1,
    createdAt: new Date().toISOString(),
    embeddings: embeddingsMeta,
    chunks,
  };
}

