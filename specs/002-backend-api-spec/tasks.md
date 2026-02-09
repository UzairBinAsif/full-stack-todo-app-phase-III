# Tasks: Backend API for Todo Application

**Feature Branch**: `002-backend-api-spec`
**Input**: Design documents from `/specs/002-backend-api-spec/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅

**Tests**: Not explicitly requested - manual verification via curl commands provided instead.

**Organization**: Tasks organized by user story to enable independent implementation and testing.

---

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)
- Include exact file paths in descriptions

## Path Convention

**Web app structure**: All paths relative to `backend/` directory

---

## Phase 1: Setup (Project Foundation)

**Purpose**: Create project structure, dependencies, and configuration

**Reference**: [plan.md Section 4-5]

- [x] T001 Create backend directory structure with folders: `backend/`, `backend/auth/`, `backend/routes/`, `backend/schemas/`, `backend/core/`, `backend/tests/`

- [x] T002 Create `backend/requirements.txt` with all dependencies (fastapi, uvicorn[standard], sqlmodel, asyncpg, pyjwt, pydantic-settings, python-dotenv, httpx, pytest, pytest-asyncio)

- [x] T003 [P] Create `backend/.env.example` with template variables (DATABASE_URL, BETTER_AUTH_SECRET, ENVIRONMENT, CORS_ORIGINS)

- [x] T004 [P] Create `backend/core/__init__.py` and `backend/core/config.py` with Settings class using pydantic-settings

**Verification**: `ls backend/` shows all directories; `cat backend/requirements.txt` shows dependencies

**Commit**: `feat(backend): initialize project structure and dependencies`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Database connection, models, and authentication - MUST complete before any user story

**Reference**: [plan.md Section 6-7]

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

### Database Layer

- [x] T005 Create `backend/database.py` with async engine, session factory (async_session_maker), and `get_db()` dependency using SQLAlchemy + asyncpg for Neon PostgreSQL

- [x] T006 Create `backend/models.py` with Task SQLModel (id: int PK, user_id: str indexed, title: str max 200, description: str|None, completed: bool default False, created_at: datetime, updated_at: datetime)

### Authentication Layer

- [x] T007 Create `backend/auth/__init__.py` and `backend/auth/jwt.py` with `decode_token()` and `get_user_id_from_token()` functions using PyJWT + BETTER_AUTH_SECRET

- [x] T008 Create `backend/auth/dependencies.py` with `get_current_user()` dependency (HTTPBearer → decode JWT → return user_id, raise 401 on failure) and `verify_user_ownership()` helper (raise 403 if path user_id != token user_id)

### Schemas

- [x] T009 Create `backend/schemas/__init__.py` and `backend/schemas/task.py` with CreateTask (title required 1-200, description optional), UpdateTask (all optional), TaskResponse (all fields), TaskStatus enum (all/pending/completed), TaskSort enum (created/title)

### Main App Skeleton

- [x] T010 Create `backend/main.py` with FastAPI app, lifespan (create tables on startup), CORS middleware (allow frontend origins), include placeholder for router

**Verification**:
```bash
cd backend && python -c "from core.config import settings; print(settings.ENVIRONMENT)"
cd backend && python -c "from models import Task; print(Task.__tablename__)"
cd backend && python -c "from auth.jwt import decode_token; print('JWT module loaded')"
```

**Commit**: `feat(backend): add database, models, auth layer, and schemas`

**Checkpoint**: Foundation ready - user story implementation can begin

---

## Phase 3: User Story 6 - Unauthenticated Request Handling (Priority: P1) 🔒

**Goal**: Reject all unauthenticated requests with 401 Unauthorized

**Reference**: [spec.md User Story 6], [plan.md Section 7]

**Independent Test**: Make requests without valid tokens and verify 401 rejection

> **Note**: This story is implemented FIRST because it's the security foundation. All routes will use the auth dependency.

### Implementation

- [x] T011 [US6] Create `backend/routes/__init__.py` and `backend/routes/tasks.py` with APIRouter(prefix="/api", tags=["tasks"]) and import auth dependencies

- [x] T012 [US6] Add placeholder GET endpoint `/{user_id}/tasks` in `backend/routes/tasks.py` that requires CurrentUser dependency (returns empty list for now)

- [x] T013 [US6] Update `backend/main.py` to include tasks router and add `/health` endpoint

**Verification**:
```bash
# Start server
cd backend && uvicorn main:app --reload --port 8000

