# Implementation Plan: Phase III - AI Chatbot Integration

**Branch**: `001-phase3-chatbot` | **Date**: 2026-02-09 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-phase3-chatbot/spec.md`

---

## Summary

Implement a stateless conversational chat interface that integrates with the existing Phase II Todo application. This plan covers database schema extensions (Conversation + Message models), a new POST `/api/{user_id}/chat` endpoint in FastAPI, and OpenAI ChatKit UI integration in the Next.js frontend. All conversation state is persisted to Neon PostgreSQL, ensuring full statelessness and resumability after server restarts.

---

## Technical Context

**Language/Version**: Python 3.11+ (Backend), TypeScript 5.x (Frontend)
**Primary Dependencies**: FastAPI, SQLModel, Next.js 16+, OpenAI ChatKit
**Storage**: Neon Serverless PostgreSQL (asyncpg)
**Testing**: Manual curl tests + browser verification
**Target Platform**: Web application (Vercel frontend, containerized backend)
**Project Type**: Web application (monorepo: frontend/ + backend/)
**Performance Goals**: Chat response < 5 seconds, UI interactive < 3 seconds
**Constraints**: Fully stateless server, DB-only state persistence
**Scale/Scope**: Single active conversation per user (multi-conversation out of scope)

---

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| Technology Stack | ✅ PASS | Uses mandated stack: FastAPI, SQLModel, Next.js, Better Auth |
| Security & Data Isolation | ✅ PASS | JWT enforcement, user_id filtering, ownership verification |
| API Design | ✅ PASS | New endpoint follows `/api/{user_id}/chat` pattern |
| Database Schema | ✅ PASS | New tables extend existing schema; no alterations to tasks table |
| Code Quality | ✅ PASS | TypeScript strict, Pydantic validation, proper error handling |
| Scope Limitation | ⚠️ NOTE | Phase III chatbot IS in scope per hackathon spec extension |

**Constitution Compliance**: All gates pass. Phase III chatbot features are explicitly permitted as scope extension.

---

## Project Structure

### Documentation (this feature)

```text
specs/001-phase3-chatbot/
├── spec.md              # Feature specification
├── plan.md              # This file
├── research.md          # Phase 0 output (ChatKit integration patterns)
├── data-model.md        # Phase 1 output (Conversation, Message models)
├── quickstart.md        # Phase 1 output (setup and verification steps)
├── contracts/           # Phase 1 output (OpenAPI for chat endpoint)
│   └── openapi-chat.yaml
├── checklists/
│   └── requirements.md  # Spec quality checklist
└── tasks.md             # Phase 2 output (/sp.tasks)
```

### Source Code (repository root)

```text
backend/
├── models.py            # ADD: Conversation, Message models
├── routes/
│   ├── tasks.py         # Existing task endpoints
│   └── chat.py          # NEW: Chat endpoint router
├── schemas/
│   ├── task.py          # Existing
│   └── chat.py          # NEW: ChatRequest, ChatResponse
└── main.py              # MODIFY: Include chat router

frontend/
├── app/
│   ├── (dashboard)/
│   │   ├── chat/        # NEW: Protected chat route
│   │   │   └── page.tsx
│   │   └── layout.tsx   # Existing (reused for protection)
│   └── ...
├── components/
│   ├── chat/            # NEW: Chat components
│   │   ├── chat-container.tsx
│   │   └── chat-message.tsx
│   └── ...
├── lib/
│   ├── api.ts           # MODIFY: Add chatApi
│   └── chat-client.ts   # NEW: Chat-specific API client
└── types/
    └── chat.ts          # NEW: Chat type definitions
```

**Structure Decision**: Web application structure maintained. New chat functionality added as parallel feature alongside existing tasks.

---

## 1. Overall Integration Architecture

### System Flow Diagram

```
┌──────────────────────────────────────────────────────────────────────────┐
│                      FRONTEND (Next.js App Router)                       │
│                                                                          │
│  /chat (Protected Route)                                                 │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │                    ChatContainer Component                         │ │
│  │  ┌──────────────────────────────────────────────────────────────┐ │ │
│  │  │   OpenAI ChatKit UI Component                                │ │ │
│  │  │   - Message input field                                      │ │ │
│  │  │   - Conversation history display                             │ │ │
│  │  │   - Loading/error states                                     │ │ │
│  │  └──────────────────────────────────────────────────────────────┘ │ │
│  │                              │                                     │ │
│  │              useSession() → user_id + token                        │ │
│  │              conversation_id state (localStorage backup)           │ │
│  └────────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────┘
                                  │
                                  │ POST /api/{user_id}/chat
                                  │ Headers: Authorization: Bearer <token>
                                  │ Body: { conversation_id?, message }
                                  ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                       BACKEND (FastAPI)                                  │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │  CurrentUser Dependency (auth/dependencies.py)                     │ │
