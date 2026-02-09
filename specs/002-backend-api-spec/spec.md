# Feature Specification: Backend API for Todo Application

**Feature Branch**: `002-backend-api-spec`
**Created**: 2026-02-07
**Status**: Draft
**Input**: User description: "Create a complete, professional-grade Backend Specification for the full-stack Todo application (Phase II). Backend only (Python FastAPI) designed for perfect integration with the premium frontend (Next.js + Better Auth JWT)."

---

## Overview

This specification defines the backend service for a full-stack Todo application. The backend serves as the secure data layer, providing task management capabilities exclusively to authenticated users. It integrates with a separately-managed frontend that handles user authentication, ensuring strict data isolation where each user can only access and modify their own tasks.

### Business Value

- Enables users to manage personal tasks securely across devices
- Provides reliable data persistence with user-isolated storage
- Supports a modern frontend with instant, optimistic updates
- Ensures data security through token-based authentication verification

### Scope Boundaries

**In Scope:**
- Task CRUD operations (create, read, update, delete)
- Task completion status toggling
- Task filtering (by completion status) and sorting
- JWT token verification for request authentication
- User-scoped data isolation

**Out of Scope:**
- User registration and login (handled by frontend with Better Auth)
- Password management and recovery
- Task sharing between users
- Task categories, tags, or labels
- Due dates, reminders, or notifications
- File attachments

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Authenticated User Views Their Tasks (Priority: P1)

As an authenticated user, I want to retrieve my task list so I can see what I need to accomplish.

**Why this priority**: Core functionality - users must be able to see their tasks before any other operation makes sense.

**Independent Test**: Can be fully tested by making an authenticated request to retrieve tasks and verifying the response contains only the requesting user's tasks.

**Acceptance Scenarios**:

1. **Given** a user is authenticated with a valid token, **When** they request their task list, **Then** the system returns all tasks belonging to that user only
2. **Given** a user is authenticated, **When** they request tasks with status filter "completed", **Then** only completed tasks are returned
3. **Given** a user is authenticated, **When** they request tasks with status filter "pending", **Then** only incomplete tasks are returned
4. **Given** a user is authenticated, **When** they request tasks sorted by title, **Then** tasks are returned in alphabetical order
5. **Given** a user has no tasks, **When** they request their task list, **Then** an empty list is returned

---

### User Story 2 - Authenticated User Creates a Task (Priority: P1)

As an authenticated user, I want to create new tasks so I can track things I need to do.

**Why this priority**: Core functionality - users need to add tasks to have data to manage.

**Independent Test**: Can be fully tested by creating a task and verifying it appears in subsequent task list requests.

**Acceptance Scenarios**:

1. **Given** a user is authenticated, **When** they submit a task with a valid title (1-200 characters), **Then** the task is created and returned with a unique identifier
2. **Given** a user is authenticated, **When** they submit a task with title and optional description, **Then** both fields are stored correctly
3. **Given** a user is authenticated, **When** they create a task, **Then** the task is automatically associated with their user ID
4. **Given** a user submits an empty title, **When** the request is processed, **Then** the system returns a validation error
5. **Given** a user submits a title exceeding 200 characters, **When** the request is processed, **Then** the system returns a validation error

---

### User Story 3 - Authenticated User Updates a Task (Priority: P2)

As an authenticated user, I want to update my existing tasks so I can correct or expand task details.

**Why this priority**: Important for task management but secondary to viewing and creating tasks.

**Independent Test**: Can be fully tested by updating a task and verifying changes persist in subsequent retrieval.

**Acceptance Scenarios**:

1. **Given** a user owns a task, **When** they update the title, **Then** the change is persisted and the updated timestamp is refreshed
2. **Given** a user owns a task, **When** they update the description, **Then** the change is persisted
3. **Given** a user attempts to update another user's task, **When** the request is processed, **Then** the system returns an authorization error
4. **Given** a user attempts to update a non-existent task, **When** the request is processed, **Then** the system returns a not found error

---

### User Story 4 - Authenticated User Toggles Task Completion (Priority: P2)

As an authenticated user, I want to mark tasks as complete or incomplete so I can track my progress.

**Why this priority**: Essential for task management workflow but depends on tasks existing first.