# Test without token (should get 401)
curl -s http://localhost:8000/api/test-user/tasks
# Expected: {"detail":"Not authenticated"}

# Test health endpoint (no auth required)
curl -s http://localhost:8000/health
# Expected: {"status":"healthy","version":"1.0.0"}
```

**Commit**: `feat(backend): add auth-protected route skeleton with 401 handling`

**Checkpoint**: Authentication rejection verified - routes are protected by default

---

## Phase 4: User Story 1 - View Tasks (Priority: P1) 📋

**Goal**: Authenticated users can retrieve their task list with filtering and sorting

**Reference**: [spec.md User Story 1], [plan.md Section 9 - GET /tasks]

**Independent Test**: Create tasks via database, then GET /tasks returns only authenticated user's tasks

### Implementation

- [x] T014 [US1] Implement GET `/{user_id}/tasks` endpoint in `backend/routes/tasks.py` with query params (status: TaskStatus, sort: TaskSort), ownership verification, and user_id filtering

**Verification**:
```bash
# With valid token (replace TOKEN and USER_ID)
curl -X GET "http://localhost:8000/api/USER_ID/tasks" \
  -H "Authorization: Bearer TOKEN"
# Expected: [] (empty list, no tasks yet)

# With status filter
curl -X GET "http://localhost:8000/api/USER_ID/tasks?status=completed" \
  -H "Authorization: Bearer TOKEN"
# Expected: [] (empty list)

# Wrong user_id in path (should get 403)
curl -X GET "http://localhost:8000/api/wrong-user/tasks" \
  -H "Authorization: Bearer TOKEN"
# Expected: {"detail":"Access denied: Cannot access other user's resources"}
```

**Commit**: `feat(backend): implement GET tasks endpoint with filtering and sorting`

---

## Phase 5: User Story 2 - Create Task (Priority: P1) ➕

**Goal**: Authenticated users can create new tasks

**Reference**: [spec.md User Story 2], [plan.md Section 9 - POST /tasks]

**Independent Test**: POST a task, then GET /tasks returns the created task

### Implementation

- [x] T015 [US2] Implement POST `/{user_id}/tasks` endpoint in `backend/routes/tasks.py` with CreateTask body, ownership verification, auto-set user_id from token, return 201 with TaskResponse

**Verification**:
```bash
# Create task
curl -X POST "http://localhost:8000/api/USER_ID/tasks" \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Buy groceries","description":"Milk, eggs, bread"}'
# Expected: 201 {"id":1,"user_id":"...","title":"Buy groceries",...}

# Verify task appears in list
curl -X GET "http://localhost:8000/api/USER_ID/tasks" \
  -H "Authorization: Bearer TOKEN"
# Expected: [{"id":1,"title":"Buy groceries",...}]

# Test validation (empty title)
curl -X POST "http://localhost:8000/api/USER_ID/tasks" \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":""}'
# Expected: 422 validation error
```

**Commit**: `feat(backend): implement POST tasks endpoint with validation`

**Checkpoint**: MVP Complete - Users can view and create tasks

---

## Phase 6: User Story 1 (continued) - Get Single Task 📄

**Goal**: Authenticated users can retrieve a specific task by ID

**Reference**: [spec.md User Story 1], [plan.md Section 9 - GET /tasks/{id}]

### Implementation

- [x] T016 [US1] Implement GET `/{user_id}/tasks/{task_id}` endpoint in `backend/routes/tasks.py` with ownership verification, return TaskResponse or 404

**Verification**:
```bash
# Get existing task
curl -X GET "http://localhost:8000/api/USER_ID/tasks/1" \
  -H "Authorization: Bearer TOKEN"