│  │  - Extracts user_id from Bearer token                              │ │
│  │  - Validates against Better Auth session OR JWT                    │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                              │                                          │
│                              ▼                                          │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │  POST /api/{user_id}/chat (routes/chat.py)                         │ │
│  │                                                                     │ │
│  │  Step 1: verify_user_ownership(path_user_id, token_user_id)        │ │
│  │  Step 2: Get or create Conversation (user_id filter)               │ │
│  │  Step 3: Load ALL messages for conversation (stateless rebuild)    │ │
│  │  Step 4: Store incoming user message                               │ │
│  │  Step 5: [PLACEHOLDER] Call external AI handler                    │ │
│  │  Step 6: Store assistant response                                  │ │
│  │  Step 7: Return ChatResponse                                       │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                              │                                          │
└──────────────────────────────────────────────────────────────────────────┘
                                  │
                                  │ SQLModel ORM (asyncpg)
                                  ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                    DATABASE (Neon PostgreSQL)                            │
│                                                                          │
│  ┌─────────────────────┐      ┌────────────────────────────────────┐   │
│  │   conversations     │      │           messages                 │   │
│  │   ─────────────     │      │           ────────                 │   │
│  │   id (PK)           │◄─────│   id (PK)                          │   │
│  │   user_id (IDX)     │      │   conversation_id (FK, IDX)        │   │
│  │   created_at        │      │   user_id (IDX)                    │   │
│  │   updated_at        │      │   role ('user'|'assistant')        │   │
│  └─────────────────────┘      │   content (TEXT)                   │   │
│                               │   created_at (IDX)                 │   │
│                               └────────────────────────────────────┘   │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │              Existing Phase II Tables (unchanged)                 │  │
│  │              tasks, user, session, account, verification          │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────┘
```

### Key Principles

1. **Stateless Server**: No in-memory conversation state; every request rebuilds context from DB
2. **DB-Only State**: All conversation/message data persisted to Neon PostgreSQL
3. **JWT User Isolation**: Every query filtered by authenticated `user_id`
4. **Resumability**: Server restart = no data loss; conversations continue seamlessly

---

## 2. Database Extensions

### SQLModel Definitions

#### Conversation Model

```python
# backend/models.py (append to existing file)

from enum import Enum
from typing import Optional, List
from sqlmodel import SQLModel, Field, Relationship
from datetime import datetime, timezone


class Conversation(SQLModel, table=True):
    """Conversation model for chat sessions."""

    __tablename__ = "conversations"

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: str = Field(index=True, nullable=False)
    created_at: Optional[datetime] = Field(
        default_factory=lambda: datetime.now(timezone.utc).replace(tzinfo=None)
    )
    updated_at: Optional[datetime] = Field(
        default_factory=lambda: datetime.now(timezone.utc).replace(tzinfo=None)
    )

    # Relationship to messages
    messages: List["Message"] = Relationship(back_populates="conversation")


class MessageRole(str, Enum):
    """Enum for message roles."""
    USER = "user"
    ASSISTANT = "assistant"


class Message(SQLModel, table=True):
    """Message model for individual chat messages."""

    __tablename__ = "messages"

    id: Optional[int] = Field(default=None, primary_key=True)
    conversation_id: int = Field(foreign_key="conversations.id", index=True, nullable=False)
    user_id: str = Field(index=True, nullable=False)
    role: MessageRole = Field(nullable=False)
    content: str = Field(nullable=False)
    created_at: Optional[datetime] = Field(
        default_factory=lambda: datetime.now(timezone.utc).replace(tzinfo=None),
        index=True
    )

    # Relationship back to conversation
    conversation: Optional[Conversation] = Relationship(back_populates="messages")
