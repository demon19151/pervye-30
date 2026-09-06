const WINDOW_MS = 60_000;
const MAX_REQUESTS = 20;

const hits = new Map<string, number[]>();

/**
 * Простое ограничение частоты в памяти процесса.
 * Защищает ключ провайдера от перерасхода в демо-режиме.
 */
export function checkRateLimit(key: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((timestamp) => now - timestamp < WINDOW_MS);

  if (recent.length >= MAX_REQUESTS) {
    hits.set(key, recent);
    return { allowed: false, remaining: 0 };
  }

  recent.push(now);
  hits.set(key, recent);

  if (hits.size > 500) {
    for (const [existingKey, timestamps] of hits) {
      if (timestamps.every((timestamp) => now - timestamp >= WINDOW_MS)) hits.delete(existingKey);
    }
  }

  return { allowed: true, remaining: MAX_REQUESTS - recent.length };
}