# Expected: {"id":1,"title":"Buy groceries",...}

# Get non-existent task (should get 404)
curl -X GET "http://localhost:8000/api/USER_ID/tasks/999" \
  -H "Authorization: Bearer TOKEN"
# Expected: {"detail":"Task 999 not found"}
```

**Commit**: `feat(backend): implement GET single task endpoint`

---

## Phase 7: User Story 3 - Update Task (Priority: P2) ✏️

**Goal**: Authenticated users can update their own tasks

**Reference**: [spec.md User Story 3], [plan.md Section 9 - PUT /tasks/{id}]

**Independent Test**: Update a task's title, verify change persists in GET

### Implementation

- [x] T017 [US3] Implement PUT `/{user_id}/tasks/{task_id}` endpoint in `backend/routes/tasks.py` with UpdateTask body, ownership verification, partial update, auto-update updated_at timestamp

**Verification**:
```bash
# Update task title
curl -X PUT "http://localhost:8000/api/USER_ID/tasks/1" \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Buy groceries (updated)"}'
# Expected: {"id":1,"title":"Buy groceries (updated)",...}

# Partial update (only description)
curl -X PUT "http://localhost:8000/api/USER_ID/tasks/1" \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"description":"Updated description"}'
# Expected: 200 with updated task
```

**Commit**: `feat(backend): implement PUT tasks endpoint for updates`

---

## Phase 8: User Story 4 - Toggle Completion (Priority: P2) ✅

**Goal**: Authenticated users can toggle task completion status

**Reference**: [spec.md User Story 4], [plan.md Section 9 - PATCH /tasks/{id}/complete]

**Independent Test**: Toggle task from pending to completed, toggle again to pending

### Implementation

- [x] T018 [US4] Implement PATCH `/{user_id}/tasks/{task_id}/complete` endpoint in `backend/routes/tasks.py` with ownership verification, toggle completed boolean, return updated TaskResponse

**Verification**:
```bash
# Toggle to completed
curl -X PATCH "http://localhost:8000/api/USER_ID/tasks/1/complete" \
  -H "Authorization: Bearer TOKEN"
# Expected: {"id":1,"completed":true,...}

# Toggle back to pending
curl -X PATCH "http://localhost:8000/api/USER_ID/tasks/1/complete" \
  -H "Authorization: Bearer TOKEN"
# Expected: {"id":1,"completed":false,...}
```

**Commit**: `feat(backend): implement PATCH toggle completion endpoint`

---

## Phase 9: User Story 5 - Delete Task (Priority: P3) 🗑️

**Goal**: Authenticated users can delete their own tasks

**Reference**: [spec.md User Story 5], [plan.md Section 9 - DELETE /tasks/{id}]

**Independent Test**: Delete a task, verify it no longer appears in GET /tasks

### Implementation

- [x] T019 [US5] Implement DELETE `/{user_id}/tasks/{task_id}` endpoint in `backend/routes/tasks.py` with ownership verification, return success message

**Verification**:
```bash
# Delete task
curl -X DELETE "http://localhost:8000/api/USER_ID/tasks/1" \
  -H "Authorization: Bearer TOKEN"
# Expected: {"message":"Task deleted successfully"}

# Verify task is gone
curl -X GET "http://localhost:8000/api/USER_ID/tasks/1" \
  -H "Authorization: Bearer TOKEN"
