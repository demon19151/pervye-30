import { retrieve } from "@/lib/bot/rag/retrieve";
import { buildContextBlock, buildSearchQuery, NO_CONTEXT_PROMPT, SYSTEM_PROMPT } from "@/lib/bot/rag/prompt";
import { checkRateLimit } from "@/lib/bot/rate-limit";
import { getLlmConfig, LlmConfigError, streamChat, type ChatMessage } from "@/lib/bot/llm";

// Индекс базы знаний/FS — нужен Node-рантайм.
export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_QUESTION_LENGTH = 1000;
const MAX_HISTORY_TURNS = 6;
const MIN_CONFIDENCE = 0.12;

type IncomingMessage = { role: "user" | "assistant"; content: string };

export async function POST(request: Request) {
  const limit = checkRateLimit(clientKey(request));
  if (!limit.allowed) {
    return jsonError("Слишком много запросов. Подожди немного и попробуй снова.", 429);
  }

  let body: { messages?: IncomingMessage[] };
  try {
    body = (await request.json()) as { messages?: IncomingMessage[] };
  } catch {
    return jsonError("Некорректный JSON в запросе.", 400);
  }

  const history = (body.messages ?? [])
    .filter(
      (message) =>
        message?.content?.trim() && (message.role === "user" || message.role === "assistant"),
    )
    .slice(-MAX_HISTORY_TURNS * 2);

  const lastMessage = history[history.length - 1];
  if (!lastMessage || lastMessage.role !== "user") {
    return jsonError("Последнее сообщение должно быть вопросом студента.", 400);
  }

  const question = lastMessage.content.trim().slice(0, MAX_QUESTION_LENGTH);

  let llmConfig;
  try {
    llmConfig = getLlmConfig();
  } catch (error) {
    if (error instanceof LlmConfigError) return jsonError(error.message, 503);
    throw error;
  }

  let retrieval;
  try {
    const previousQuestions = history
      .slice(0, -1)
      .filter((message) => message.role === "user")
      .map((message) => message.content);

    retrieval = await retrieve(buildSearchQuery(question, previousQuestions));
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "Не удалось выполнить поиск по базе знаний.",
      500,
    );
  }

  const isGrounded = retrieval.confidence >= MIN_CONFIDENCE && retrieval.chunks.length > 0;
  const usedChunks = isGrounded ? retrieval.chunks : [];

  const messages: ChatMessage[] = [
    { role: "system", content: SYSTEM_PROMPT },
    ...history.slice(0, -1).map((message) => ({ role: message.role, content: message.content })),
    {
      role: "user",
      content: isGrounded
        ? `${buildContextBlock(usedChunks)}\n\nВОПРОС СТУДЕНТА: ${question}`
        : `${NO_CONTEXT_PROMPT}\n\nВОПРОС СТУДЕНТА: ${question}`,
    },
  ];

  const sources = usedChunks.map((item, position) => ({
    n: position + 1,
    title: item.chunk.title,
    heading: item.chunk.heading,
    category: item.chunk.category,
    url: item.chunk.source,
    snippet: item.chunk.text.replace(/\s+/g, " ").slice(0, 220),
  }));

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: unknown) => {
        controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
      };

      send({ type: "sources", sources, confidence: Number(retrieval.confidence.toFixed(3)) });

      try {
        for await (const delta of streamChat({ messages, config: llmConfig, signal: request.signal })) {
          send({ type: "delta", text: delta });
        }
        send({ type: "done" });
      } catch (error) {
        if (request.signal.aborted) return;
        console.error("[bot-chat] error:", error);
        send({
          type: "error",
          message: "Модель не ответила. Попробуй переформулировать вопрос или повторить позже.",
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Accel-Buffering": "no",
    },
  });
}

function clientKey(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "local";
}

function jsonError(message: string, status: number) {
  return Response.json({ error: message }, { status });
}

