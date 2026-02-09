# Research: Phase III - AI Chatbot Integration

**Feature**: 001-phase3-chatbot
**Date**: 2026-02-09

---

## Research Topics

### 1. OpenAI ChatKit Integration Patterns

**Decision**: Use custom ChatContainer component wrapping native UI elements

**Rationale**:
- OpenAI ChatKit provides pre-built UI components for chat interfaces
- However, for this implementation, we'll use a custom chat UI that matches the existing design system (shadcn/ui + Tailwind)
- This allows full control over styling, state management, and API integration
- OpenAI ChatKit domain allowlist still required if using OpenAI-hosted components

**Alternatives Considered**:
- Direct OpenAI ChatKit embed: Rejected due to styling constraints
- Third-party chat libraries (e.g., react-chat): Rejected due to unnecessary dependencies

### 2. Stateless Conversation Architecture

**Decision**: Rebuild full conversation history from DB on every request

**Rationale**:
- Server maintains zero in-memory state
- Every request queries ALL messages for the conversation
- Ensures resumability after server restarts
- Follows hackathon specification requirements exactly

**Alternatives Considered**:
- In-memory cache with DB persistence: Rejected (violates stateless requirement)
- Redis session store: Rejected (unnecessary complexity, violates stateless server principle)

### 3. SQLModel Relationship Pattern

**Decision**: Use SQLModel Relationship for Conversation ↔ Message

**Rationale**:
- SQLModel supports SQLAlchemy-style relationships
- Enables eager loading of messages when needed
- Maintains consistency with existing Task model patterns
- back_populates provides bidirectional navigation

**Alternatives Considered**:
- Manual foreign key queries only: Viable but less Pythonic
- Separate repositories: Rejected (over-engineering for this scope)

### 4. Better Auth Session Token vs JWT

**Decision**: Support both session tokens AND JWT tokens (existing pattern)

**Rationale**:
- Better Auth issues session tokens (opaque strings without dots)
- JWT tokens have dots (header.payload.signature)
- Existing `get_current_user` dependency already handles both
- No changes needed to authentication layer

**Alternatives Considered**:
- JWT-only: Would break existing Better Auth integration
- Session-only: Would break any existing JWT clients

### 5. Frontend State Management for Chat

**Decision**: Local component state + localStorage for conversation_id persistence

**Rationale**:
- Chat state is component-local (messages array, input)
- conversation_id persisted to localStorage for page refresh survival
- No need for TanStack Query (chat is not cacheable/deduplicatable)
- Keeps implementation simple and self-contained

**Alternatives Considered**:
- TanStack Query: Rejected (chat responses aren't cacheable)
- Zustand/Redux: Rejected (over-engineering for single component)
- URL state: Viable alternative but localStorage simpler

### 6. Message Validation Strategy

**Decision**: 4000 character limit with whitespace trimming

**Rationale**:
- Matches specification requirement
- Prevents empty/whitespace-only messages
- Pydantic validation at API boundary
- Frontend validation as UX enhancement only

**Alternatives Considered**:
- No limit: Rejected (could cause DB/memory issues)
- Shorter limit (1000 chars): Rejected (too restrictive for natural language)

---

## Dependencies Verified

| Dependency | Status | Notes |
|------------|--------|-------|
| SQLModel relationships | ✅ Supported | Use `Relationship` with `back_populates` |
| Async session with SQLModel | ✅ Working | Existing pattern in database.py |
| Better Auth session verification | ✅ Working | Existing pattern in auth/session.py |
| Pydantic field validators | ✅ Supported | Use `@field_validator` decorator |

---

## No Open Questions

All technical decisions resolved. Ready for implementation.
