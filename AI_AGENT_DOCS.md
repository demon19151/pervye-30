## AI-агент: “ИИ Помощник” (РТФ Навигатор)

### 1) Что это
В проекте есть AI-агент (чат-виджет) для ответов студентам по вопросам:
- учебного процесса и университета
- ИРИТ-РТФ / УрФУ (в рамках базы знаний проекта)

Виджет показывается **справа снизу** и доступен **только роли `participant`**.

### 2) Архитектура
**Клиент (виджет в браузере)** → `POST /api/bot-chat` → **сервер (Next.js на Vercel)** → внешний LLM-провайдер (OpenAI-compatible)  
Параллельно агент делает RAG-поиск по базе знаний `knowledge/*.md` и подмешивает релевантные фрагменты в prompt.

Ключевые файлы:
- `components/bot-chat/bot-chat-launcher.tsx` — кнопка и открытие панели
- `components/bot-chat/bot-chat.tsx` — UI чата (фиксированный panel, ввод, Stop, отображение текста)
- `app/api/bot-chat/route.ts` — серверный endpoint (streaming)
- `lib/bot/` — LLM/RAG логика:
  - `lib/bot/llm.ts` — LLM стриминг (`/chat/completions`)
  - `lib/bot/rag/*` — BM25 retrieval + (опционально) embeddings

### 3) Как устроен эндпоинт чата
**POST**: `/api/bot-chat`  
Тело:
```json
{
  "messages": [
    { "role": "user" | "assistant", "content": "..." }
  ]
}
```

Ответ — **стрим NDJSON** (`Content-Type: application/x-ndjson`), события:
- `{ "type": "sources", "sources": [...], "confidence": 0.123 }`
- `{ "type": "delta", "text": "кусочек ответа" }`
- `{ "type": "done" }`
- `{ "type": "error", "message": "..." }`

Примечание: в текущем UI блок “Источники” скрыт, но события `sources` могут приходить в потоке.

### 4) Переменные окружения (Vercel)
Добавь в **Vercel → Project Settings → Environment Variables** (Production, а при необходимости и Preview):

Обязательные:
- `LLM_API_KEY` — ключ LLM-провайдера
- `LLM_BASE_URL` — base URL провайдера (например `https://openrouter.ai/api/v1`)
- `LLM_MODEL` — модель (например под OpenRouter)

Опциональные (для embeddings / гибридного поиска):
- `EMBEDDINGS_API_KEY`
- `EMBEDDINGS_BASE_URL` (если не `https://api.openai.com/v1`)
- `EMBEDDINGS_MODEL`
- `EMBEDDINGS_DIM` (опционально)

Важно:
- Не используй `NEXT_PUBLIC_*` — ключи должны быть серверными.
- После изменения env нужен новый деплой.

### 5) База знаний (knowledge)
Агент читает markdown-файлы из:
`knowledge/*.md`

Формат файла (YAML front-matter):
```md
---
title: "Заголовок документа"
category: "категория"
source: "https://..."
---
Тело документа...
```

Что агент делает с файлами:
1. Разбивает текст на фрагменты (чанки) по заголовкам и длине
2. Строит поисковый индекс:
   - **BM25** всегда
   - embeddings — если задан `EMBEDDINGS_API_KEY`
3. Делает retrieval и собирает prompt-контекст

### 6) Поведение и ограничения
Ассистент:
- отвечает **только по базе знаний** (если точной информации нет — сообщает, что нет данных)
- старается не использовать форматирование/маркировку “как в источниках”
- не придумывает точные числа/сроки/адреса/ФИО, если их нет в контексте

### 7) Производительность и индексация
Индекс базы знаний собирается **на сервере** (обычно один раз и затем кэшируется в процессе).
Если ты добавил новые `knowledge/*.md`, после деплоя агент подхватит изменения.

### 8) Rate limit
Есть in-memory rate limit (демо-уровень), ограничивает частоту запросов к провайдеру, чтобы не “сжечь” лимиты.

### 9) Troubleshooting
1) **503: “Не задан LLM_API_KEY”**
   - убедись, что `LLM_API_KEY` задан в Vercel Environment Variables (Production)
2) **404 “No endpoints found for <model>”**
   - модель в `LLM_MODEL` не поддерживается для твоего `LLM_BASE_URL`
   - проверь связку model/baseUrl (например OpenRouter ↔ openrouter model)
3) **ошибка про пустой индекс**
   - проверь, что папка `knowledge/` попала в репозиторий и содержит `.md`