```

### Table Creation

Tables are auto-created via SQLModel's `create_db_tables()` on startup (already configured in `database.py`). The existing pattern:

```python
# database.py - already exists
async def create_db_tables():
    """Create all tables on startup (development only)."""
    async with async_engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)
```

**No migration needed**: SQLModel automatically handles schema creation for new models.

### Indexes & Constraints

| Table | Index | Purpose |
|-------|-------|---------|
| conversations | user_id | Fast lookup of user's conversations |
| messages | conversation_id | Efficient message fetch per conversation |
| messages | user_id | User isolation enforcement |
| messages | created_at | Chronological ordering |

### Dependencies

- Uses existing `get_db` async session dependency from `database.py`
- Follows same pattern as existing `Task` model

---

## 3. Backend Chat Endpoint Implementation

### File Location

**New file**: `backend/routes/chat.py`

### Router Setup

```python
# backend/routes/chat.py

from typing import Annotated, List, Optional, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select
from datetime import datetime, timezone

from database import get_db
from models import Conversation, Message, MessageRole
from schemas.chat import ChatRequest, ChatResponse, ToolCallMetadata
from auth.dependencies import CurrentUser, verify_user_ownership

router = APIRouter(prefix="/api", tags=["chat"])
```

### Pydantic Schemas

**New file**: `backend/schemas/chat.py`

```python
# backend/schemas/chat.py

from pydantic import BaseModel, Field, field_validator
from typing import Optional, List, Any


