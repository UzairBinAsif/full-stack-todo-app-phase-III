# Data Model: Backend API for Todo Application

**Feature**: 002-backend-api-spec
**Date**: 2026-02-07

---

## Entity Relationship Diagram

```
┌─────────────────────────────────────────────┐
│                   users                      │
│  (Managed by Better Auth - READ ONLY)       │
├─────────────────────────────────────────────┤
│  id          : VARCHAR(255)  [PK]           │
│  email       : VARCHAR(255)  [UNIQUE]       │
│  name        : VARCHAR(255)  [NULLABLE]     │
│  created_at  : TIMESTAMP                    │
│  updated_at  : TIMESTAMP                    │
│  ... (other Better Auth fields)             │
└─────────────────────────────────────────────┘
                     │
                     │ 1:N (one user, many tasks)
                     │
                     ▼
┌─────────────────────────────────────────────┐
│                   tasks                      │
│  (Managed by Backend API)                   │
├─────────────────────────────────────────────┤
│  id          : INTEGER       [PK, AUTO]     │
│  user_id     : VARCHAR(255)  [FK → users]   │
│  title       : VARCHAR(200)  [NOT NULL]     │
│  description : TEXT          [NULLABLE]     │
│  completed   : BOOLEAN       [DEFAULT FALSE]│
│  created_at  : TIMESTAMP     [AUTO]         │
│  updated_at  : TIMESTAMP     [AUTO UPDATE]  │
├─────────────────────────────────────────────┤
│  INDEXES:                                   │
│  - idx_tasks_user_id     (user_id)          │
│  - idx_tasks_completed   (completed)        │
└─────────────────────────────────────────────┘
```

---

## Entity: Task

### Field Specifications

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | INTEGER | PRIMARY KEY, AUTO_INCREMENT | Unique task identifier |
| `user_id` | VARCHAR(255) | NOT NULL, FOREIGN KEY | Owner reference (from JWT) |
| `title` | VARCHAR(200) | NOT NULL, MIN 1 char | Task title text |
| `description` | TEXT | NULLABLE | Optional detailed description |
| `completed` | BOOLEAN | NOT NULL, DEFAULT FALSE | Completion status |
| `created_at` | TIMESTAMP | NOT NULL, AUTO | Creation timestamp (UTC) |
| `updated_at` | TIMESTAMP | NOT NULL, AUTO UPDATE | Last modification (UTC) |

### Validation Rules

| Field | Rule | Error Message |
|-------|------|---------------|
| `title` | Length 1-200 chars | "Title must be between 1 and 200 characters" |
| `title` | Not empty/whitespace | "Title is required" |
| `user_id` | Must match JWT sub | "Access denied" (403) |
| `completed` | Boolean only | "Invalid completion status" |

### State Transitions

```
┌─────────────┐      toggle_complete()      ┌─────────────┐
│  PENDING    │ ◄──────────────────────────► │  COMPLETED  │
│ (completed  │                              │ (completed  │
│  = false)   │                              │  = true)    │
└─────────────┘                              └─────────────┘
       │                                            │
       │              delete()                      │
       └────────────────┬───────────────────────────┘
                        │
                        ▼
                 ┌─────────────┐
                 │   DELETED   │
                 │ (hard delete│
                 │  from DB)   │
                 └─────────────┘
```

---

## SQLModel Definition

```python
from sqlmodel import SQLModel, Field
from datetime import datetime, timezone
from typing import Optional


class Task(SQLModel, table=True):
    """Task database model with user ownership."""

    __tablename__ = "tasks"

    # Primary key
    id: Optional[int] = Field(
        default=None,
        primary_key=True,
        description="Unique task identifier"
    )

    # Foreign key to users (managed by Better Auth)
    user_id: str = Field(
        index=True,
        nullable=False,
        description="Owner user ID from JWT sub claim"
    )

    # Task content
    title: str = Field(
        max_length=200,
        nullable=False,
        description="Task title (1-200 characters)"
    )

    description: Optional[str] = Field(
        default=None,
        description="Optional task description"
    )

    # Status
    completed: bool = Field(
        default=False,
        index=True,
        description="Task completion status"
    )

    # Timestamps
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        description="Creation timestamp (UTC)"
    )

    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        description="Last update timestamp (UTC)"
    )
```

---

## Database Indexes

| Index Name | Columns | Purpose |
|------------|---------|---------|
| `pk_tasks` | `id` | Primary key lookup |
| `idx_tasks_user_id` | `user_id` | Fast user ownership filtering |
| `idx_tasks_completed` | `completed` | Fast status filtering |

### Query Patterns Supported

1. **List user's tasks**: `WHERE user_id = ?` (uses idx_tasks_user_id)
2. **Filter by status**: `WHERE user_id = ? AND completed = ?` (composite)
3. **Get single task**: `WHERE id = ? AND user_id = ?` (pk + idx)

---

## Pydantic Schemas Mapping

| Operation | Schema | Task Fields |
|-----------|--------|-------------|
| Create | `CreateTask` | title (required), description (optional) |
| Update | `UpdateTask` | title?, description?, completed? |
| Response | `TaskResponse` | All fields |
| List | `List[TaskResponse]` | All fields per task |

---

## Data Integrity Constraints

1. **User isolation**: Every query MUST include `WHERE user_id = ?`
2. **Timestamp consistency**: `updated_at` auto-updates on any modification
3. **Foreign key**: `user_id` references `users.id` (enforced at app level, users managed externally)
4. **Title validation**: Enforced by Pydantic before database insert
