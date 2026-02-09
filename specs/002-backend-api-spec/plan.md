# Implementation Plan: Backend API for Todo Application

**Branch**: `002-backend-api-spec` | **Date**: 2026-02-07 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-backend-api-spec/spec.md`

---

## Summary

Build a secure, production-ready FastAPI backend providing task management REST API with strict user isolation. The backend verifies JWT tokens issued by the frontend (Better Auth), enforces per-user data access through dependency injection, and persists tasks to Neon Serverless PostgreSQL via SQLModel ORM.

---

## 1. Overall Architecture Overview

### High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              FastAPI Application                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────┐      ┌─────────────────────────────────────────────────┐  │
│  │   main.py   │──────│  CORS Middleware + Exception Handlers           │  │
│  │  (FastAPI)  │      └─────────────────────────────────────────────────┘  │
│  └──────┬──────┘                                                            │
│         │                                                                   │
│         ▼                                                                   │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    routes/tasks.py (APIRouter)                       │   │
│  │  GET/POST/PUT/DELETE/PATCH  →  /api/{user_id}/tasks[/{task_id}]     │   │
│  └──────────────────────────────┬──────────────────────────────────────┘   │
│                                 │                                           │
│              ┌──────────────────┼──────────────────┐                       │
│              │                  │                  │                       │
│              ▼                  ▼                  ▼                       │
│  ┌───────────────────┐ ┌───────────────┐ ┌─────────────────────┐          │
│  │ auth/dependencies │ │ schemas/*.py  │ │   core/config.py    │          │
│  │ get_current_user  │ │ CreateTask    │ │   Settings class    │          │
│  │ verify_ownership  │ │ UpdateTask    │ │   (env variables)   │          │
│  └─────────┬─────────┘ │ TaskResponse  │ └─────────────────────┘          │
│            │           └───────────────┘                                   │
│            ▼                                                               │
│  ┌───────────────────┐                                                     │
│  │   auth/jwt.py     │                                                     │
│  │  decode_token()   │◄─── BETTER_AUTH_SECRET (env)                       │
│  │  verify_token()   │                                                     │
│  └───────────────────┘                                                     │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                         models.py (SQLModel)                         │   │
│  │                              Task                                    │   │
│  └──────────────────────────────┬──────────────────────────────────────┘   │
│                                 │                                           │
│                                 ▼                                           │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                        database.py                                   │   │
│  │            get_async_session()  →  AsyncSession                      │   │
│  │            async_engine  →  create_async_engine(DATABASE_URL)        │   │
│  └──────────────────────────────┬──────────────────────────────────────┘   │
│                                 │                                           │
└─────────────────────────────────┼───────────────────────────────────────────┘
                                  │
                                  ▼
                    ┌─────────────────────────┐
                    │  Neon PostgreSQL        │
                    │  (Serverless)           │
                    │  ├── users (Better Auth)│
                    │  └── tasks              │
                    └─────────────────────────┘
```

### Dependency Injection Flow

```
Request with Bearer Token
         │
         ▼
┌─────────────────────────┐
│ HTTPBearer() extracts   │
│ token from header       │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐     ┌─────────────────────┐
│ get_current_user()      │────►│ auth/jwt.py         │
│ - Calls decode_token()  │     │ - PyJWT decode      │
│ - Extracts user_id      │     │ - Verify signature  │
│ - Returns user_id       │     │ - Check expiration  │
└───────────┬─────────────┘     └─────────────────────┘
            │                            │
            │                   401 if invalid/expired
            ▼
┌─────────────────────────┐
│ verify_user_ownership() │
│ - Compare path user_id  │
│ - With token user_id    │
│ - 403 if mismatch       │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│ Route Handler           │
│ - user_id injected      │
│ - All queries filter    │
│   WHERE user_id = ?     │
└─────────────────────────┘
```

### Why This Structure

| Principle | Implementation | Benefit |
|-----------|---------------|---------|
| **Separation of Concerns** | auth/, routes/, schemas/, core/ directories | Each module has single responsibility |
| **Testability** | Dependencies injectable via FastAPI Depends() | Mock auth/db for unit tests |
| **Security by Default** | Auth dependency on all routes | Cannot accidentally expose unprotected endpoint |
| **Type Safety** | SQLModel + Pydantic v2 | Compile-time catches, auto-validation |
| **Async First** | AsyncSession, async def handlers | High concurrency without blocking |

---

## 2. Technical Context

