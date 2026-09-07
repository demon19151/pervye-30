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

export class LlmRequestError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly detail: string,
  ) {
    super(message);
  }
}

const DEFAULT_MODEL = "google/gemini-2.5-flash";
const FALLBACK_MODELS = ["google/gemini-2.5-flash", "google/gemini-2.5-flash-lite"];

/** Старые id, которые OpenRouter уже снял. */
const RETIRED_MODELS: Record<string, string> = {
  "google/gemini-2.0-flash-001": "google/gemini-2.5-flash",
  "google/gemini-2.0-flash": "google/gemini-2.5-flash",
};

export function resolveModel(raw: string): string {
  const model = raw.trim();
  return RETIRED_MODELS[model] ?? model || DEFAULT_MODEL;
}

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
    model: resolveModel(process.env.LLM_MODEL || DEFAULT_MODEL),
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
  const tried = new Set<string>();
  let model = config.model;

  while (true) {
    tried.add(model);
    try {
      yield* streamChatOnce({
        messages,
        config: { ...config, model },
        temperature,
        maxTokens,
        signal,
      });
      return;
    } catch (error) {
      if (!(error instanceof LlmRequestError)) throw error;
      const next = nextFallbackModel(model, tried);
      if (!shouldRetryModel(error) || !next) throw error;
      console.warn(`[bot-llm] модель ${model} недоступна (${error.status}), пробую ${next}`);
      model = next;
    }
  }
}

function nextFallbackModel(current: string, tried: Set<string>): string | null {
  return FALLBACK_MODELS.find((model) => model !== current && !tried.has(model)) ?? null;
}

function shouldRetryModel(error: LlmRequestError): boolean {
  if (error.status === 404) return true;
  return /no endpoints|not a valid model|no longer available/i.test(error.detail);
}

async function* streamChatOnce(options: StreamChatOptions): AsyncGenerator<string> {
  const { messages, config, temperature = 0.2, maxTokens = 900, signal } = options;

  const response = await fetch(`${config.baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey}`,
      "HTTP-Referer": process.env.APP_URL || "https://first-30-university.vercel.app",
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
    throw new LlmRequestError(userMessageForStatus(response.status, detail), response.status, detail.slice(0, 500));
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data:")) continue;

      const payload = trimmed.slice(5).trim();
      if (payload === "[DONE]") return;

      try {
        const parsed = JSON.parse(payload) as {
          error?: { message?: string };
          choices?: { delta?: { content?: unknown }; message?: { content?: unknown } }[];
        };
        if (parsed.error?.message) {
          throw new LlmRequestError(
            userMessageForStatus(502, parsed.error.message),
            502,
            parsed.error.message,
          );
        }
        const delta = extractText(parsed.choices?.[0]?.delta?.content ?? parsed.choices?.[0]?.message?.content);
        if (delta) yield delta;
      } catch (error) {
        if (error instanceof LlmRequestError) throw error;
      }
    }
  }
}

function extractText(content: unknown): string {
  if (typeof content === "string") return content;
  if (!Array.isArray(content)) return "";
  return content
    .map((part) => {
      if (typeof part === "string") return part;
      if (part && typeof part === "object" && "text" in part && typeof part.text === "string") {
        return part.text;
      }
      return "";
    })
    .join("");
}

function userMessageForStatus(status: number, detail: string): string {
  if (status === 401 || status === 403) {
    return "Ключ модели не принят. Проверь LLM_API_KEY на сервере.";
  }
  if (status === 402) {
    return "У провайдера модели закончились кредиты. Пополни баланс и повтори.";
  }
  if (status === 404 || /no endpoints|not a valid model|no longer available/i.test(detail)) {
    return "Модель в LLM_MODEL больше недоступна. Поставь google/gemini-2.5-flash и сделай redeploy.";
  }
  if (status === 429) {
    return "Провайдер модели временно ограничил запросы. Подожди минуту и попробуй снова.";
  }
  return "Модель не ответила. Попробуй переформулировать вопрос или повторить позже.";
}
