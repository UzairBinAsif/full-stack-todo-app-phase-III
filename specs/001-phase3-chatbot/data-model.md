# Data Model: Phase III - AI Chatbot Integration

**Feature**: 001-phase3-chatbot
**Date**: 2026-02-09

---

## Entity Relationship Diagram

```
┌─────────────────────┐         ┌────────────────────────────┐
│    Conversation     │         │         Message            │
├─────────────────────┤         ├────────────────────────────┤
│ id: int (PK)        │◄────────│ id: int (PK)               │
│ user_id: str (IDX)  │    1:N  │ conversation_id: int (FK)  │
│ created_at: datetime│         │ user_id: str (IDX)         │
│ updated_at: datetime│         │ role: MessageRole (ENUM)   │
└─────────────────────┘         │ content: str               │
                                │ created_at: datetime (IDX) │
                                └────────────────────────────┘
```

---

## Entities

### Conversation

Represents a chat session between a user and the AI assistant.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | Integer | PRIMARY KEY, AUTO INCREMENT | Unique conversation identifier |
| user_id | String | NOT NULL, INDEXED | Owner of the conversation (FK to users) |
| created_at | DateTime | NOT NULL, DEFAULT now() | When conversation was created |
| updated_at | DateTime | NOT NULL, DEFAULT now() | Last activity timestamp |

**Relationships**:
- Has many `Message` records (one-to-many)

**Indexes**:
- `user_id` - Fast lookup of user's conversations

### Message

Represents an individual message within a conversation.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | Integer | PRIMARY KEY, AUTO INCREMENT | Unique message identifier |
| conversation_id | Integer | NOT NULL, FK → conversations.id, INDEXED | Parent conversation |
| user_id | String | NOT NULL, INDEXED | Message owner (denormalized) |
| role | MessageRole | NOT NULL, ENUM('user', 'assistant') | Who sent the message |
| content | String | NOT NULL | Message text content |
| created_at | DateTime | NOT NULL, DEFAULT now(), INDEXED | When message was sent |

**Relationships**:
- Belongs to one `Conversation` record (many-to-one)

**Indexes**:
- `conversation_id` - Efficient message retrieval per conversation
- `user_id` - User isolation enforcement
- `created_at` - Chronological ordering

### MessageRole (Enum)

| Value | Description |
|-------|-------------|
| user | Message from the human user |
| assistant | Message from the AI assistant |

---

## SQLModel Definitions

```python
from enum import Enum
from typing import Optional, List
from sqlmodel import SQLModel, Field, Relationship
from datetime import datetime, timezone


class MessageRole(str, Enum):
    """Enum for message roles."""
    USER = "user"
    ASSISTANT = "assistant"


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

    # Relationship
    messages: List["Message"] = Relationship(back_populates="conversation")


class Message(SQLModel, table=True):
    """Message model for individual chat messages."""

    __tablename__ = "messages"

    id: Optional[int] = Field(default=None, primary_key=True)
    conversation_id: int = Field(
        foreign_key="conversations.id",
        index=True,
        nullable=False
    )
    user_id: str = Field(index=True, nullable=False)
    role: MessageRole = Field(nullable=False)
    content: str = Field(nullable=False)
    created_at: Optional[datetime] = Field(
        default_factory=lambda: datetime.now(timezone.utc).replace(tzinfo=None),
        index=True
    )

    # Relationship
    conversation: Optional[Conversation] = Relationship(back_populates="messages")
```

---

## Validation Rules

### Conversation

| Rule | Enforcement |
|------|-------------|
| user_id required | SQLModel `nullable=False` |
| user_id must exist | Application-level (JWT validation) |

### Message

| Rule | Enforcement |
|------|-------------|
| conversation_id required | SQLModel `nullable=False` |
| conversation must exist | Foreign key constraint |
| user_id required | SQLModel `nullable=False` |
| role must be valid enum | SQLModel `MessageRole` type |
| content required | SQLModel `nullable=False` |
| content max 4000 chars | Pydantic schema validation |
| content not empty | Pydantic field validator |

---

## Query Patterns

### Get user's conversations

```python
select(Conversation).where(Conversation.user_id == current_user)
```

### Get messages for conversation

```python
select(Message).where(
    Message.conversation_id == conversation_id
).order_by(Message.created_at.asc())
```

### Verify conversation ownership

```python
select(Conversation).where(
    Conversation.id == conversation_id,
    Conversation.user_id == current_user
)
```

---

## Migration Strategy

Tables are auto-created via SQLModel's `create_db_tables()` function on application startup. No manual migration required for initial deployment.

```python
# database.py - existing function handles new models
async def create_db_tables():
    async with async_engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)
```
