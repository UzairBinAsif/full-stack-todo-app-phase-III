# Quickstart: Phase III - AI Chatbot Integration

**Feature**: 001-phase3-chatbot
**Date**: 2026-02-09

---

## Prerequisites

- Phase II application fully deployed and working
- Neon PostgreSQL database accessible
- Better Auth configured with JWT
- Backend running on port 8000
- Frontend running on port 3000

---

## Backend Setup

### 1. Add Models

Add Conversation and Message models to `backend/models.py`:

```python
# See data-model.md for full definitions
from enum import Enum
from sqlmodel import Relationship

class MessageRole(str, Enum):
    USER = "user"
    ASSISTANT = "assistant"

class Conversation(SQLModel, table=True):
    __tablename__ = "conversations"
    # ... fields

class Message(SQLModel, table=True):
    __tablename__ = "messages"
    # ... fields
```

### 2. Create Schemas

Create `backend/schemas/chat.py`:

```python
from pydantic import BaseModel, Field, field_validator

class ChatRequest(BaseModel):
    conversation_id: Optional[int] = None
    message: str = Field(..., min_length=1, max_length=4000)

class ChatResponse(BaseModel):
    conversation_id: int
    response: str
    tool_calls: List[ToolCallMetadata] = []
```

### 3. Create Router

Create `backend/routes/chat.py`:

```python
from fastapi import APIRouter
router = APIRouter(prefix="/api", tags=["chat"])

@router.post("/{user_id}/chat", response_model=ChatResponse)
async def chat(user_id: str, request: ChatRequest, ...):
    # Implementation
```

### 4. Register Router

Update `backend/main.py`:

```python
from routes.chat import router as chat_router
app.include_router(chat_router)
```

### 5. Start Backend

```bash
cd backend
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Tables will be auto-created on startup.

---

## Frontend Setup

### 1. Add Types

Create `frontend/types/chat.ts`:

```typescript
export interface ChatRequest {
  conversation_id?: number
  message: string
}

export interface ChatResponse {
  conversation_id: number
  response: string
  tool_calls: ToolCallMetadata[]
}
```

### 2. Create API Client

Create `frontend/lib/chat-client.ts`:

```typescript
export const chatApi = {
  sendMessage: async (userId: string, request: ChatRequest) => {
    // Implementation
  }
}
```

### 3. Create Chat Page

Create `frontend/app/(dashboard)/chat/page.tsx`:

```tsx
"use client"
export default function ChatPage() {
  // Implementation
}
```

### 4. Start Frontend

```bash
cd frontend
npm run dev
```

---

## Verification Steps

### Test 1: Create New Conversation

```bash
# Get auth token first (from browser dev tools after login)
TOKEN="your-session-token"
USER_ID="your-user-id"

curl -X POST "http://localhost:8000/api/${USER_ID}/chat" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello, AI assistant!"}'
```

**Expected**: 200 OK with `conversation_id` and `response`

### Test 2: Continue Conversation

```bash
CONV_ID=1  # From previous response

curl -X POST "http://localhost:8000/api/${USER_ID}/chat" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"conversation_id": '${CONV_ID}', "message": "Follow up message"}'
```

**Expected**: 200 OK with same `conversation_id`

### Test 3: User Isolation

```bash
# Try to access conversation with different user's token
# Expected: 404 Not Found
```

### Test 4: Frontend Integration

1. Navigate to http://localhost:3000/chat
2. Type a message and press Send
3. Verify message appears and response is received
4. Refresh page
5. Verify conversation_id is preserved (via localStorage)

### Test 5: Statelessness

1. Send several messages
2. Restart backend server
3. Send new message with same conversation_id
4. Verify full history is reconstructed from DB

---

## Environment Variables

### Backend (no new variables)

Existing variables sufficient:
- `DATABASE_URL`
- `BETTER_AUTH_SECRET`

### Frontend (optional)

```env
# frontend/.env.local
NEXT_PUBLIC_OPENAI_DOMAIN_KEY=your_key_here  # Only if using hosted ChatKit
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| 401 Unauthorized | Check token is valid, not expired |
| 403 Forbidden | Verify user_id in path matches token |
| 404 Conversation not found | Ensure conversation_id exists and belongs to user |
| Tables not created | Check database connection, restart backend |
| CORS errors | Add frontend URL to CORS_ORIGINS in backend |
