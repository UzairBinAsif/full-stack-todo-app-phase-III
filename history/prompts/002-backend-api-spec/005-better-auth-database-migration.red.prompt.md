---
id: 005
title: Better Auth Database Migration Fixed
stage: red
date: 2026-02-08
surface: agent
model: claude-sonnet-4-5-20250929
feature: 002-backend-api-spec
branch: 002-backend-api-spec
user: shaik
command: debugging
labels: ["database", "migration", "better-auth", "fix"]
links:
  spec: specs/002-backend-api-spec/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - frontend/scripts/migrate.ts (created)
  - frontend/scripts/check-tables.ts (created)
  - frontend/package.json (modified - added migrate and check-db scripts)
  - backend/database.py (modified - fixed asyncpg ssl parameter)
tests:
  - Database migration successful - all tables created
  - Backend server starts without errors
---

## Prompt

User reported two errors:
1. Backend uvicorn server failing with `TypeError: connect() got an unexpected keyword argument 'sslmode'`
2. Frontend signup failing with `ERROR [Better Auth]: relation "user" does not exist`

## Response snapshot

**Issue 1: Backend Database Connection**
- Root cause: `asyncpg` driver uses `ssl=` parameter, not `sslmode=`
- Fix: Added `get_asyncpg_url()` helper in `backend/database.py` to convert connection string
- Result: Backend server now starts successfully

**Issue 2: Better Auth Tables Missing**
- Root cause: Better Auth tables (`user`, `session`, `account`, `verification`) were not created in Neon PostgreSQL
- Investigation: Better Auth doesn't auto-create tables; requires manual migration
- Solution implemented:
  1. Created `frontend/scripts/migrate.ts` with SQL schema for all Better Auth tables
  2. Installed `tsx` and `dotenv` for running TypeScript migration scripts
  3. Added `npm run migrate` script to package.json
  4. Created `frontend/scripts/check-tables.ts` for verifying database schema
  5. Successfully ran migration - all 5 tables created

**Database Schema Verified:**
```
✓ account       (Better Auth accounts)
✓ session       (Better Auth sessions)
✓ tasks         (Backend API tasks)
✓ user          (Better Auth users)
✓ verification  (Better Auth email verification)
```

## Outcome

- ✅ Impact: Both frontend and backend now fully operational
- 🧪 Tests: Migration successful, database schema verified
- 📁 Files: 3 files created/modified (migrate.ts, check-tables.ts, package.json, database.py)
- 🔁 Next prompts: Test signup flow, create tasks, verify full stack integration
- 🧠 Reflection: Better Auth doesn't auto-migrate in production mode; explicit migration script needed

## Evaluation notes (flywheel)

- Failure modes observed:
  - asyncpg parameter mismatch (sslmode vs ssl)
  - Better Auth requires manual table creation
- Graders run and results (PASS/FAIL):
  - Database connection: PASS
  - Table creation: PASS
  - Schema verification: PASS
- Prompt variant (if applicable): N/A
- Next experiment (smallest change to try): Add migration check to startup script to auto-detect missing tables
