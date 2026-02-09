# Tasks: Phase III - AI Chatbot Integration

**Input**: Design documents from `/specs/001-phase3-chatbot/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/openapi-chat.yaml

**Tests**: Manual verification only (curl + browser). No automated tests required per specification.

**Organization**: Tasks organized by implementation phase (database → backend → frontend → polish) to enable incremental delivery.

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: User story reference (US1, US2, US3, US4)
- Include exact file paths in descriptions

## User Stories Mapping

| Story | Priority | Description |
|-------|----------|-------------|
| US1 | P1 | Send First Chat Message (core functionality) |
| US2 | P1 | Continue Existing Conversation (context persistence) |
| US3 | P2 | Resume After Server Restart (stateless verification) |
| US4 | P1 | User Data Isolation (security) |

---

## Phase 1: Database Extensions

**Purpose**: Add Conversation and Message models to support chat persistence

**Reference**: plan.md Section 2, data-model.md

- [x] T001 Add MessageRole enum to backend/models.py
  - **File**: `backend/models.py`
  - **Details**: Add `class MessageRole(str, Enum)` with values `USER = "user"` and `ASSISTANT = "assistant"`
  - **Commit**: `feat(backend): add MessageRole enum for chat messages`
  - **Verify**: `python -c "from models import MessageRole; print(MessageRole.USER.value)"`

- [x] T002 Add Conversation model to backend/models.py
  - **File**: `backend/models.py`
  - **Details**: Add `class Conversation(SQLModel, table=True)` with fields: `id` (int PK), `user_id` (str, indexed), `created_at` (datetime), `updated_at` (datetime)
  - **Commit**: `feat(backend): add Conversation model for chat sessions`
  - **Verify**: `python -c "from models import Conversation; print(Conversation.__tablename__)"`

- [x] T003 Add Message model to backend/models.py
  - **File**: `backend/models.py`
  - **Details**: Add `class Message(SQLModel, table=True)` with fields: `id` (int PK), `conversation_id` (int FK, indexed), `user_id` (str, indexed), `role` (MessageRole), `content` (str), `created_at` (datetime, indexed)
  - **Commit**: `feat(backend): add Message model for chat messages`
  - **Verify**: `python -c "from models import Message; print(Message.__tablename__)"`

- [x] T004 Add SQLModel Relationships between Conversation and Message
  - **File**: `backend/models.py`
  - **Details**: Add `messages: List["Message"] = Relationship(back_populates="conversation")` to Conversation, and `conversation: Optional[Conversation] = Relationship(back_populates="messages")` to Message
  - **Commit**: `feat(backend): add relationships between Conversation and Message`
  - **Verify**: Start backend server, check tables created in Neon PostgreSQL

**Checkpoint**: Database models ready. Tables auto-created on startup via existing `create_db_tables()`.

---

## Phase 2: Backend Schemas

**Purpose**: Define Pydantic request/response models for chat endpoint

**Reference**: plan.md Section 3, contracts/openapi-chat.yaml

- [x] T005 [P] Create backend/schemas/chat.py with ChatRequest model
  - **File**: `backend/schemas/chat.py` (NEW)
  - **Details**: Create `class ChatRequest(BaseModel)` with `conversation_id: Optional[int]`, `message: str = Field(..., min_length=1, max_length=4000)`. Add `@field_validator("message")` to strip whitespace and reject empty.
  - **Commit**: `feat(backend): add ChatRequest Pydantic schema`
  - **Verify**: `python -c "from schemas.chat import ChatRequest; print(ChatRequest.model_fields)"`

- [x] T006 [P] Add ToolCallMetadata model to backend/schemas/chat.py
  - **File**: `backend/schemas/chat.py`
  - **Details**: Add `class ToolCallMetadata(BaseModel)` with `tool: str`, `arguments: dict[str, Any]`, `result: str`
  - **Commit**: `feat(backend): add ToolCallMetadata schema for chat responses`
  - **Verify**: `python -c "from schemas.chat import ToolCallMetadata; print(ToolCallMetadata.model_fields)"`

- [x] T007 Add ChatResponse model to backend/schemas/chat.py
  - **File**: `backend/schemas/chat.py`
  - **Details**: Add `class ChatResponse(BaseModel)` with `conversation_id: int`, `response: str`, `tool_calls: List[ToolCallMetadata] = Field(default_factory=list)`
  - **Commit**: `feat(backend): add ChatResponse Pydantic schema`
  - **Verify**: `python -c "from schemas.chat import ChatResponse; print(ChatResponse.model_fields)"`

- [x] T008 Add __init__.py export for chat schemas
  - **File**: `backend/schemas/__init__.py`
  - **Details**: Add `from .chat import ChatRequest, ChatResponse, ToolCallMetadata`
  - **Commit**: `chore(backend): export chat schemas from __init__`
  - **Verify**: `python -c "from schemas import ChatRequest, ChatResponse"`

**Checkpoint**: All Pydantic schemas ready for endpoint implementation.

---

## Phase 3: Backend Chat Router Skeleton

**Purpose**: Create chat endpoint with authentication and user ownership verification

**Reference**: plan.md Section 3, spec.md FR-001 through FR-010

- [x] T009 Create backend/routes/chat.py with router setup
  - **File**: `backend/routes/chat.py` (NEW)
  - **Details**: Create file with `router = APIRouter(prefix="/api", tags=["chat"])`, import `get_db`, `CurrentUser`, `verify_user_ownership` from existing auth
  - **Commit**: `feat(backend): create chat router skeleton`
  - **Verify**: `python -c "from routes.chat import router; print(router.prefix)"`

- [x] T010 [US4] Add POST /{user_id}/chat endpoint skeleton with auth
  - **File**: `backend/routes/chat.py`
  - **Details**: Add `@router.post("/{user_id}/chat", response_model=ChatResponse)` with params: `user_id: str`, `request: ChatRequest`, `current_user: CurrentUser`, `db: AsyncSession`. Call `verify_user_ownership(user_id, current_user)` first.
  - **Commit**: `feat(backend): add chat endpoint with user ownership verification`
  - **Verify**: Backend starts without errors

- [x] T011 Register chat router in backend/main.py
  - **File**: `backend/main.py`
  - **Details**: Add `from routes.chat import router as chat_router` and `app.include_router(chat_router)`
  - **Commit**: `feat(backend): register chat router in FastAPI app`
  - **Verify**: `curl http://localhost:8000/docs` - chat endpoint visible in Swagger

