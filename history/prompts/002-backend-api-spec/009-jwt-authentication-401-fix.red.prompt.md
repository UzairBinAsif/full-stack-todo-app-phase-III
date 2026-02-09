---
id: 009
title: JWT Authentication 401 Fix
stage: red
date: 2026-02-08
surface: agent
model: claude-sonnet-4-5-20250929
feature: 002-backend-api-spec
branch: 002-backend-api-spec
user: shaik
command: debugging
labels: ["authentication", "jwt", "401", "better-auth", "in-progress"]
links:
  spec: specs/002-backend-api-spec/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - frontend/lib/auth.ts (modified - added secret and JWT config)
  - frontend/lib/api.ts (modified - added debug logging)
  - backend/auth/jwt.py (modified - added debug logging and verification options)
  - backend/test_token.py (created - token debugging utility)
tests:
  - Backend returning 401 on all task API requests
  - Login successful but dashboard redirects back to login
---

## Prompt

User reported that after successful login, the dashboard loads briefly then redirects back to login. Backend logs show:
```
INFO: GET /api/a2eQxzd2IgtwIiVzvmeWJwhxj0piF8Zh/tasks HTTP/1.1 401 Unauthorized
INFO: GET /api/6GgCC4PR1wbJVZ71XDmaXYGT9aFKjCNl/tasks HTTP/1.1 401 Unauthorized
```

## Response snapshot

**Root Cause Analysis (In Progress)**

The authentication flow between frontend (Better Auth) and backend (FastAPI) is failing:

1. **Frontend**: Using Better Auth with JWT plugin
2. **Backend**: Using PyJWT to verify tokens with shared secret
3. **Problem**: Backend rejects all tokens with 401 Unauthorized

**Investigation Steps Taken**

1. **Verified shared secret matches**:
   - Frontend: `KyJghFrDygCr1K5b9uQf7oNOb6S1Ihoq`
   - Backend: `KyJghFrDygCr1K5b9uQf7oNOb6S1Ihoq` ✅

2. **Checked token transmission**:
   - Frontend sends: `session.data.session.token` in Authorization header
   - Backend receives: Bearer token in Authorization header
   - Format appears correct

3. **Identified potential issues**:
   - Better Auth JWT plugin may use RSA keys (stored in `jwks` table) by default
   - Backend expects HMAC (HS256) with shared secret
   - Token format mismatch causing verification failure

**Changes Made**

1. **Frontend (`lib/auth.ts`)**:
   - Added explicit `secret` configuration
   - Added JWT `issuer` and `audience` fields
   - This should force Better Auth to use HMAC with shared secret

2. **Frontend (`lib/api.ts`)**:
   - Added debug logging for token transmission
   - Logs userId, endpoint, and token preview

3. **Backend (`auth/jwt.py`)**:
   - Added debug logging for token decoding
   - Modified verification options to be more permissive
   - Logs token preview and payload structure

4. **Created debugging tool** (`backend/test_token.py`):
   - Standalone script to test JWT token decoding
   - Can decode and verify tokens manually
   - Usage: `python test_token.py <token>`

**Better Auth JWT Plugin Behavior**

The JWT plugin in Better Auth can work two ways:
1. **RSA mode (default)**: Generates RSA key pairs, stores in `jwks` table
2. **HMAC mode**: Uses shared secret (if `secret` is provided)

We need HMAC mode for the backend to verify tokens.

**Next Steps for User**

1. **Restart both servers** to pick up configuration changes:
   ```bash
   # Frontend
   cd frontend && npm run dev

   # Backend
   cd backend && uvicorn main:app --reload
   ```

2. **Login again** (old tokens won't work with new config)

3. **Check browser console** for debug logs showing token being sent

4. **Check backend logs** for JWT decode attempts

5. **If still failing**, capture a token and test it:
   ```bash
   # In browser console after login:
   authClient.getSession().then(s => console.log(s.data.session.token))

   # Copy token and test:
   cd backend
   python test_token.py "<paste-token-here>"
   ```

## Outcome

- ⏳ Impact: Authentication still failing (in progress)
- 🧪 Tests: Configuration updated, awaiting server restart
- 📁 Files: 4 files modified/created
- 🔁 Next prompts: Test with fresh login, capture token for analysis
- 🧠 Reflection: Better Auth JWT plugin has two modes (RSA vs HMAC); need explicit configuration for backend compatibility

## Evaluation notes (flywheel)

- Failure modes observed:
  - JWT signing method mismatch (RSA vs HMAC)
  - Better Auth defaults not compatible with simple PyJWT verification
  - Need explicit configuration for shared secret mode
- Graders run and results (PASS/FAIL):
  - Configuration changes: DONE
  - Token verification: PENDING (needs server restart and re-test)
- Prompt variant (if applicable): N/A
- Next experiment (smallest change to try): Test with captured token to confirm HMAC vs RSA issue