**Independent Test**: Can be fully tested by toggling completion status and verifying the change.

**Acceptance Scenarios**:

1. **Given** a user owns an incomplete task, **When** they toggle completion, **Then** the task becomes completed
2. **Given** a user owns a completed task, **When** they toggle completion, **Then** the task becomes incomplete
3. **Given** a user attempts to toggle another user's task, **When** the request is processed, **Then** the system returns an authorization error

---

### User Story 5 - Authenticated User Deletes a Task (Priority: P3)

As an authenticated user, I want to delete tasks I no longer need so I can keep my list clean.

**Why this priority**: Lower priority as users can work around this by marking tasks complete.

**Independent Test**: Can be fully tested by deleting a task and verifying it no longer appears in task list.

**Acceptance Scenarios**:

1. **Given** a user owns a task, **When** they delete it, **Then** the task is permanently removed
2. **Given** a user attempts to delete another user's task, **When** the request is processed, **Then** the system returns an authorization error
3. **Given** a user attempts to delete a non-existent task, **When** the request is processed, **Then** the system returns a not found error

---

### User Story 6 - Unauthenticated Request Handling (Priority: P1)

As the system, I must reject unauthenticated requests to protect user data.

**Why this priority**: Security is critical - all data access must require authentication.

**Independent Test**: Can be fully tested by making requests without valid tokens and verifying rejection.

**Acceptance Scenarios**:

1. **Given** a request has no authentication token, **When** it reaches any task endpoint, **Then** the system returns an authentication error (401)
2. **Given** a request has an expired token, **When** it reaches any task endpoint, **Then** the system returns an authentication error (401)
3. **Given** a request has a malformed token, **When** it reaches any task endpoint, **Then** the system returns an authentication error (401)
4. **Given** a request has a token signed with wrong secret, **When** it reaches any task endpoint, **Then** the system returns an authentication error (401)

---

### Edge Cases

- **Empty task title**: System rejects with validation error
- **Title at boundary (200 chars)**: System accepts
- **Title exceeds boundary (201+ chars)**: System rejects with validation error
- **Very long description**: System accepts (no explicit limit)
- **Concurrent updates to same task**: Last write wins (standard behavior)
- **Task ID that doesn't exist**: System returns 404 Not Found
- **Task ID belonging to another user**: System returns 403 Forbidden
- **Invalid filter/sort parameters**: System uses defaults (all tasks, sorted by creation date descending)
- **Database connection failure**: System returns 503 Service Unavailable with appropriate message

---

## Requirements *(mandatory)*

### Functional Requirements

#### Authentication & Authorization

- **FR-001**: System MUST verify JWT tokens on every request using a shared secret
- **FR-002**: System MUST extract user identity from valid JWT tokens
- **FR-003**: System MUST return 401 Unauthorized for requests without valid authentication
- **FR-004**: System MUST return 403 Forbidden when users attempt to access other users' data
- **FR-005**: System MUST associate all created tasks with the authenticated user's ID

#### Task Management

- **FR-006**: System MUST allow authenticated users to create tasks with required title (1-200 characters) and optional description
- **FR-007**: System MUST allow authenticated users to retrieve their complete task list
- **FR-008**: System MUST allow authenticated users to retrieve a single task by ID
- **FR-009**: System MUST allow authenticated users to update their own tasks (title, description, completed status)
- **FR-010**: System MUST allow authenticated users to delete their own tasks
- **FR-011**: System MUST allow authenticated users to toggle task completion status
- **FR-012**: System MUST automatically set creation timestamp when tasks are created
- **FR-013**: System MUST automatically update modification timestamp when tasks are modified

#### Filtering & Sorting

- **FR-014**: System MUST support filtering tasks by completion status (all, pending, completed)
- **FR-015**: System MUST support sorting tasks by creation date or title
- **FR-016**: System MUST default to showing all tasks sorted by creation date (newest first) when no filters specified

#### Data Integrity

- **FR-017**: System MUST persist all task data reliably
- **FR-018**: System MUST validate all input data before processing
- **FR-019**: System MUST return appropriate error messages for invalid requests

### Key Entities

- **User**: Represents an authenticated person using the system. Users are created and managed externally; the backend only references user identifiers from JWT tokens. Key attributes: unique identifier, email (from token claims).

