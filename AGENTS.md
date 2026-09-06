# Agents / AI-модули проекта

## 1) ИИ Помощник (RAG-ассистент)

### Что делает
Отвечает студентам на вопросы про **учёбу и университет** на основе локальной базы знаний проекта (`knowledge/*.md`).

### Где в коде
- UI-виджет: `components/bot-chat/*`
- API endpoint (streaming): `app/api/bot-chat/route.ts`
- LLM/RAG логика: `lib/bot/*`

### Документация
См. `AI_AGENT_DOCS.md`

### Как обновлять знания
Добавляй/меняй markdown-файлы в `knowledge/*.md` и делай redeploy (push в Git → Vercel).

### Важные env для запуска
См. раздел “Переменные окружения (Vercel)” в `AI_AGENT_DOCS.md`.