**Language/Version**: Python 3.11+
**Primary Dependencies**: FastAPI 0.115+, SQLModel 0.0.22+, PyJWT 2.9+, Pydantic 2.9+
**Storage**: Neon Serverless PostgreSQL via asyncpg
**Testing**: pytest + pytest-asyncio + httpx (TestClient)
**Target Platform**: Linux server (Docker), local dev on Windows/macOS
**Project Type**: Web backend API
**Performance Goals**: <500ms p95 latency, 100 concurrent users
**Constraints**: Strict user isolation, JWT-only auth, no session state
**Scale/Scope**: Single-tenant tasks, ~1000 tasks per user max

---

## 3. Constitution Check

*GATE: Must pass before implementation. Re-check after Phase 1 design.*

| Constitution Principle | Requirement | This Plan | Status |
|------------------------|-------------|-----------|--------|
| **I. Technology Stack** | Python FastAPI, SQLModel, Pydantic | FastAPI + SQLModel + Pydantic v2 | ✅ PASS |
| **I. Database** | Neon PostgreSQL via DATABASE_URL | asyncpg + Neon connection | ✅ PASS |
| **I. Authentication** | JWT verified with BETTER_AUTH_SECRET | PyJWT decode with shared secret | ✅ PASS |
| **II. IDOR Prevention** | Every query filters by user_id | Dependency injection enforces ownership | ✅ PASS |
| **II. JWT Enforcement** | Every API operation decodes JWT | get_current_user dependency on all routes | ✅ PASS |
| **II. Input Validation** | All inputs validated | Pydantic schemas with constraints | ✅ PASS |
| **III. API Design** | Exact endpoint pattern /api/{user_id}/tasks | Implemented as specified | ✅ PASS |
| **IV. Database Schema** | Exact fields: id, user_id, title, description, completed, timestamps | SQLModel Task matches exactly | ✅ PASS |
| **V. Code Quality** | Type hints, no debug code | Strict typing, logging not print | ✅ PASS |
| **VI. Scope** | Task CRUD only | No extra features implemented | ✅ PASS |

**Gate Result**: ✅ ALL PASSED - Proceed to implementation

---

## 4. Project Structure

### Documentation (this feature)

```text
specs/002-backend-api-spec/
├── spec.md              # Feature specification (complete)
├── plan.md              # This implementation plan
├── research.md          # Phase 0 research (technologies)
├── data-model.md        # Phase 1 data model
├── quickstart.md        # Developer quickstart guide
├── contracts/           # API contracts (OpenAPI)
│   └── openapi.yaml
├── checklists/          # Quality checklists
│   └── requirements.md
└── tasks.md             # Phase 2 task breakdown (by /sp.tasks)
```

### Source Code (repository root)

```text
backend/
├── main.py                 # FastAPI application entry point
├── database.py             # Async engine, session factory, get_db
├── models.py               # SQLModel Task model
├── requirements.txt        # Python dependencies
├── .env.example            # Environment template
├── Dockerfile              # Container build
├── CLAUDE.md               # Backend development guidelines
│
├── auth/
│   ├── __init__.py
│   ├── jwt.py              # JWT decode/verify functions
│   └── dependencies.py     # get_current_user, verify_ownership
│
├── schemas/
│   ├── __init__.py
│   └── task.py             # CreateTask, UpdateTask, TaskResponse
│
├── routes/
│   ├── __init__.py
│   └── tasks.py            # Task CRUD endpoints
│
├── core/
│   ├── __init__.py
│   └── config.py           # Settings with pydantic-settings
│
└── tests/
    ├── __init__.py
    ├── conftest.py         # Fixtures (test client, mock auth)
    ├── test_auth.py        # JWT verification tests
    ├── test_tasks.py       # Task CRUD tests
    └── test_ownership.py   # User isolation tests
```

**Structure Decision**: Web application pattern with separated backend/ directory. Frontend exists in /frontend (Next.js, already implemented). This backend is a standalone Python service.

---

## 5. Project Setup & Dependencies

### Requirements File (backend/requirements.txt)

```text
# Core Framework
fastapi>=0.115.0
uvicorn[standard]>=0.32.0

# Database
sqlmodel>=0.0.22
asyncpg>=0.30.0
greenlet>=3.1.0

# Authentication
pyjwt>=2.9.0

# Configuration
pydantic-settings>=2.6.0
python-dotenv>=1.0.0

# Development
httpx>=0.28.0
pytest>=8.3.0
pytest-asyncio>=0.24.0
```

