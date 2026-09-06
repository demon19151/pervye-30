export type KbChunk = {
  /** Уникальный id чанка, например `stipendii#2`. */
  id: string;
  /** id документа (имя файла без расширения). */
  docId: string;
  /** Заголовок документа из frontmatter. */
  title: string;
  /** Тематическая категория (учёба, стипендии, общежитие, ...). */
  category: string;
  /** Ссылка на официальный источник, если она известна. */
  source: string | null;
  /** Ближайший markdown-заголовок внутри документа. */
  heading: string | null;
  /** Текст чанка. */
  text: string;
  /** Вектор эмбеддинга. null, если индекс собран без embeddings-ключа. */
  vector: number[] | null;
};

export type KbIndex = {
  version: number;
  createdAt: string;
  embeddings: { model: string; dim: number } | null;
  chunks: KbChunk[];
};

export type RetrievedChunk = {
  chunk: KbChunk;
  score: number;
  /** Как чанк был найден: лексически, векторно или обоими способами. */
  matchedBy: ("lexical" | "vector")[];
};