**Checkpoint**: Endpoint registered, auth enforced. Returns 401/403 on invalid requests.

---

## Phase 4: Stateless Chat Logic (Core Implementation)

**Purpose**: Implement full stateless conversation flow

**Reference**: plan.md Section 3 (endpoint implementation), spec.md FR-002 through FR-010

### US1 & US2: Conversation Management

- [x] T012 [US1] [US2] Implement get_or_create_conversation logic
  - **File**: `backend/routes/chat.py`
  - **Details**: If `request.conversation_id` provided: query `Conversation` with `id` AND `user_id == current_user`, raise 404 if not found. Else: create new `Conversation(user_id=current_user)`, commit, refresh.
  - **Commit**: `feat(backend): implement conversation get/create with ownership check`
  - **Verify**: Endpoint creates conversation on first call

- [x] T013 [US1] Implement store_user_message logic
  - **File**: `backend/routes/chat.py`
  - **Details**: Create `Message(conversation_id=..., user_id=current_user, role=MessageRole.USER, content=request.message)`, add to session, commit.
  - **Commit**: `feat(backend): store user messages in database`
  - **Verify**: Message record created in `messages` table

- [x] T014 [US1] Add placeholder AI response generation
  - **File**: `backend/routes/chat.py`
  - **Details**: Add `assistant_text = f"[AI Placeholder] Received: {request.message}"` and `tool_calls: List[ToolCallMetadata] = []`. Comment: `# TODO: Replace with external AI handler`
  - **Commit**: `feat(backend): add placeholder response generation`
  - **Verify**: Endpoint returns placeholder response

- [x] T015 [US1] Implement store_assistant_message logic
  - **File**: `backend/routes/chat.py`
  - **Details**: Create `Message(conversation_id=..., user_id=current_user, role=MessageRole.ASSISTANT, content=assistant_text)`, add to session.
  - **Commit**: `feat(backend): store assistant messages in database`
  - **Verify**: Assistant message record created

- [x] T016 [US2] Update conversation.updated_at on each message
  - **File**: `backend/routes/chat.py`
  - **Details**: Set `conversation.updated_at = datetime.now(timezone.utc).replace(tzinfo=None)`, add to session, commit.
  - **Commit**: `feat(backend): update conversation timestamp on message`
  - **Verify**: `updated_at` changes after each message