### Installation Commands

```bash
# Create and activate virtual environment
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Or with pip directly:
pip install fastapi uvicorn[standard] sqlmodel asyncpg pyjwt pydantic-settings python-dotenv
pip install --dev httpx pytest pytest-asyncio
```

### Environment Variables (backend/.env)

```bash
# Database (Neon PostgreSQL - same as frontend)
DATABASE_URL=postgresql+asyncpg://user:pass@host/dbname?sslmode=require

# Authentication (MUST match frontend BETTER_AUTH_SECRET)
BETTER_AUTH_SECRET=your-shared-secret-from-frontend

# Application
ENVIRONMENT=development
API_HOST=0.0.0.0
API_PORT=8000

# CORS (frontend URLs)
CORS_ORIGINS=http://localhost:3000,http://localhost:3001
```

---

## 6. Database & SQLModel Setup

### database.py

```python
from sqlmodel import SQLModel
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
from typing import AsyncGenerator

from core.config import settings

# Async engine for Neon PostgreSQL
async_engine = create_async_engine(
    settings.DATABASE_URL,
    echo=settings.ENVIRONMENT == "development",
    pool_pre_ping=True,
    pool_size=5,
    max_overflow=10,
)

# Async session factory
async_session_maker = sessionmaker(
    async_engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Dependency: yield async database session."""
    async with async_session_maker() as session:
        try:
            yield session
        finally:
            await session.close()


async def create_db_tables():
    """Create all tables on startup (development only)."""
    async with async_engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)
```

### models.py (Task SQLModel)

```python
from sqlmodel import SQLModel, Field
from datetime import datetime, timezone
from typing import Optional


class Task(SQLModel, table=True):
    """Task database model with user ownership."""

    __tablename__ = "tasks"

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: str = Field(index=True, nullable=False)
    title: str = Field(max_length=200, nullable=False)
    description: Optional[str] = Field(default=None)
    completed: bool = Field(default=False, index=True)
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc)
    )
    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        sa_column_kwargs={"onupdate": lambda: datetime.now(timezone.utc)}
    )
```

### Index Strategy

| Column | Index Type | Purpose |
|--------|-----------|---------|
| `user_id` | B-tree | Fast filtering by owner (every query) |
| `completed` | B-tree | Fast status filtering |
| `(user_id, completed)` | Composite (optional) | Optimized status queries per user |

---

## 7. Authentication & Security Layer (Critical)

### core/config.py

```python
from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    """Application settings from environment variables."""

    # Database
    DATABASE_URL: str

    # Authentication
    BETTER_AUTH_SECRET: str
    JWT_ALGORITHM: str = "HS256"

    # Application
    ENVIRONMENT: str = "development"
    API_HOST: str = "0.0.0.0"
    API_PORT: int = 8000

    # CORS
    CORS_ORIGINS: str = "http://localhost:3000"

    @property
    def cors_origins_list(self) -> List[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",")]

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
```

### auth/jwt.py

```python
import jwt
from datetime import datetime, timezone
from typing import Any, Dict

from core.config import settings


class JWTError(Exception):
    """Base JWT error."""
    pass


class TokenExpiredError(JWTError):
    """Token has expired."""
    pass


class InvalidTokenError(JWTError):
    """Token is invalid or malformed."""
    pass


def decode_token(token: str) -> Dict[str, Any]:
    """
    Decode and verify JWT token.

    Args:
        token: JWT token string (without 'Bearer ' prefix)

    Returns:
        Decoded payload dictionary

    Raises:
        TokenExpiredError: If token has expired
        InvalidTokenError: If token is invalid
    """
    try:
        payload = jwt.decode(
            token,
            settings.BETTER_AUTH_SECRET,
            algorithms=[settings.JWT_ALGORITHM],
            options={"require": ["exp", "sub"]}
        )
        return payload
    except jwt.ExpiredSignatureError:
        raise TokenExpiredError("Token has expired")
    except jwt.InvalidTokenError as e:
        raise InvalidTokenError(f"Invalid token: {str(e)}")


def get_user_id_from_token(token: str) -> str:
    """
    Extract user_id from JWT token.

    Better Auth stores user ID in 'sub' claim.

    Args:
        token: JWT token string

    Returns:
        User ID string

    Raises:
        InvalidTokenError: If user_id not found in token
    """
    payload = decode_token(token)
    user_id = payload.get("sub")
    if not user_id:
        raise InvalidTokenError("Token missing user identifier")
    return user_id
```

