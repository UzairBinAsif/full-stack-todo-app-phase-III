<!--
  SYNC IMPACT REPORT
  ==================
  Version Change: 0.0.0 → 1.0.0 (MAJOR - initial constitution)

  Modified Principles: N/A (initial creation)

  Added Sections:
  - 7 Core Principles (Technology Stack, Security, API Design, Database Schema,
    Code Quality, Scope Limitation, Judging & Traceability)
  - Development Workflow section
  - Monorepo Structure section
  - Governance rules

  Removed Sections: N/A

  Templates Requiring Updates:
  - .specify/templates/plan-template.md ✅ (already has Constitution Check gate)
  - .specify/templates/spec-template.md ✅ (compatible with acceptance criteria format)
  - .specify/templates/tasks-template.md ✅ (supports web app structure)

  Follow-up TODOs: None
-->

# Hackathon Todo Phase II Constitution

**Phase**: II – Full-Stack Multi-User Todo Web Application

**Description**: Build a secure, responsive, multi-user Todo web app from scratch (new folder, no Phase I console code carry-over). Users can sign up/sign in, manage only their own tasks via a REST API, with persistent Neon PostgreSQL storage.

## Core Principles

### I. Technology Stack (Non-Negotiable)

The following technology stack MUST be used exactly as specified — no substitutions permitted.

**Frontend**:
- Next.js 16+ with App Router
- TypeScript (strict mode)
- Tailwind CSS only — no inline styles
- Server Components by default; Client Components only when interactivity required
- Responsive / mobile-first design

**Backend**:
- Python FastAPI
- SQLModel (ORM)
- Pydantic for validation

**Database**:
- Neon Serverless PostgreSQL
- Connection via `DATABASE_URL` environment variable

**Authentication**:
- Better Auth (frontend) issuing JWT tokens
- Backend verifies JWT using shared `BETTER_AUTH_SECRET` env var
- All API endpoints require valid Bearer token → 401 Unauthorized if missing
- Strict user ownership: every DB query MUST filter by authenticated `user_id`

### II. Security & Data Isolation (Critical)

These rules are IMMUTABLE and MUST NEVER be violated:

- **IDOR Prevention**: No user can see, create, update, or delete another user's tasks
- **JWT Enforcement**: Every API operation MUST decode JWT → extract `user_id` → filter `WHERE user_id = ?`
- **Input Validation**: All inputs MUST be validated for length, type, and required fields
- **Error Handling**: Use `HTTPException` for proper error responses with appropriate status codes

### III. API Design (Exact Specification)

All endpoints are under `/api/` and require JWT authentication.

**Base Pattern**: `/api/{user_id}/tasks...` (MUST enforce `user_id` matches token)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/{user_id}/tasks` | List tasks (supports `?status=` & `?sort=`) |
| POST | `/api/{user_id}/tasks` | Create task |
| GET | `/api/{user_id}/tasks/{id}` | Get single task |
| PUT | `/api/{user_id}/tasks/{id}` | Update task |
| DELETE | `/api/{user_id}/tasks/{id}` | Delete task |
| PATCH | `/api/{user_id}/tasks/{id}/complete` | Toggle completed status |

### IV. Database Schema (Do Not Alter Without Spec Update)

**users** (managed by Better Auth):
- `id`: string (Primary Key)
- `email`: string
- `name`: string
- Additional fields as managed by Better Auth

**tasks**:
- `id`: integer (Primary Key, auto-increment)
- `user_id`: string (Foreign Key → users.id, NOT NULL)
- `title`: string (NOT NULL, 1–200 characters)
- `description`: text (NULL allowed)
- `completed`: boolean (DEFAULT false)
- `created_at`: timestamp (auto-set)
- `updated_at`: timestamp (auto-update)

**Indexes**:
- `user_id` (for ownership filtering)
- `completed` (for status filtering)

### V. Code Quality & Best Practices

- **Type Safety**: TypeScript strict mode; Pydantic strict validation
- **Clean Code**: Follow `frontend/CLAUDE.md` and `backend/CLAUDE.md` patterns
- **Error Handling**: Friendly frontend messages; proper backend HTTP status codes
- **No Debug Code**: No `console.log` in production code
- **Atomic Commits**: Reference spec/feature + task in commit messages
- **Traceability**: Keep `specs/` folder alive and updated for judge review

### VI. Scope Limitation

Phase II scope is strictly limited to:
- Task CRUD operations
- User authentication (sign up / sign in)
- Data persistence to Neon PostgreSQL

**Explicitly OUT OF SCOPE**:
- Chatbot features
- Phase III features
- Extra features (e.g., due dates, priorities, tags) unless explicitly specified later

### VII. Judging & Traceability Focus

- **Workflow Visibility**: Maximize visibility of spec → plan → tasks → code pipeline
- **@References**: Use `@specs/features/...` references in prompts for context
- **Easy Demo**: Support `docker-compose up` for easy demonstration
- **Verification**: After implementation, suggest basic verification via browser UI and `curl` API tests

## Development Workflow

Strict spec-driven development using Spec-Kit Plus commands in exact order:

1. `/sp.constitution` — This file (principles & non-negotiables)
2. `/sp.specify` — Define what & why (user stories, acceptance criteria)
3. `/sp.clarify` — If needed (resolve ambiguities)
4. `/sp.plan` — How (architecture, tech choices, detailed design)
5. `/sp.tasks` — Break into small, testable, atomic tasks
6. `/sp.implement` — Execute code generation per task

## Monorepo Structure

```
hackathon-todo-phase2/
├── .specify/              # Spec-Kit Plus config and templates
│   └── memory/
│       └── constitution.md  # This file
├── specs/                 # All specifications
│   ├── overview.md
│   ├── features/
│   ├── api/
│   ├── database/
│   └── ui/
├── history/               # Prompt history records
│   └── prompts/
├── CLAUDE.md              # Root-level agent guidelines
├── frontend/              # Next.js application
│   ├── CLAUDE.md          # Frontend-specific guidelines
│   └── ...
├── backend/               # FastAPI application
│   ├── CLAUDE.md          # Backend-specific guidelines
│   └── ...
└── docker-compose.yml     # Easy local run configuration
```

## Governance

### Amendment Procedure

1. Constitution supersedes all other practices and documentation
2. Amendments require:
   - Written justification
   - Impact assessment on existing specs/plans
   - Version increment following semantic versioning
   - Migration plan if breaking changes

### Compliance

- All PRs and code reviews MUST verify compliance with this constitution
- Any deviation MUST be justified and documented
- Complexity additions MUST prove simpler alternatives insufficient

### Version Policy

- **MAJOR**: Backward-incompatible principle changes or removals
- **MINOR**: New principles added or existing ones materially expanded
- **PATCH**: Clarifications, wording improvements, non-semantic refinements

---

**Version**: 1.0.0 | **Ratified**: 2025-02-07 | **Last Amended**: 2025-02-07
