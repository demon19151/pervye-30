export type EmbeddingsConfig = {
  baseUrl: string;
  apiKey: string;
  model: string;
  dimensions: number | null;
};

/** Конфигурация embeddings опциональна: без неё поиск работает лексически. */
export function getEmbeddingsConfig(): EmbeddingsConfig | null {
  const apiKey = process.env.EMBEDDINGS_API_KEY?.trim();
  if (!apiKey) return null;

  const rawDimensions = Number(process.env.EMBEDDINGS_DIM);
  return {
    baseUrl: (process.env.EMBEDDINGS_BASE_URL || "https://api.openai.com/v1").replace(/\/$/, ""),
    apiKey,
    model: process.env.EMBEDDINGS_MODEL || "text-embedding-3-small",
    dimensions: Number.isFinite(rawDimensions) && rawDimensions > 0 ? rawDimensions : null,
  };
}

export async function embedTexts(texts: string[], config: EmbeddingsConfig): Promise<number[][]> {
  const response = await fetch(`${config.baseUrl}/embeddings`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model,
      input: texts,
      ...(config.dimensions ? { dimensions: config.dimensions } : {}),
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`Embeddings API ${response.status}: ${detail.slice(0, 300)}`);
  }

  const payload = (await response.json()) as {
    data: { index: number; embedding: number[] }[];
  };

  return payload.data
    .slice()
    .sort((a, b) => a.index - b.index)
    .map((item) => item.embedding);
}

export function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length && i < b.length; i += 1) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