### auth/dependencies.py

```python
from typing import Annotated
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from auth.jwt import (
    get_user_id_from_token,
    TokenExpiredError,
    InvalidTokenError,
)

# Security scheme for Swagger UI
security = HTTPBearer(
    scheme_name="JWT",
    description="Enter your JWT token from Better Auth"
)


async def get_current_user(
    credentials: Annotated[
        HTTPAuthorizationCredentials,
        Depends(security)
    ]
) -> str:
    """
    Dependency: Extract and validate user_id from JWT token.

    Returns:
        User ID from token 'sub' claim

    Raises:
        HTTPException 401: If token missing, expired, or invalid
    """
    try:
        token = credentials.credentials
        user_id = get_user_id_from_token(token)
        return user_id
    except TokenExpiredError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except InvalidTokenError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e),
            headers={"WWW-Authenticate": "Bearer"},
        )


def verify_user_ownership(
    path_user_id: str,
    current_user_id: str,
) -> None:
    """
    Verify that path user_id matches authenticated user.

    Args:
        path_user_id: User ID from URL path
        current_user_id: User ID from JWT token

    Raises:
        HTTPException 403: If user_ids don't match
    """
    if path_user_id != current_user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: Cannot access other user's resources",
        )


# Type alias for cleaner route signatures
CurrentUser = Annotated[str, Depends(get_current_user)]
```

---

## 8. Pydantic Schemas

### schemas/task.py

```python
from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime
from typing import Optional
from enum import Enum


class TaskStatus(str, Enum):
    """Task filter status options."""
    ALL = "all"
    PENDING = "pending"
    COMPLETED = "completed"


class TaskSort(str, Enum):
    """Task sort options."""
    CREATED = "created"
    TITLE = "title"


class CreateTask(BaseModel):
    """Schema for creating a new task."""

    title: str = Field(
        min_length=1,
        max_length=200,
        description="Task title (required, 1-200 characters)"
    )
    description: Optional[str] = Field(
        default=None,
        description="Optional task description"
    )

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "title": "Buy groceries",
                "description": "Milk, eggs, bread"
            }
        }
    )


class UpdateTask(BaseModel):
    """Schema for updating an existing task."""

    title: Optional[str] = Field(
        default=None,
        min_length=1,
        max_length=200,
        description="New title (1-200 characters)"
    )
    description: Optional[str] = Field(
        default=None,
        description="New description"
    )
    completed: Optional[bool] = Field(
        default=None,
        description="Completion status"
    )

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "title": "Buy groceries (updated)",
                "completed": True
            }
        }
    )


class TaskResponse(BaseModel):
    """Schema for task response."""

    id: int
    user_id: str
    title: str
    description: Optional[str]
    completed: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(
        from_attributes=True,
        json_schema_extra={
            "example": {
                "id": 1,
                "user_id": "user_abc123",
                "title": "Buy groceries",
                "description": "Milk, eggs, bread",
                "completed": False,
                "created_at": "2026-02-07T12:00:00Z",
                "updated_at": "2026-02-07T12:00:00Z"
            }
        }
    )
```

---

## 9. API Routes Structure

### routes/tasks.py

