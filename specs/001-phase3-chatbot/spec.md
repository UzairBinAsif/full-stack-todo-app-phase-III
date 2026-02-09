# Feature Specification: Phase III - AI Chatbot Integration

**Feature Branch**: `001-phase3-chatbot`
**Created**: 2026-02-09
**Status**: Draft
**Input**: User description: "Phase III AI-powered conversational Todo chatbot integration layer for existing full-stack Todo application"

---

## Overview & Objective

### Purpose

Add a stateless conversational interface that allows authenticated users to manage their todos via natural language. This specification covers exclusively the **integration layer and supporting infrastructure** required for a chat interface that can interact with the existing Todo backend.

### Scope Boundaries

**In Scope:**
- Chat UI integration using OpenAI ChatKit on the frontend
- Single stateless POST endpoint for chat interactions
- Database schema extensions for conversation and message persistence
- JWT authentication integration for user isolation
- Conversation state persistence and resumption

**Out of Scope:**
- AI agent definition, creation, or configuration
- MCP servers or tool/function implementations
- AI model selection or prompt engineering
- Natural language processing logic internals

### Existing Stack (Phase II)

| Layer      | Technology                    |
|------------|-------------------------------|
| Frontend   | Next.js 16+ (App Router)      |
| Backend    | FastAPI (Python)              |
| ORM        | SQLModel                      |
| Database   | Neon PostgreSQL               |
| Auth       | Better Auth with JWT          |

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           FRONTEND (Next.js)                            │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                    /chat (Protected Route)                       │   │
│  │  ┌─────────────────────────────────────────────────────────┐    │   │
│  │  │              OpenAI ChatKit Component                    │    │   │
│  │  │  - Renders conversation UI                               │    │   │
│  │  │  - Handles user input                                    │    │   │
│  │  │  - Displays assistant responses                          │    │   │
│  │  └─────────────────────────────────────────────────────────┘    │   │
│  │                              │                                   │   │
│  │                    [JWT Token + Message]                         │   │
│  │                              ▼                                   │   │
│  └─────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
                                  │
                                  │ POST /api/{user_id}/chat
                                  │ Authorization: Bearer <JWT>
                                  │ Body: { conversation_id?, message }
                                  ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           BACKEND (FastAPI)                             │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                     JWT Auth Middleware                          │   │
│  │  - Validate token                                                │   │
│  │  - Extract user_id from JWT                                      │   │
│  │  - Verify user_id matches path parameter                         │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                              │                                          │
│                              ▼                                          │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                   POST /api/{user_id}/chat                       │   │
│  │  1. Fetch/create conversation                                    │   │
│  │  2. Load full message history from DB                            │   │
│  │  3. Process user message (external AI handler - out of scope)    │   │
│  │  4. Store user message + assistant response                      │   │
│  │  5. Return response with conversation_id                         │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                              │                                          │
└─────────────────────────────────────────────────────────────────────────┘
                                  │
                                  │ SQLModel ORM
                                  ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      DATABASE (Neon PostgreSQL)                         │
│  ┌───────────────────────┐    ┌───────────────────────────────────┐    │
│  │     conversations     │    │            messages               │    │
│  │  - id (PK)            │◄───│  - id (PK)                        │    │
│  │  - user_id            │    │  - conversation_id (FK)           │    │
│  │  - created_at         │    │  - user_id                        │    │
│  │  - updated_at         │    │  - role (user|assistant)          │    │
│  └───────────────────────┘    │  - content                        │    │
│                               │  - created_at                     │    │
│                               └───────────────────────────────────┘    │
│  ┌───────────────────────────────────────────────────────────────┐    │
│  │                   Existing Phase II Tables                     │    │
│  │                (users, todos, sessions, etc.)                  │    │
│  └───────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Technology Additions

| Addition           | Purpose                                           |
|--------------------|---------------------------------------------------|
| OpenAI ChatKit     | Pre-built chat UI component for frontend          |

**Note**: All other technologies (Next.js, FastAPI, SQLModel, Neon PostgreSQL, Better Auth) are already in place from Phase II.