- [x] T017 [US1] Return ChatResponse with conversation_id and response
  - **File**: `backend/routes/chat.py`
  - **Details**: Return `ChatResponse(conversation_id=conversation.id, response=assistant_text, tool_calls=tool_calls)`
  - **Commit**: `feat(backend): return complete ChatResponse`
  - **Verify**: `curl -X POST "http://localhost:8000/api/{user_id}/chat" -H "Authorization: Bearer {token}" -H "Content-Type: application/json" -d '{"message": "Hello"}'` returns JSON with `conversation_id` and `response`

### US3: Stateless History Reconstruction

- [x] T018 [US3] Load full message history from database (stateless)
  - **File**: `backend/routes/chat.py`
  - **Details**: Query `select(Message).where(Message.conversation_id == conversation.id).order_by(Message.created_at.asc())`. Store in `message_history` variable. Add comment: `# Full history loaded for stateless operation`
  - **Commit**: `feat(backend): load complete message history on each request`
  - **Verify**: Restart server, continue conversation - history available

### US4: Error Handling

- [x] T019 [US4] Add comprehensive error handling
  - **File**: `backend/routes/chat.py`
  - **Details**: Wrap main logic in try/except. Catch specific exceptions: 404 for conversation not found (already done), 500 for unexpected errors with `await db.rollback()`. Log errors.
  - **Commit**: `feat(backend): add error handling and rollback`
  - **Verify**: Invalid requests return proper error codes (400, 401, 403, 404, 500)

**Checkpoint**: Backend fully functional. Test with curl:
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
  -d '{"conversation_id": 1, "message": "Follow up"}'