```python
from typing import Annotated, List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select
from datetime import datetime, timezone

from database import get_db
from models import Task
from schemas.task import (
    CreateTask,
    UpdateTask,
    TaskResponse,
    TaskStatus,
    TaskSort,
)
from auth.dependencies import CurrentUser, verify_user_ownership

router = APIRouter(prefix="/api", tags=["tasks"])


@router.get(
    "/{user_id}/tasks",
    response_model=List[TaskResponse],
    summary="List user's tasks",
)
async def list_tasks(
    user_id: str,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
    status: TaskStatus = Query(default=TaskStatus.ALL),
    sort: TaskSort = Query(default=TaskSort.CREATED),
):
    """Get all tasks for authenticated user with optional filtering."""
    verify_user_ownership(user_id, current_user)

    query = select(Task).where(Task.user_id == current_user)

    # Apply status filter
    if status == TaskStatus.COMPLETED:
        query = query.where(Task.completed == True)
    elif status == TaskStatus.PENDING:
        query = query.where(Task.completed == False)

    # Apply sorting
    if sort == TaskSort.TITLE:
        query = query.order_by(Task.title)
    else:
        query = query.order_by(Task.created_at.desc())

    result = await db.execute(query)
    return result.scalars().all()


@router.post(
    "/{user_id}/tasks",
    response_model=TaskResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create new task",
)
async def create_task(
    user_id: str,
    task_data: CreateTask,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Create a new task for authenticated user."""
    verify_user_ownership(user_id, current_user)

    task = Task(
        user_id=current_user,
        title=task_data.title,
        description=task_data.description,
    )

    db.add(task)
    await db.commit()
    await db.refresh(task)

    return task


@router.get(
    "/{user_id}/tasks/{task_id}",
    response_model=TaskResponse,
    summary="Get single task",
)
async def get_task(
    user_id: str,
    task_id: int,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Get a specific task by ID."""
    verify_user_ownership(user_id, current_user)

    query = select(Task).where(
        Task.id == task_id,
        Task.user_id == current_user,
    )
    result = await db.execute(query)
    task = result.scalar_one_or_none()

    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Task {task_id} not found",
        )

    return task


@router.put(
    "/{user_id}/tasks/{task_id}",
    response_model=TaskResponse,
    summary="Update task",
)
async def update_task(
    user_id: str,
    task_id: int,
    task_data: UpdateTask,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Update an existing task."""
    verify_user_ownership(user_id, current_user)

    query = select(Task).where(
        Task.id == task_id,
        Task.user_id == current_user,
    )
    result = await db.execute(query)
    task = result.scalar_one_or_none()

    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Task {task_id} not found",
        )

    # Update only provided fields
    update_data = task_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(task, field, value)

    task.updated_at = datetime.now(timezone.utc)

    await db.commit()
    await db.refresh(task)

    return task


@router.delete(
    "/{user_id}/tasks/{task_id}",
    status_code=status.HTTP_200_OK,
    summary="Delete task",
)
async def delete_task(
    user_id: str,
    task_id: int,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Delete a task permanently."""
    verify_user_ownership(user_id, current_user)

    query = select(Task).where(
        Task.id == task_id,
        Task.user_id == current_user,
    )
    result = await db.execute(query)
    task = result.scalar_one_or_none()

    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Task {task_id} not found",
        )

    await db.delete(task)
    await db.commit()

    return {"message": "Task deleted successfully"}


@router.patch(
    "/{user_id}/tasks/{task_id}/complete",
    response_model=TaskResponse,
    summary="Toggle task completion",
)
async def toggle_complete(
    user_id: str,
    task_id: int,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Toggle the completed status of a task."""
    verify_user_ownership(user_id, current_user)

    query = select(Task).where(
        Task.id == task_id,
        Task.user_id == current_user,
    )
    result = await db.execute(query)
    task = result.scalar_one_or_none()

    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Task {task_id} not found",
        )

    task.completed = not task.completed
    task.updated_at = datetime.now(timezone.utc)

    await db.commit()
    await db.refresh(task)

    return task
```

---

## 10. Main Application

### main.py

```python
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from core.config import settings
from database import create_db_tables, async_engine
from routes.tasks import router as tasks_router

# Configure logging
logging.basicConfig(
    level=logging.INFO if settings.ENVIRONMENT == "production" else logging.DEBUG,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan: startup and shutdown events."""
    # Startup
    logger.info("Starting Todo API...")
    if settings.ENVIRONMENT == "development":
        await create_db_tables()
        logger.info("Database tables created (development mode)")
    yield
    # Shutdown
    logger.info("Shutting down Todo API...")
    await async_engine.dispose()


app = FastAPI(
    title="Todo API",
    description="Secure task management API with user isolation",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH"],
    allow_headers=["Authorization", "Content-Type"],
)


# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Handle unexpected errors without leaking details."""
    logger.error(f"Unexpected error: {exc}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "Internal server error"},
    )


# Include routers
app.include_router(tasks_router)


# Health check endpoint
@app.get("/health", tags=["health"])
async def health_check():
    """Health check endpoint for monitoring."""
    return {"status": "healthy", "version": "1.0.0"}


@app.get("/", tags=["root"])
async def root():
    """Root endpoint with API information."""
    return {
        "name": "Todo API",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/health",
    }
```

---

## 11. Error Handling & Logging

### Error Response Consistency

| Status Code | When | Response Body |
|-------------|------|---------------|
| 200 | Success (GET, PUT, PATCH, DELETE) | Task object or success message |
| 201 | Created (POST) | Created task object |
| 400 | Validation error | `{"detail": "Validation error message"}` |
| 401 | Missing/invalid/expired token | `{"detail": "Token has expired"}` |
| 403 | User mismatch | `{"detail": "Access denied: Cannot access other user's resources"}` |
| 404 | Task not found | `{"detail": "Task {id} not found"}` |
| 422 | Request body parse error | Auto-generated by FastAPI |
| 500 | Server error | `{"detail": "Internal server error"}` |