---

## Database Schema Extensions

### Conversation Model

| Field       | Type         | Constraints                          | Description                              |
|-------------|--------------|--------------------------------------|------------------------------------------|
| id          | Integer      | Primary Key, Auto-increment          | Unique conversation identifier           |
| user_id     | String       | NOT NULL, Indexed, Foreign Key       | Owner of the conversation                |
| created_at  | DateTime     | NOT NULL, Default: now()             | Conversation creation timestamp          |
| updated_at  | DateTime     | NOT NULL, Default: now(), On update  | Last activity timestamp                  |

### Message Model

| Field           | Type         | Constraints                          | Description                              |
|-----------------|--------------|--------------------------------------|------------------------------------------|
| id              | Integer      | Primary Key, Auto-increment          | Unique message identifier                |
| conversation_id | Integer      | NOT NULL, Foreign Key → conversations.id | Parent conversation                  |
| user_id         | String       | NOT NULL, Indexed                    | Message owner (denormalized for queries) |
| role            | String       | NOT NULL, ENUM: 'user', 'assistant'  | Message author type                      |
| content         | Text         | NOT NULL                             | Message text content                     |
| created_at      | DateTime     | NOT NULL, Default: now()             | Message creation timestamp               |

### Relationships

- **Conversation → Messages**: One-to-Many (conversation has many messages)
- **User → Conversations**: One-to-Many (user owns many conversations)
- **User → Messages**: One-to-Many (user owns many messages via user_id)

### Indexes

- `conversations.user_id` - Fast lookup of user's conversations
- `messages.conversation_id` - Fast message retrieval for a conversation
- `messages.user_id` - Fast user isolation queries
- `messages.created_at` - Chronological ordering

---

## Chat API Endpoint

### Endpoint Definition

| Property | Value                          |
|----------|--------------------------------|
| Method   | POST                           |
| Path     | /api/{user_id}/chat            |
| Auth     | Bearer JWT (required)          |

### Request Schema

```json
{
  "conversation_id": 123,
  "message": "Add a task to buy groceries tomorrow"
}
```

| Field           | Type    | Required | Description                                              |
|-----------------|---------|----------|----------------------------------------------------------|
| conversation_id | Integer | No       | Existing conversation ID. If omitted, creates new.       |
| message         | String  | Yes      | User's natural language input (1-4000 characters)        |

### Response Schema

```json
{
  "conversation_id": 123,
  "response": "I've added 'buy groceries' to your tasks for tomorrow.",
  "tool_calls": [
    {
      "tool": "create_todo",
      "arguments": { "title": "buy groceries", "due_date": "2026-02-10" },
      "result": "success"
    }
  ]
}
```

| Field           | Type    | Description                                              |
|-----------------|---------|----------------------------------------------------------|
| conversation_id | Integer | The conversation ID (existing or newly created)          |
| response        | String  | Assistant's text reply                                   |
| tool_calls      | Array   | Metadata about any backend actions performed (may be empty) |

### Validation Rules

1. **JWT Validation**: Token must be valid and not expired
2. **User Isolation**: `user_id` from JWT claim MUST match path parameter `{user_id}`
3. **Conversation Ownership**: If `conversation_id` provided, it must belong to the authenticated user
4. **Message Validation**: `message` field must be non-empty string, max 4000 characters

### Error Responses

| Status | Condition                                      | Response Body                                              |
|--------|------------------------------------------------|------------------------------------------------------------|
| 400    | Missing or empty message                       | `{ "error": "Message is required" }`                       |
| 400    | Message exceeds 4000 characters                | `{ "error": "Message too long (max 4000 characters)" }`    |
| 401    | Missing or invalid JWT                         | `{ "error": "Unauthorized" }`                              |
| 403    | user_id mismatch (JWT vs path)                 | `{ "error": "Forbidden: user_id mismatch" }`               |
| 404    | conversation_id not found or not owned by user | `{ "error": "Conversation not found" }`                    |
| 500    | Server/processing error                        | `{ "error": "Internal server error" }`                     |