```

---

## Phase 5: Frontend Types & API Client

**Purpose**: Create TypeScript types and API client for chat functionality

**Reference**: plan.md Section 5 (TypeScript Types, Chat API Client)

- [x] T020 [P] Create frontend/types/chat.ts with type definitions
  - **File**: `frontend/types/chat.ts` (NEW)
  - **Details**: Export interfaces `ChatMessage { role: "user" | "assistant"; content: string }`, `ChatRequest { conversation_id?: number; message: string }`, `ToolCallMetadata { tool: string; arguments: Record<string, unknown>; result: string }`, `ChatResponse { conversation_id: number; response: string; tool_calls: ToolCallMetadata[] }`
  - **Commit**: `feat(frontend): add TypeScript types for chat`
  - **Verify**: `npx tsc --noEmit` passes

- [x] T021 Create frontend/lib/chat-client.ts with API client
  - **File**: `frontend/lib/chat-client.ts` (NEW)
  - **Details**: Import `authClient` from `./auth-client`, `ApiError` from `./api`. Create `chatApi.sendMessage(userId: string, request: ChatRequest): Promise<ChatResponse>` that fetches with Bearer token, handles 401 (sign out + redirect), returns JSON.
  - **Commit**: `feat(frontend): add chat API client with auth`
  - **Verify**: TypeScript compiles without errors

**Checkpoint**: Frontend types and client ready for UI implementation.

---

## Phase 6: Frontend Chat UI

**Purpose**: Create chat page and components with authentication integration

**Reference**: plan.md Section 5 (Page Component, ChatContainer)

- [x] T022 [P] [US1] Create frontend/components/chat/chat-container.tsx
  - **File**: `frontend/components/chat/chat-container.tsx` (NEW)
  - **Details**: Create `ChatContainer` component with props `{ userId: string; conversationId: number | null; onConversationCreated: (id: number) => void }`. Manage `messages` state array, `input` string, `isLoading` boolean. Implement `handleSend` that calls `chatApi.sendMessage`, updates state.
  - **Commit**: `feat(frontend): add ChatContainer component`
  - **Verify**: Component renders without errors in isolation

- [x] T023 [US1] Add message display UI to ChatContainer
  - **File**: `frontend/components/chat/chat-container.tsx`
  - **Details**: Render messages with user messages on right (bg-primary), assistant on left (bg-muted). Add empty state message. Add loading spinner when `isLoading`.
  - **Commit**: `feat(frontend): add message display UI`
  - **Verify**: Messages display correctly when added to state

- [x] T024 [US1] Add message input form to ChatContainer
  - **File**: `frontend/components/chat/chat-container.tsx`
  - **Details**: Add form with Input and Button (Send icon). Disable when loading or empty input. Prevent default on submit, call `handleSend`.
  - **Commit**: `feat(frontend): add chat input form`
  - **Verify**: Form submits and updates state

- [x] T025 [US1] Create frontend/app/(dashboard)/chat/page.tsx
  - **File**: `frontend/app/(dashboard)/chat/page.tsx` (NEW)
  - **Details**: Add `"use client"` directive. Use `useSession()` hook to get user. Manage `conversationId` state. Render `ChatContainer` with props. Handle loading state.
  - **Commit**: `feat(frontend): add protected chat page`
  - **Verify**: Navigate to `/chat` while logged in - page renders

- [x] T026 [US2] Add localStorage persistence for conversation_id
  - **File**: `frontend/app/(dashboard)/chat/page.tsx`
  - **Details**: Initialize `conversationId` from `localStorage.getItem("chatConversationId")`. Use `useEffect` to save when `conversationId` changes.
  - **Commit**: `feat(frontend): persist conversation_id in localStorage`
  - **Verify**: Refresh page - conversation continues

- [x] T027 Add chat link to sidebar navigation
  - **File**: `frontend/components/layout/sidebar.tsx`
  - **Details**: Add navigation item with MessageSquare icon linking to `/chat`. Match existing sidebar item pattern.
  - **Commit**: `feat(frontend): add chat link to sidebar`
  - **Verify**: Sidebar shows chat link, navigation works

**Checkpoint**: Full chat UI functional. Test in browser:
1. Log in
2. Click Chat in sidebar
3. Send message
4. Receive response
5. Refresh page - conversation persists

---

## Phase 7: Polish & Documentation

**Purpose**: Error handling, environment configuration, documentation

**Reference**: plan.md Section 6, 8

- [x] T028 [P] Add error toast notifications in ChatContainer
  - **File**: `frontend/components/chat/chat-container.tsx`
  - **Details**: Import `toast` from `sonner`. In catch block: `toast.error("Failed to send message")`. On send error, remove optimistic user message.
  - **Commit**: `feat(frontend): add error toast notifications`
  - **Verify**: Network error shows toast

- [x] T029 [P] Add NEXT_PUBLIC_OPENAI_DOMAIN_KEY to frontend/.env.example
  - **File**: `frontend/.env.example`
  - **Details**: Add `NEXT_PUBLIC_OPENAI_DOMAIN_KEY=your_domain_key_here` with comment explaining ChatKit domain allowlist
  - **Commit**: `docs(frontend): add ChatKit domain key env var`
  - **Verify**: File contains new variable

- [x] T030 [P] Add Phase III section to README.md
  - **File**: `README.md`
  - **Details**: Add "## Phase III - AI Chatbot" section with: feature description, setup steps (env vars, domain allowlist), how to test (curl commands), architecture overview link to spec
  - **Commit**: `docs: add Phase III chatbot section to README`
  - **Verify**: README has new section

- [x] T031 Verify complete end-to-end flow
  - **Files**: All
  - **Details**: Manual verification: 1) Start backend, 2) Start frontend, 3) Log in, 4) Navigate to /chat, 5) Send message, 6) Verify response, 7) Refresh - verify persistence, 8) Restart backend - verify resumption
  - **Commit**: N/A (verification only)
  - **Verify**: All acceptance criteria from spec.md pass

**Checkpoint**: Phase III complete. All user stories verified.

---

## Dependencies

```
Phase 1 (T001-T004) → Phase 2 (T005-T008) → Phase 3 (T009-T011) → Phase 4 (T012-T019)
                                                                         ↓
                                            Phase 5 (T020-T021) ← (independent of backend)
                                                     ↓
                                            Phase 6 (T022-T027)
                                                     ↓
                                            Phase 7 (T028-T031)
```

## Parallel Execution Opportunities

| Phase | Parallelizable Tasks | Notes |
|-------|---------------------|-------|
| Phase 2 | T005, T006 | Different parts of same file |
| Phase 5 | T020 | Independent of backend progress |
| Phase 6 | T022 | Can start once T020, T021 complete |
| Phase 7 | T028, T029, T030 | Different files |

## Implementation Strategy

### MVP Scope (User Story 1 Complete)
After completing through **T027**, the core chat functionality is working:
- User can send first message
- User receives response
- Conversation persists

### Full Implementation
Complete **T028-T031** for production-ready code with:
- Error handling
- Documentation
- Environment configuration

---

## Summary

| Metric | Count |
|--------|-------|
| Total Tasks | 31 |
| Phase 1 (Database) | 4 |
| Phase 2 (Schemas) | 4 |
| Phase 3 (Router) | 3 |
| Phase 4 (Logic) | 8 |
| Phase 5 (Frontend Types) | 2 |
| Phase 6 (Frontend UI) | 6 |
| Phase 7 (Polish) | 4 |
| Parallelizable | 8 |

---

"Phase III integration broken into 31 small tasks. Ready for /sp.implement – recommend starting with Phase 1 (database) then Phase 2 (endpoint skeleton)."
