export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type LlmConfig = {
  baseUrl: string;
  apiKey: string;
  model: string;
};

export class LlmConfigError extends Error {}

/**
 * Модель живёт в облаке: обращаемся к любому OpenAI-compatible API
 * (OpenRouter, DeepSeek, Groq, OpenAI и т.п.).
 */
export function getLlmConfig(): LlmConfig {
  const apiKey = process.env.LLM_API_KEY?.trim();
  if (!apiKey) {
    throw new LlmConfigError(
      "Не задан LLM_API_KEY. Добавь ключ в .env.local (и перезапусти dev-сервер).",
    );
  }

  return {
    baseUrl: (process.env.LLM_BASE_URL || "https://openrouter.ai/api/v1").replace(/\/$/, ""),
    apiKey,
    model: process.env.LLM_MODEL || "google/gemini-2.0-flash-001",
  };
}

export type StreamChatOptions = {
  messages: ChatMessage[];
  config: LlmConfig;
  temperature?: number;
  maxTokens?: number;
  signal?: AbortSignal;
};

/** Стримит текст ответа (OpenAI-compatible SSE chat completions). */
export async function* streamChat(options: StreamChatOptions): AsyncGenerator<string> {
  const { messages, config, temperature = 0.2, maxTokens = 900, signal } = options;

  const response = await fetch(`${config.baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey}`,
      // Провайдеры (в т.ч. OpenRouter) могут использовать эти заголовки.
      "HTTP-Referer": process.env.APP_URL || "http://localhost:3000",
      "X-Title": "Student Assistant",
    },
    body: JSON.stringify({
      model: config.model,
      messages,
      temperature,
      max_tokens: maxTokens,
      stream: true,
    }),
    signal,
  });

  if (!response.ok || !response.body) {
    const detail = await response.text().catch(() => "");
    throw new Error(`LLM API ${response.status}: ${detail.slice(0, 500)}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    // Последняя строка может быть неполной — оставляем её в буфере.
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data:")) continue;

      const payload = trimmed.slice(5).trim();
      if (payload === "[DONE]") return;

      try {
        const parsed = JSON.parse(payload) as {
          choices?: { delta?: { content?: string | null } }[];
        };
        const delta = parsed.choices?.[0]?.delta?.content;
        if (delta) yield delta;
      } catch {
        // keep-alive/служебные строки игнорируем
      }
    }
  }
}