class ChatRequest(BaseModel):
    """Request schema for chat endpoint."""
    conversation_id: Optional[int] = Field(default=None, description="Existing conversation ID")
    message: str = Field(..., min_length=1, max_length=4000, description="User message")

    @field_validator("message")
    @classmethod
    def validate_message(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Message cannot be empty or whitespace only")
        return v.strip()


class ToolCallMetadata(BaseModel):
    """Metadata for tool calls made during response generation."""
    tool: str
    arguments: dict[str, Any]
    result: str


class ChatResponse(BaseModel):
    """Response schema for chat endpoint."""
    conversation_id: int
    response: str
    tool_calls: List[ToolCallMetadata] = Field(default_factory=list)
```

### Endpoint Implementation

```python
# backend/routes/chat.py (continued)

@router.post(
    "/{user_id}/chat",
    response_model=ChatResponse,
    summary="Process chat message",
    description="Handle user chat message with stateless conversation management"
)
async def chat(
    user_id: str,
    request: ChatRequest,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> ChatResponse:
    """
    Process a chat message.

    Flow:
    1. Verify user ownership
    2. Get or create conversation
    3. Load full message history (stateless)
    4. Store user message
    5. [PLACEHOLDER] Generate response via external handler
    6. Store assistant response
    7. Return structured response
    """
    import logging
    logger = logging.getLogger(__name__)

    # Step 1: Verify user_id from path matches token
    verify_user_ownership(user_id, current_user)

    # Step 2: Get or create conversation
    conversation: Conversation
    if request.conversation_id:
        # Fetch existing conversation with ownership check
        result = await db.execute(
            select(Conversation).where(
                Conversation.id == request.conversation_id,
                Conversation.user_id == current_user
            )
        )
        conversation = result.scalar_one_or_none()
        if not conversation:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Conversation not found"
            )
    else:
        # Create new conversation
        conversation = Conversation(user_id=current_user)
        db.add(conversation)
        await db.commit()
        await db.refresh(conversation)
        logger.info(f"Created new conversation {conversation.id} for user {current_user}")

    # Step 3: Load full message history (STATELESS - always from DB)
    history_result = await db.execute(
        select(Message)
        .where(Message.conversation_id == conversation.id)
        .order_by(Message.created_at.asc())
    )
    message_history = history_result.scalars().all()

    # Step 4: Store user message
    user_message = Message(
        conversation_id=conversation.id,
        user_id=current_user,
        role=MessageRole.USER,
        content=request.message,
    )
    db.add(user_message)
    await db.commit()

    # Step 5: [PLACEHOLDER] Generate response
    # This is where external AI handler would be called
    # For now, return a placeholder response
    assistant_text = f"[AI Response Placeholder] Received: {request.message}"
    tool_calls: List[ToolCallMetadata] = []

    # Step 6: Store assistant response
    assistant_message = Message(
        conversation_id=conversation.id,
        user_id=current_user,
        role=MessageRole.ASSISTANT,
        content=assistant_text,
    )
    db.add(assistant_message)

    # Update conversation timestamp
    conversation.updated_at = datetime.now(timezone.utc).replace(tzinfo=None)
    db.add(conversation)
    await db.commit()

    logger.info(f"Chat completed for conversation {conversation.id}")

    # Step 7: Return response
    return ChatResponse(
        conversation_id=conversation.id,
        response=assistant_text,
        tool_calls=tool_calls,
    )
```

### Error Handling

| Status | Condition | Handler |
|--------|-----------|---------|
| 400 | Empty/invalid message | Pydantic validation |
| 401 | Missing/invalid token | `CurrentUser` dependency |
| 403 | user_id mismatch | `verify_user_ownership()` |
| 404 | Conversation not found | Explicit check in endpoint |
| 422 | Validation error | FastAPI automatic |
| 500 | Server error | Try/except with rollback |

### Register Router in main.py

```python
# backend/main.py - add import and include

from routes.chat import router as chat_router

# In app setup section:
app.include_router(chat_router)
```

---

## 4. Authentication & Security Rules

### Reuse Existing JWT Dependency

The chat endpoint reuses `CurrentUser` from `auth/dependencies.py`:

```python
# Existing - no changes needed
CurrentUser = Annotated[str, Depends(get_current_user)]
```

### Ownership Enforcement Pattern

```python
# Pattern used in chat.py (same as tasks.py)
verify_user_ownership(path_user_id, current_user_id)

# Plus ownership filter on conversation query:
select(Conversation).where(
    Conversation.id == request.conversation_id,
    Conversation.user_id == current_user  # Critical filter
)
```

### Security Invariants

1. **Path Parameter Validation**: `user_id` in URL must match JWT `user_id`
2. **Conversation Ownership**: All conversation queries include `user_id` filter
3. **Message Ownership**: All messages include `user_id` for audit/isolation
4. **No Cross-User Access**: Impossible to query another user's data

---

## 5. Frontend ChatKit Integration

### Route Structure

**Path**: `/chat` (inside `(dashboard)` group for protection)

```text
frontend/app/(dashboard)/chat/
└── page.tsx             # Chat page component
```

### Page Component Structure

```tsx
// frontend/app/(dashboard)/chat/page.tsx

"use client"

import { useEffect, useState } from "react"
import { useSession } from "@/lib/auth-client"
import { ChatContainer } from "@/components/chat/chat-container"
import { LoadingSpinner } from "@/components/ui/loading-spinner"

export default function ChatPage() {
  const { data: session, isPending } = useSession()
  const [conversationId, setConversationId] = useState<number | null>(() => {
    // Restore from localStorage on mount
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("chatConversationId")
      return stored ? parseInt(stored, 10) : null
    }
    return null
  })

  // Persist conversation ID
  useEffect(() => {
    if (conversationId) {
      localStorage.setItem("chatConversationId", String(conversationId))
    }
  }, [conversationId])

  if (isPending) {
    return <LoadingSpinner />
  }

  if (!session?.user) {
    return null // Layout handles redirect
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <h1 className="text-2xl font-bold mb-4">Chat with AI Assistant</h1>
      <ChatContainer
        userId={session.user.id}
        conversationId={conversationId}
        onConversationCreated={setConversationId}
      />
    </div>
  )
}
```

### ChatContainer Component

```tsx
// frontend/components/chat/chat-container.tsx

"use client"

import { useState, useCallback } from "react"
import { chatApi, ChatMessage } from "@/lib/chat-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { Send, Loader2 } from "lucide-react"

interface ChatContainerProps {
  userId: string
  conversationId: number | null
  onConversationCreated: (id: number) => void
}