---

## Stateless Request / Response Flow

Every incoming chat request follows this numbered sequence:

### Flow Steps

1. **Request Received**: Frontend sends POST to `/api/{user_id}/chat` with JWT token and message body

2. **JWT Validation**: Backend middleware validates Bearer token
   - Extract `user_id` claim from JWT
   - Verify token signature and expiration
   - Reject with 401 if invalid

3. **User Isolation Check**: Compare JWT `user_id` with path parameter `{user_id}`
   - Reject with 403 if mismatch

4. **Conversation Resolution**:
   - If `conversation_id` provided:
     - Fetch conversation from database
     - Verify `conversation.user_id == authenticated_user_id`
     - Reject with 404 if not found or not owned
   - If `conversation_id` NOT provided:
     - Create new conversation record with `user_id = authenticated_user_id`
     - Store and use new `conversation_id`

5. **History Reconstruction** (Stateless Key Step):
   - Query ALL messages for this conversation from database
   - Order by `created_at` ascending
   - Build complete conversation context array

6. **User Message Storage**: Insert new message record
   - `conversation_id`: resolved conversation ID
   - `user_id`: authenticated user ID
   - `role`: 'user'
   - `content`: request message

7. **AI Processing** (External - out of scope):
   - Pass full conversation history + new message to AI handler
   - Receive assistant response and any tool call metadata

8. **Assistant Message Storage**: Insert assistant response record
   - `conversation_id`: same conversation ID
   - `user_id`: authenticated user ID
   - `role`: 'assistant'
   - `content`: AI response text

9. **Update Conversation Timestamp**: Set `conversation.updated_at = now()`

10. **Response Return**: Send JSON response to frontend
    - `conversation_id`: for future requests
    - `response`: assistant text
    - `tool_calls`: action metadata array

---

## Frontend ChatKit Integration

### Route Configuration

| Property      | Value                           |
|---------------|---------------------------------|
| Path          | /chat                           |
| Protection    | Authenticated users only        |
| Layout        | App Router layout with auth     |

### Component Setup

The chat page integrates OpenAI ChatKit component with the following configuration:

1. **Authentication Integration**:
   - Use Better Auth `useSession()` hook to obtain user session
   - Extract `user_id` and JWT token from session
   - Redirect unauthenticated users to login

2. **ChatKit Configuration**:
   - Initialize ChatKit with domain key from environment
   - Configure message handler to call backend endpoint
   - Handle loading states during API calls
   - Display error messages for failed requests

3. **Message Flow**:
   - User types message in ChatKit input
   - Frontend captures message and current `conversation_id` (if any)
   - POST request sent to `/api/{user_id}/chat` with JWT Authorization header
   - Response displayed in ChatKit conversation view
   - Store `conversation_id` in component state for subsequent messages

4. **Conversation Management**:
   - New conversation: First message sent without `conversation_id`
   - Continuing conversation: Subsequent messages include returned `conversation_id`
   - Session persistence: Store `conversation_id` in localStorage or URL state

### Production Domain Allowlist

Before deploying to production, the following domains must be added to OpenAI ChatKit allowlist:

| Environment      | Domain URL                                    |
|------------------|-----------------------------------------------|
| Vercel (Primary) | https://your-app.vercel.app                   |
| Custom Domain    | https://yourdomain.com (if applicable)        |
| HuggingFace      | https://your-space.hf.space (if backend exposed) |

### Allowlist Configuration Steps

1. Log in to OpenAI platform dashboard
2. Navigate to ChatKit settings
3. Add each production domain to the allowlist
4. Copy the domain key for environment configuration

---

## Authentication & User Isolation Rules

### Authentication Requirements

| Rule                     | Description                                                |
|--------------------------|------------------------------------------------------------|
| JWT Required             | Every chat request must include valid Bearer token         |
| Token Source             | Better Auth session provides JWT                           |
| Token Validation         | Backend validates signature, expiration, and claims        |

### User Isolation Guarantees

