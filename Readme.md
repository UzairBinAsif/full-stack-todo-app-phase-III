# Todo Application - Phase II & III

## Live Deployed Link
[Click here to view 🔗](https://todo-app-uzairbinasif.vercel.app/)

## Overview

A full-stack Todo application with:
- **Phase II**: Task CRUD operations with user authentication
- **Phase III**: AI-powered chatbot integration for managing todos via natural language

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 16+ (App Router), TypeScript, Tailwind CSS |
| Backend | Python FastAPI, SQLModel, Pydantic |
| Database | Neon Serverless PostgreSQL |
| Auth | Better Auth with JWT |

---

## Phase III - AI Chatbot

### Features

- Natural language chat interface for todo management
- Stateless conversation architecture (DB-only state)
- Conversation persistence across sessions and server restarts
- User data isolation (each user sees only their conversations)

### Chat Endpoint

```
POST /api/{user_id}/chat
Authorization: Bearer <token>

Request:
{
  "conversation_id": 123,  // optional - creates new if omitted
  "message": "Add a task to buy groceries"
}

Response:
{
  "conversation_id": 123,
  "response": "I've added 'buy groceries' to your tasks.",
  "tool_calls": []
}
```

### Testing the Chat API

```bash
# Create new conversation
curl -X POST "http://localhost:8000/api/{user_id}/chat" \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello"}'

# Continue conversation
curl -X POST "http://localhost:8000/api/{user_id}/chat" \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"conversation_id": 1, "message": "What tasks do I have?"}'
```

### Environment Variables

For ChatKit production deployment, add your domain to OpenAI's allowlist:

```env
NEXT_PUBLIC_OPENAI_DOMAIN_KEY=your_domain_key_here
```

### Architecture

See detailed specification at: `specs/001-phase3-chatbot/spec.md`

---

## Local Development

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

---

## Project Structure

```
todo-app-phase-III/
├── backend/           # FastAPI application
│   ├── routes/        # API endpoints (tasks, chat)
│   ├── models.py      # SQLModel database models
│   └── schemas/       # Pydantic request/response schemas
├── frontend/          # Next.js application
│   ├── app/           # App Router pages
│   ├── components/    # React components
│   └── lib/           # Utilities and API clients
└── specs/             # Feature specifications
```