### Logging Strategy

```python
# In routes - log significant actions
logger.info(f"User {current_user} created task {task.id}")
logger.info(f"User {current_user} deleted task {task_id}")

# In auth - log security events (no token contents)
logger.warning(f"Invalid token attempt from {request.client.host}")
logger.warning(f"User {current_user} attempted access to {path_user_id}")

# Never log:
# - JWT tokens or secrets
# - Full error stacks in production
# - User passwords or credentials
```

---

## 12. Phased Implementation Order (for /sp.tasks)

### Phase 1: Project Foundation
1. Create `backend/` directory structure
2. Create `requirements.txt` with all dependencies
3. Create `backend/.env.example` with template
4. Create `core/config.py` with Settings class
5. Create basic `main.py` with health endpoint

### Phase 2: Database Layer
6. Create `database.py` with async engine and session
7. Create `models.py` with Task SQLModel
8. Add startup event to create tables
9. Test database connection to Neon

### Phase 3: Authentication
10. Create `auth/jwt.py` with decode/verify functions
11. Create `auth/dependencies.py` with get_current_user
12. Add verify_user_ownership function
13. Test JWT decoding with sample token

### Phase 4: Schemas
14. Create `schemas/task.py` with all Pydantic models
15. Add TaskStatus and TaskSort enums
16. Validate schema examples

### Phase 5: Routes (Incremental)
17. Create `routes/tasks.py` with router
18. Implement GET /tasks (list)
19. Implement POST /tasks (create)
20. Implement GET /tasks/{id} (single)
21. Implement PUT /tasks/{id} (update)
22. Implement DELETE /tasks/{id} (delete)
23. Implement PATCH /tasks/{id}/complete (toggle)

### Phase 6: Integration & Polish
24. Add CORS middleware configuration
25. Add global exception handler
26. Add request logging
27. Create Dockerfile
28. Create backend/CLAUDE.md development guide
29. Manual verification with curl

---

## 13. Quality & Verification Gates

### Type Safety
- All function parameters and returns typed
- Pydantic models with Field constraints
- SQLModel with proper column types
- mypy clean (optional but recommended)

### Input Validation
- Title: 1-200 characters (Pydantic enforces)
- Description: optional, any length
- Status filter: enum validation
- Sort: enum validation
- Task ID: integer validation

### Ownership Enforcement Test Cases

```bash
# Test 1: Valid request
curl -X GET http://localhost:8000/api/user123/tasks \
  -H "Authorization: Bearer <token-for-user123>"
# Expected: 200 with user123's tasks

# Test 2: Wrong user in path
curl -X GET http://localhost:8000/api/user456/tasks \
  -H "Authorization: Bearer <token-for-user123>"
# Expected: 403 Forbidden

# Test 3: No token
curl -X GET http://localhost:8000/api/user123/tasks
# Expected: 401 Unauthorized

# Test 4: Expired token
curl -X GET http://localhost:8000/api/user123/tasks \
  -H "Authorization: Bearer <expired-token>"
# Expected: 401 Token has expired

# Test 5: Task owned by different user
curl -X GET http://localhost:8000/api/user123/tasks/999 \
  -H "Authorization: Bearer <token-for-user123>"
# Expected: 404 (task doesn't exist for this user)
```

### Docker Ready

```dockerfile
# backend/Dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

```bash
# Run locally
cd backend
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Run with Docker
docker build -t todo-api .
docker run -p 8000:8000 --env-file .env todo-api
```

---

## 14. Complexity Tracking

> No constitution violations requiring justification. Architecture follows minimal complexity principle.

| Aspect | Decision | Rationale |
|--------|----------|-----------|
| No Repository Pattern | Direct SQLModel queries | Simple CRUD doesn't need abstraction |
| No Service Layer | Logic in route handlers | Single responsibility per endpoint |
| Sync-style code | Async throughout | Better concurrency for I/O-bound ops |
| No Alembic | Table creation on startup | Acceptable for hackathon scope |

---

Backend implementation plan complete. This architecture ensures secure user-isolated Todo API perfectly compatible with the frontend.

Ready for /sp.tasks to break into atomic steps (suggest starting with database + auth).