| Guarantee                         | Enforcement                                              |
|-----------------------------------|----------------------------------------------------------|
| Path Parameter Match              | JWT `user_id` must equal `{user_id}` in path             |
| Conversation Ownership            | User can only access their own conversations             |
| Message Ownership                 | All messages include `user_id` for isolation queries     |
| No Cross-User Access              | Database queries always filter by authenticated user_id  |

### Security Invariants

1. A user can NEVER see another user's conversations
2. A user can NEVER see another user's messages
3. A user can NEVER send messages to another user's conversation
4. A user can NEVER access todos belonging to another user via chat
5. All user data isolation from Phase II remains enforced

---

## Environment Variables

### New Variables (Phase III)

| Variable                       | Location  | Description                                |
|--------------------------------|-----------|--------------------------------------------|
| NEXT_PUBLIC_OPENAI_DOMAIN_KEY  | Frontend  | ChatKit domain key for production          |

### Existing Variables (Phase II - No Changes)

- `DATABASE_URL` - Neon PostgreSQL connection string
- `JWT_SECRET` - Better Auth JWT signing key
- `BETTER_AUTH_*` - Better Auth configuration

---

## User Scenarios & Testing

### User Story 1 - Send First Chat Message (Priority: P1)

An authenticated user opens the chat page and sends their first message to start a new conversation.

**Why this priority**: Core functionality - without this, no chat interaction is possible.

**Independent Test**: Can be fully tested by logging in, navigating to /chat, typing a message, and receiving a response. Delivers immediate user value.

**Acceptance Scenarios**:

1. **Given** an authenticated user on the /chat page with no active conversation, **When** they type "Hello" and submit, **Then** a new conversation is created and they receive an assistant response.

2. **Given** an authenticated user on the /chat page, **When** they submit an empty message, **Then** an error message is displayed and no request is sent.

3. **Given** an unauthenticated visitor, **When** they navigate to /chat, **Then** they are redirected to the login page.

---

### User Story 2 - Continue Existing Conversation (Priority: P1)

An authenticated user returns to the chat page and continues a previously started conversation.

**Why this priority**: Essential for maintaining context - users expect conversations to persist.

**Independent Test**: Can be tested by sending messages, refreshing the page, and verifying conversation continues with full history.

**Acceptance Scenarios**:

1. **Given** a user with an existing conversation, **When** they send a new message with the conversation_id, **Then** the response reflects awareness of previous messages.

2. **Given** a user with conversation history, **When** they refresh the page and continue chatting, **Then** the conversation_id is preserved and history is loaded.

---

### User Story 3 - Resume After Server Restart (Priority: P2)

Conversation state survives server restarts because all state is persisted in the database.

**Why this priority**: Critical for reliability but depends on P1 functionality working first.

**Independent Test**: Can be tested by having an active conversation, simulating server restart, and verifying conversation resumes correctly.

**Acceptance Scenarios**:

1. **Given** a user mid-conversation, **When** the backend server restarts, **Then** the user can continue the conversation with full history intact.

2. **Given** conversation messages stored in the database, **When** a request arrives after restart, **Then** all messages are retrieved and context is reconstructed.

---

### User Story 4 - User Data Isolation (Priority: P1)

Users can only access their own conversations and cannot see other users' data.

**Why this priority**: Security is non-negotiable - must be enforced from the start.

**Independent Test**: Can be tested by attempting to access another user's conversation_id and verifying rejection.

**Acceptance Scenarios**:

1. **Given** User A's conversation_id, **When** User B attempts to send a message to that conversation, **Then** a 403 or 404 error is returned.

2. **Given** a chat request with mismatched user_id in path vs JWT, **When** processed, **Then** request is rejected with 403.

---

### Edge Cases

- What happens when user sends message exceeding 4000 characters? → Rejected with 400 error
- What happens when database connection fails during message save? → 500 error returned, message not lost (frontend can retry)
- What happens when user's session expires mid-conversation? → 401 returned, frontend redirects to login
- What happens when conversation_id doesn't exist? → 404 error returned
- What happens when multiple rapid messages are sent? → Each processed independently (stateless), order preserved by timestamps