- **Task**: Represents a single todo item belonging to a user. Key attributes: unique identifier, owner reference, title text, optional description text, completion status, creation timestamp, last modification timestamp.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Authenticated users can retrieve their task list in under 1 second for up to 1000 tasks
- **SC-002**: Task creation, update, and deletion operations complete in under 500 milliseconds
- **SC-003**: 100% of requests without valid authentication are rejected with appropriate error response
- **SC-004**: 100% of requests attempting cross-user data access are rejected with appropriate error response
- **SC-005**: System maintains data integrity - no task data loss during normal operations
- **SC-006**: System handles 100 concurrent users without degradation
- **SC-007**: All validation errors return clear, actionable error messages
- **SC-008**: System achieves 99.9% uptime during normal operations

---

## API Contract

### Endpoint Summary

| Method | Endpoint                              | Description         | Status Codes         |
|--------|---------------------------------------|---------------------|----------------------|
| GET    | /api/{user_id}/tasks                  | List user's tasks   | 200, 401, 403        |
| POST   | /api/{user_id}/tasks                  | Create new task     | 201, 400, 401, 403   |
| GET    | /api/{user_id}/tasks/{task_id}        | Get single task     | 200, 401, 403, 404   |
| PUT    | /api/{user_id}/tasks/{task_id}        | Update task         | 200, 400, 401, 403, 404 |
| DELETE | /api/{user_id}/tasks/{task_id}        | Delete task         | 200, 401, 403, 404   |
| PATCH  | /api/{user_id}/tasks/{task_id}/complete | Toggle completion | 200, 401, 403, 404   |

### Request/Response Formats

#### Task Object Structure

```
Task {
  id: number (unique identifier)
  user_id: string (owner reference)
  title: string (1-200 characters, required)
  description: string or null (optional)
  completed: boolean (default: false)
  created_at: ISO 8601 datetime string
  updated_at: ISO 8601 datetime string
}
```

#### List Tasks Request

- **Query Parameters**:
  - `status`: "all" | "pending" | "completed" (default: "all")
  - `sort`: "created" | "title" (default: "created")
- **Response**: Array of Task objects

#### Create Task Request

- **Body**: `{ title: string, description?: string }`
- **Response**: Created Task object

#### Update Task Request

- **Body**: `{ title?: string, description?: string, completed?: boolean }`
- **Response**: Updated Task object

#### Error Response Format

```
Error {
  detail: string (human-readable error message)
}
```

---

## Security Requirements

- All endpoints require Bearer token authentication
- Tokens are verified using a shared secret with the frontend authentication system
- User isolation is enforced at the data layer - queries always filter by authenticated user
- Path parameter user_id must match the authenticated user's ID
- No sensitive data logged (tokens, user credentials)
- Input sanitization prevents injection attacks

---

## Assumptions

1. **Authentication tokens are JWT format**: The frontend (Better Auth) issues standard JWT tokens that can be decoded and verified with a shared secret.

2. **User records exist before task creation**: The users table is populated by the frontend authentication system; the backend only references existing user IDs.

3. **Single database instance**: No need for read replicas or sharding at current scale.

4. **Timestamps in UTC**: All datetime values stored and returned in UTC timezone.

5. **No pagination required**: Task lists are expected to remain manageable (under 1000 per user) without pagination.

6. **Soft delete not required**: Task deletion is permanent; no recovery mechanism needed.

7. **No rate limiting at application level**: Infrastructure handles rate limiting if needed.

---

## Dependencies

- **External Service**: Frontend application for user authentication (Better Auth)
- **External Service**: Managed PostgreSQL database service
- **Shared Configuration**: JWT secret must match between frontend and backend

---

## Non-Goals (Explicit Exclusions)

- User registration, login, logout, or session management
- Password reset or account recovery flows
- Email notifications or reminders
- Task due dates or scheduling
- Task categories, tags, or labels
- Subtasks or task hierarchies
- Task sharing or collaboration
- File attachments
- Search functionality beyond filtering
- Pagination (deferred until needed)
- Audit logging beyond standard request logs
- API versioning (v1 implied)

---

Backend specification complete and ready for perfect integration with the premium frontend.
Ready for /sp.plan to create detailed backend implementation architecture.