# Expected: {"detail":"Task 1 not found"}
```

**Commit**: `feat(backend): implement DELETE tasks endpoint`

**Checkpoint**: All CRUD operations complete

---

## Phase 10: Polish & Production Readiness

**Purpose**: Error handling, logging, documentation, containerization

**Reference**: [plan.md Section 10-13]

- [x] T020 [P] Add global exception handler in `backend/main.py` for 500 errors (log details, return generic message)

- [x] T021 [P] Add logging configuration in `backend/main.py` (startup messages, request logging for debug mode)

- [x] T022 [P] Create `backend/Dockerfile` with Python 3.11-slim, requirements install, uvicorn CMD

- [x] T023 [P] Create `backend/CLAUDE.md` with backend development guidelines (how to run, test, add endpoints)

**Verification**:
```bash
# Build Docker image
cd backend && docker build -t todo-api .

# Run container (if Docker available)
docker run -p 8000:8000 --env-file .env todo-api

# Check logs
# Server should show startup messages
```

**Commit**: `feat(backend): add error handling, logging, Dockerfile, and docs`

---

## Dependencies & Execution Order

```
Phase 1 (Setup)
    │
    ▼
Phase 2 (Foundation) ─────────────────────────────────┐
    │                                                  │
    ▼                                                  │
Phase 3 (US6: Auth) ◄─────────────────────────────────┘
    │
    ├──────────────────────────────────────────────────┐
    │                                                  │
    ▼                                                  │
Phase 4 (US1: List) ──► Phase 6 (US1: Get Single)     │
    │                                                  │
    ▼                                                  │
Phase 5 (US2: Create) ◄───── MVP Milestone ───────────┘
    │
    ├──────────────────────┬──────────────────────────┐
    │                      │                          │
    ▼                      ▼                          ▼
Phase 7 (US3: Update)  Phase 8 (US4: Toggle)  Phase 9 (US5: Delete)
    │                      │                          │
    └──────────────────────┴──────────────────────────┘
                           │
                           ▼
                    Phase 10 (Polish)
```

### Parallel Execution Opportunities

| Phase | Parallelizable Tasks |
|-------|---------------------|
| Phase 1 | T003, T004 can run in parallel |
| Phase 2 | None - sequential dependencies |
| Phase 7-9 | All three phases can run in parallel after Phase 6 |
| Phase 10 | T020, T021, T022, T023 can all run in parallel |

---

## Implementation Strategy

### MVP Scope (Phases 1-5)
- Setup + Foundation + Auth + List + Create
- **Result**: Users can sign in, create tasks, and view their task list
- **Estimated Tasks**: T001-T015 (15 tasks)

### Full Feature (Phases 1-10)
- All CRUD operations + polish
- **Result**: Complete task management backend
- **Total Tasks**: T001-T023 (23 tasks)

### Suggested Implementation Order

1. **Start**: T001-T004 (Setup) - 4 tasks
2. **Then**: T005-T010 (Foundation) - 6 tasks
3. **Then**: T011-T013 (Auth/US6) - 3 tasks
4. **Then**: T014 (US1 List) - 1 task
5. **Then**: T015 (US2 Create) - 1 task → **MVP Complete**
6. **Then**: T016-T019 (Remaining CRUD) - 4 tasks
7. **Finally**: T020-T023 (Polish) - 4 tasks

---

## Summary

| Phase | User Story | Tasks | Description |
|-------|-----------|-------|-------------|
| 1 | Setup | T001-T004 | Project structure, deps, config |
| 2 | Foundation | T005-T010 | Database, models, auth, schemas |
| 3 | US6 (P1) | T011-T013 | Auth rejection (401) |
| 4 | US1 (P1) | T014 | List tasks |
| 5 | US2 (P1) | T015 | Create task |
| 6 | US1 (P1) | T016 | Get single task |
| 7 | US3 (P2) | T017 | Update task |
| 8 | US4 (P2) | T018 | Toggle completion |
| 9 | US5 (P3) | T019 | Delete task |
| 10 | Polish | T020-T023 | Error handling, logging, Docker |

**Total**: 23 atomic tasks across 10 phases

---

Backend broken into 23 atomic tasks following the plan.
Ready for /sp.implement – suggest starting with tasks T001-T010 (foundation), then T011-T013 (auth) before routes.