export function ChatContainer({
  userId,
  conversationId,
  onConversationCreated,
}: ChatContainerProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSend = useCallback(async () => {
    if (!input.trim() || isLoading) return

    const userMessage = input.trim()
    setInput("")
    setMessages((prev) => [...prev, { role: "user", content: userMessage }])
    setIsLoading(true)

    try {
      const response = await chatApi.sendMessage(userId, {
        conversation_id: conversationId ?? undefined,
        message: userMessage,
      })

      // Update conversation ID if new
      if (!conversationId) {
        onConversationCreated(response.conversation_id)
      }

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: response.response },
      ])
    } catch (error) {
      toast.error("Failed to send message")
      // Remove optimistic user message on error
      setMessages((prev) => prev.slice(0, -1))
    } finally {
      setIsLoading(false)
    }
  }, [input, isLoading, conversationId, userId, onConversationCreated])

  return (
    <div className="flex flex-col flex-1 border rounded-lg bg-card">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <p className="text-muted-foreground text-center">
            Start a conversation with the AI assistant
          </p>
        )}
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] rounded-lg px-4 py-2 ${
                msg.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted"
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-muted rounded-lg px-4 py-2">
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="border-t p-4">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            handleSend()
          }}
          className="flex gap-2"
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button type="submit" disabled={isLoading || !input.trim()}>
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            <span className="sr-only">Send message</span>
          </Button>
        </form>
      </div>
    </div>
  )
}
```

### Chat API Client

```typescript
// frontend/lib/chat-client.ts

import { authClient } from "./auth-client"
import { ApiError } from "./api"

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

export interface ChatMessage {
  role: "user" | "assistant"
  content: string
}

export interface ChatRequest {
  conversation_id?: number
  message: string
}

export interface ToolCallMetadata {
  tool: string
  arguments: Record<string, unknown>
  result: string
}

export interface ChatResponse {
  conversation_id: number
  response: string
  tool_calls: ToolCallMetadata[]
}

