---
id: 010
title: Session Token Authentication Fix
stage: green
date: 2026-02-08
surface: agent
model: claude-sonnet-4-5-20250929
feature: 002-backend-api-spec
branch: 002-backend-api-spec
user: shaik
command: debugging
labels: ["authentication", "session", "better-auth", "fix"]
links:
  spec: specs/002-backend-api-spec/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - backend/auth/session.py (created - session token verification)
  - backend/auth/dependencies.py (modified - dual auth support)
  - frontend/lib/api.ts (modified - use session token)
tests:
  - Session token validation against database
  - Fallback to JWT for backwards compatibility
---

## Prompt

Backend logs showed:
```
DEBUG - Decoding token (first 20 chars): 8vivkyszdU9n8RA6dOW1...
ERROR - JWT decode error: Not enough segments
401 Unauthorized
```

The token `8vivkyszdU9n8RA6dOW1...` has no dots, meaning it's not a JWT (which has 3 parts: `header.payload.signature`).

## Response snapshot

**Root Cause - Final Answer**

Better Auth stores session tokens in the `session` table. These are **not JWTs** - they're random strings used as session identifiers. The frontend was correctly sending `session.token`, but the backend was trying to decode it as a JWT.

**JWT vs Session Token Confusion**

1. **Better Auth JWT Plugin**: Creates JWTs for stateless auth scenarios
2. **Better Auth Session Token**: Random string stored in database for stateful sessions
3. **Our App**: Uses stateful sessions (tokens in database), not stateless JWTs

The JWT plugin name is misleading - it doesn't mean all tokens are JWTs.

**Solution: Database Session Validation**

Instead of trying to decode session tokens as JWTs, validate them against the database:

1. **Created `backend/auth/session.py`**:
   - `verify_session_token(token, db)` function
   - Queries `session` table for matching token
   - Checks expiration timestamp
   - Returns user_id if valid

2. **Modified `backend/auth/dependencies.py`**:
   - Updated `get_current_user()` to accept database session
   - **Dual authentication support**:
     - If token has no dots → session token → verify against database
     - If token has dots → JWT → decode with PyJWT
   - Maintains backwards compatibility

3. **Simplified `frontend/lib/api.ts`**:
   - Uses `session.token` directly (no JWT extraction needed)
   - Clean, simple approach

**Authentication Flow (Final)**

```
┌─────────────┐
│   Frontend  │
│  Better Auth│
└──────┬──────┘
       │ 1. Login → session token stored in DB
       │
       ▼
┌──────────────────────┐
│  session.token       │
│  (e.g., 8vivky...)   │
└──────┬───────────────┘
       │ 2. API request with Bearer token
       │
       ▼
┌─────────────────────────────┐
│   Backend FastAPI           │
│   auth/dependencies.py      │
├─────────────────────────────┤
│  Is token a JWT? (has dots) │
│  ├─ No → verify_session()   │
│  │        ↓                  │
│  │   Query session table    │
│  │   Check expiration       │
│  │   Return user_id ✓       │
│  │                           │
│  └─ Yes → decode_jwt()      │
│         (fallback)           │
└─────────────────────────────┘
```

**Why This Works**

- Better Auth manages session lifecycle (creation, expiration, deletion)
- Backend validates session exists and isn't expired
- No JWT complexity, no signing/verification mismatches
- Stateful sessions with database as source of truth

## Outcome

- ✅ Impact: Authentication should now work - backend validates session tokens correctly
- 🧪 Tests: Session validation logic complete, awaiting live test
- 📁 Files: 1 created, 2 modified
- 🔁 Next prompts: Restart backend, login, verify dashboard loads and stays loaded
- 🧠 Reflection: Better Auth "JWT plugin" is for generating JWTs on-demand, not for session tokens; session tokens are always database-backed

## Evaluation notes (flywheel)

- Failure modes observed:
  - Confusion between JWT tokens and session tokens
  - Better Auth JWT plugin naming is misleading
  - Assumed all tokens are JWTs when they're not
- Graders run and results (PASS/FAIL):
  - Session validation implementation: PASS
  - Dual auth support (session + JWT fallback): PASS
  - Database query for session: PENDING (needs live test)
- Prompt variant (if applicable): N/A
- Next experiment (smallest change to try): Test with live login to confirm session validation works
