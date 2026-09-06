import { cosineSimilarity, embedTexts, getEmbeddingsConfig } from "./embeddings";
import { getKbStore } from "./store";
import { tokenizeQuery } from "./tokenize";
import type { RetrievedChunk } from "./types";

const BM25_K1 = 1.5;
const BM25_B = 0.75;
/** Константа Reciprocal Rank Fusion: сглаживает вклад низких позиций. */
const RRF_K = 60;
const CANDIDATES_PER_METHOD = 20;
const MAX_CHUNKS_PER_DOC = 3;

export type RetrievalResult = {
  chunks: RetrievedChunk[];
  confidence: number;
  methods: ("lexical" | "vector")[];
};

export async function retrieve(query: string, topK = 6): Promise<RetrievalResult> {
  const store = await getKbStore();
  const { chunks } = store.index;

  const lexicalScores = scoreLexical(query, store);
  const vectorScores = await scoreVector(query, store);

  const lexicalRanking = topIndices(lexicalScores, CANDIDATES_PER_METHOD);
  const vectorRanking = vectorScores ? topIndices(vectorScores, CANDIDATES_PER_METHOD) : [];

  const fused = new Map<number, { score: number; matchedBy: Set<"lexical" | "vector"> }>();

  const addRanking = (ranking: number[], method: "lexical" | "vector", weight: number) => {
    ranking.forEach((chunkIndex, rank) => {
      const entry =
        fused.get(chunkIndex) ?? { score: 0, matchedBy: new Set<"lexical" | "vector">() };
      entry.score += weight / (RRF_K + rank + 1);
      entry.matchedBy.add(method);
      fused.set(chunkIndex, entry);
    });
  };

  addRanking(lexicalRanking, "lexical", 1);
  addRanking(vectorRanking, "vector", 1.2);

  const perDocCount = new Map<string, number>();
  const selected: RetrievedChunk[] = [];

  for (const [chunkIndex, entry] of [...fused.entries()].sort((a, b) => b[1].score - a[1].score)) {
    const chunk = chunks[chunkIndex];
    const used = perDocCount.get(chunk.docId) ?? 0;
    if (used >= MAX_CHUNKS_PER_DOC) continue;
    perDocCount.set(chunk.docId, used + 1);
    selected.push({ chunk, score: entry.score, matchedBy: [...entry.matchedBy] });
    if (selected.length >= topK) break;
  }

  return {
    chunks: selected,
    confidence: estimateConfidence(lexicalScores, vectorScores),
    methods: vectorScores ? ["lexical", "vector"] : ["lexical"],
  };
}

function scoreLexical(query: string, store: Awaited<ReturnType<typeof getKbStore>>): number[] {
  const { lexical, index } = store;
  const queryTokens = tokenizeQuery(query);
  const totalChunks = index.chunks.length;
  const scores = new Array<number>(totalChunks).fill(0);

  for (const token of new Set(queryTokens)) {
    const df = lexical.documentFrequencies.get(token);
    if (!df) continue;
    const idf = Math.log(1 + (totalChunks - df + 0.5) / (df + 0.5));

    for (let i = 0; i < totalChunks; i += 1) {
      const tf = lexical.termFrequencies[i].get(token);
      if (!tf) continue;
      const normalization = 1 - BM25_B + BM25_B * (lexical.lengths[i] / lexical.averageLength);
      scores[i] += idf * ((tf * (BM25_K1 + 1)) / (tf + BM25_K1 * normalization));
    }
  }

  return scores;
}

async function scoreVector(
  query: string,
  store: Awaited<ReturnType<typeof getKbStore>>,
): Promise<number[] | null> {
  const config = getEmbeddingsConfig();
  if (!config || !store.hasVectors) return null;

  let queryVector: number[];
  try {
    [queryVector] = await embedTexts([query], config);
  } catch (error) {
    // Векторный поиск — улучшение, а не необходимость: падаем на BM25.
    console.warn("[bot-rag] векторный поиск недоступен, используем только BM25:", error);
    return null;
  }

  return store.index.chunks.map((chunk) => (chunk.vector ? cosineSimilarity(queryVector, chunk.vector) : 0));
}

function topIndices(scores: number[], limit: number): number[] {
  return scores
    .map((score, chunkIndex) => ({ score, chunkIndex }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((item) => item.chunkIndex);
}

function estimateConfidence(lexicalScores: number[], vectorScores: number[] | null): number {
  const bestLexical = Math.max(0, ...lexicalScores);
  const bestVector = vectorScores ? Math.max(0, ...vectorScores) : 0;
  const lexicalConfidence = Math.min(1, bestLexical / 12);
  const vectorConfidence = Math.max(0, (bestVector - 0.2) / 0.5);
  return Math.max(lexicalConfidence, Math.min(1, vectorConfidence));
}