export const chatApi = {
  sendMessage: async (userId: string, request: ChatRequest): Promise<ChatResponse> => {
    const session = await authClient.getSession()

    if (!session?.data?.session) {
      throw new ApiError(401, "Not authenticated")
    }

    const token = session.data.session.token

    const response = await fetch(`${API_BASE}/api/${userId}/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(request),
    })

    if (response.status === 401) {
      await authClient.signOut()
      if (typeof window !== "undefined") {
        window.location.href = "/login"
      }
      throw new ApiError(401, "Session expired")
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: "Request failed" }))
      throw new ApiError(response.status, error.error || error.detail || "Request failed")
    }

    return response.json()
  },
}
```

### TypeScript Types

```typescript
// frontend/types/chat.ts

export interface ChatMessage {
  role: "user" | "assistant"
  content: string
}

export interface ChatRequest {
  conversation_id?: number
  message: string
}

export interface ToolCallMetadata {
  tool: string
  arguments: Record<string, unknown>
  result: string
}

export interface ChatResponse {
  conversation_id: number
  response: string
  tool_calls: ToolCallMetadata[]
}
```

### Route Protection

Uses existing `(dashboard)` layout which checks session:

```tsx
// frontend/app/(dashboard)/layout.tsx - already exists
const session = await auth.api.getSession({ headers: await headers() })
if (!session) {
  redirect("/login")
}
```

---

## 6. Production & Deployment Considerations

### OpenAI ChatKit Domain Allowlist

**Note**: If using OpenAI hosted ChatKit, domain allowlist configuration is required.

| Step | Action |
|------|--------|
| 1 | Log in to OpenAI Platform dashboard |
| 2 | Navigate to ChatKit settings |
| 3 | Add production domains to allowlist |
| 4 | Copy domain key to environment variable |

**Domains to add**:
- `https://your-app.vercel.app` (Vercel deployment)
- Custom domain if configured
- HuggingFace Spaces URL if backend exposed there

### Environment Variables

**New variable (Frontend)**:

```env
# frontend/.env.local
NEXT_PUBLIC_OPENAI_DOMAIN_KEY=your_domain_key_here
```

**Existing variables (no changes)**:
- `NEXT_PUBLIC_API_URL` - Backend API URL
- `NEXT_PUBLIC_APP_URL` - Frontend URL
- `DATABASE_URL` - Neon PostgreSQL connection
- `BETTER_AUTH_SECRET` - JWT signing secret

### CORS Configuration

Backend CORS is already configured in `main.py`. If ChatKit requires additional origins:

```python
# backend/main.py - may need update
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS.split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

Ensure `CORS_ORIGINS` includes frontend deployment URL.

---

## 7. Phased Implementation Order (for /sp.tasks)

### Phase 1: Database Layer

| Task | Description | Files |
|------|-------------|-------|
| 1.1 | Add Conversation model to models.py | backend/models.py |
| 1.2 | Add Message model to models.py | backend/models.py |
| 1.3 | Verify table creation on startup | backend/database.py |

### Phase 2: Backend Schemas

| Task | Description | Files |
|------|-------------|-------|
| 2.1 | Create ChatRequest schema | backend/schemas/chat.py |
| 2.2 | Create ChatResponse schema | backend/schemas/chat.py |
| 2.3 | Create ToolCallMetadata schema | backend/schemas/chat.py |

### Phase 3: Backend Router

| Task | Description | Files |
|------|-------------|-------|
| 3.1 | Create chat router skeleton | backend/routes/chat.py |
| 3.2 | Implement conversation get/create logic | backend/routes/chat.py |
| 3.3 | Implement message storage logic | backend/routes/chat.py |
| 3.4 | Add placeholder response generation | backend/routes/chat.py |
| 3.5 | Register router in main.py | backend/main.py |

### Phase 4: Frontend Types & Client

| Task | Description | Files |
|------|-------------|-------|
| 4.1 | Create chat type definitions | frontend/types/chat.ts |
| 4.2 | Create chat API client | frontend/lib/chat-client.ts |

### Phase 5: Frontend UI

| Task | Description | Files |
|------|-------------|-------|
| 5.1 | Create ChatContainer component | frontend/components/chat/chat-container.tsx |
| 5.2 | Create chat page | frontend/app/(dashboard)/chat/page.tsx |
| 5.3 | Add chat link to sidebar | frontend/components/layout/sidebar.tsx |

### Phase 6: Polish & Documentation

| Task | Description | Files |
|------|-------------|-------|
| 6.1 | Add loading states and error handling | Various |
| 6.2 | Update README with Phase III setup | README.md |
| 6.3 | Add environment variable documentation | .env.example files |

---

## 8. Quality & Verification Gates

### Type Safety

| Layer | Requirement |
|-------|-------------|
| Backend | Pydantic strict validation on all schemas |
| Backend | SQLModel field type annotations |
| Frontend | TypeScript strict mode enabled |
| Frontend | Proper typing for all API responses |

### Manual Test Cases

**Backend (curl)**:

```bash
# Test 1: Create new conversation
curl -X POST "http://localhost:8000/api/{user_id}/chat" \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello"}'

# Expected: 200, new conversation_id returned

# Test 2: Continue conversation
curl -X POST "http://localhost:8000/api/{user_id}/chat" \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"conversation_id": 1, "message": "Follow up"}'

# Expected: 200, same conversation_id

# Test 3: Invalid conversation_id
curl -X POST "http://localhost:8000/api/{user_id}/chat" \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"conversation_id": 99999, "message": "Test"}'

# Expected: 404

# Test 4: Missing auth
curl -X POST "http://localhost:8000/api/{user_id}/chat" \
  -H "Content-Type: application/json" \
  -d '{"message": "Test"}'

# Expected: 401

# Test 5: User mismatch
curl -X POST "http://localhost:8000/api/different-user/chat" \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"message": "Test"}'

# Expected: 403
```

**Frontend (browser)**:

| Test | Steps | Expected |
|------|-------|----------|
| Navigate to /chat | Click chat link in sidebar | Chat page loads |
| Send message | Type message, click send | Message appears, response received |
| Conversation persists | Refresh page, send another message | Context maintained |
| Auth redirect | Log out, navigate to /chat | Redirected to login |

### Statelessness Verification

```bash
# 1. Start conversation, send 2-3 messages
# 2. Restart backend server
# 3. Send new message with same conversation_id
# Expected: Response acknowledges full history
```

### User Isolation Test

```bash
# 1. Create conversation as User A
# 2. Note conversation_id
# 3. Log in as User B
# 4. Try to access User A's conversation_id
# Expected: 404 Not Found
```

---

## Complexity Tracking

> No constitution violations requiring justification. Phase III chatbot is explicitly permitted per hackathon scope extension.

---

"Phase III chatbot integration plan complete. Focuses exclusively on database extensions, stateless chat endpoint, and OpenAI ChatKit frontend wiring. Ready for /sp.tasks to break into atomic implementation steps."