---

## Requirements

### Functional Requirements

- **FR-001**: System MUST expose POST /api/{user_id}/chat endpoint accepting message and optional conversation_id
- **FR-002**: System MUST create new conversation when conversation_id is not provided
- **FR-003**: System MUST fetch complete message history from database on every request (stateless)
- **FR-004**: System MUST persist both user and assistant messages to the database
- **FR-005**: System MUST validate JWT token on every chat request
- **FR-006**: System MUST verify user_id from JWT matches path parameter
- **FR-007**: System MUST verify conversation ownership before allowing access
- **FR-008**: System MUST return conversation_id in every response
- **FR-009**: System MUST return assistant text response and tool_calls metadata
- **FR-010**: System MUST update conversation.updated_at timestamp on each message
- **FR-011**: Frontend MUST provide protected /chat route accessible only to authenticated users
- **FR-012**: Frontend MUST integrate OpenAI ChatKit component for chat UI
- **FR-013**: Frontend MUST pass JWT token in Authorization header for all chat requests
- **FR-014**: Frontend MUST handle and display error states appropriately
- **FR-015**: Frontend MUST preserve conversation_id for message continuity

### Key Entities

- **Conversation**: Represents a chat session between a user and the assistant; contains metadata and links to messages
- **Message**: Individual message within a conversation; can be from user or assistant; ordered chronologically

---

## Success Criteria

### Measurable Outcomes

- **SC-001**: Users can send a chat message and receive a response within 5 seconds under normal load
- **SC-002**: Conversation history persists across page refreshes and browser sessions
- **SC-003**: Conversations resume correctly after server restarts with no data loss
- **SC-004**: 100% of cross-user access attempts are blocked (user isolation verified)
- **SC-005**: Chat UI loads and becomes interactive within 3 seconds on standard connections
- **SC-006**: Users can maintain conversations with 50+ messages without degradation
- **SC-007**: Authentication failures result in clear error messages and appropriate redirects

---

## Assumptions

1. Phase II implementation is complete with working Better Auth JWT authentication
2. Existing Neon PostgreSQL database schema can be extended with new tables
3. OpenAI ChatKit is available and compatible with Next.js 16+ App Router
4. Users will have a single active conversation at a time (multiple conversations future scope)
5. Message content is plain text (no file attachments or rich media in this phase)
6. The AI processing handler will be implemented separately and injected as a dependency

---

## Deliverables

### Backend Files (FastAPI)

| Path                                    | Description                                    |
|-----------------------------------------|------------------------------------------------|
| backend/app/models/conversation.py      | Conversation SQLModel                          |
| backend/app/models/message.py           | Message SQLModel                               |
| backend/app/routers/chat.py             | Chat endpoint router                           |
| backend/app/schemas/chat.py             | Request/response Pydantic schemas              |
| backend/alembic/versions/xxx_chat.py    | Database migration for new tables              |

### Frontend Files (Next.js)

| Path                                    | Description                                    |
|-----------------------------------------|------------------------------------------------|
| frontend/app/chat/page.tsx              | Chat page component                            |
| frontend/app/chat/layout.tsx            | Chat layout with auth protection               |
| frontend/components/chat/ChatKit.tsx    | ChatKit wrapper component                      |
| frontend/lib/chat-client.ts             | API client for chat endpoint                   |

### Configuration Updates

| File                    | Changes                                          |
|-------------------------|--------------------------------------------------|
| frontend/.env.local     | Add NEXT_PUBLIC_OPENAI_DOMAIN_KEY                |
| frontend/.env.example   | Document new environment variable                |
| README.md               | Add Phase III setup instructions                 |

### Documentation Updates

- README.md: Add chat feature description and setup steps
- API documentation: Document /api/{user_id}/chat endpoint
- Environment setup: Document ChatKit domain allowlist process

---

"Phase III Chatbot integration specification complete. Ready for /sp.plan to create detailed implementation architecture for the chat endpoint, database extensions and frontend ChatKit wiring."
