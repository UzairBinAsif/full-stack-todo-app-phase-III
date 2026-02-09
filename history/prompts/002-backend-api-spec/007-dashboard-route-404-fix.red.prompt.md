---
id: 007
title: Dashboard Route 404 Fix
stage: red
date: 2026-02-08
surface: agent
model: claude-sonnet-4-5-20250929
feature: 002-backend-api-spec
branch: 002-backend-api-spec
user: shaik
command: debugging
labels: ["routing", "nextjs", "dashboard", "404", "fix"]
links:
  spec: specs/002-backend-api-spec/spec.md
  ticket: null
  adr: null
  pr: null
files:
  - frontend/app/dashboard/page.tsx (created)
  - frontend/app/dashboard/layout.tsx (created)
  - frontend/app/dashboard/error.tsx (created)
tests:
  - Login redirects to /dashboard successfully
  - Dashboard page renders with authentication check
---

## Prompt

User reported that after successful login/signup, navigating to `/dashboard` shows a 404 error page.

## Response snapshot

**Root Cause Analysis**
Next.js route groups (folders in parentheses like `(dashboard)`) don't create URL segments. The dashboard content was in `app/(dashboard)/page.tsx`, which maps to the root route `/`, not `/dashboard`.

**The Problem Flow**
1. Login form redirects to `/dashboard` after authentication (line 47 in `login-form.tsx`)
2. Root page (`app/page.tsx`) redirects authenticated users to `/dashboard`
3. But `/dashboard` route doesn't exist - causing 404
4. Actual dashboard is at `app/(dashboard)/page.tsx` which maps to `/`

**Circular Redirect Issue**
```
User logs in → Redirect to /dashboard → 404 (route doesn't exist)
                     ↑                          ↓
                     └──────────────────────────┘
```

**Solution Implemented**
Created an actual `/dashboard` route by moving content from `(dashboard)` route group:

1. **Created `app/dashboard/page.tsx`**:
   - Copied dashboard content from `(dashboard)/page.tsx`
   - Client component with TaskForm, TaskList, TaskFilters
   - Uses search params for filtering

2. **Created `app/dashboard/layout.tsx`**:
   - Copied from `(dashboard)/layout.tsx`
   - Server-side session check with Better Auth
   - Redirects unauthenticated users to `/login`
   - Includes Header and Sidebar components

3. **Created `app/dashboard/error.tsx`**:
   - Copied from `(dashboard)/error.tsx`
   - Error boundary for dashboard issues

**Route Structure (After Fix)**
```
app/
├── page.tsx                  → "/" (redirects to /dashboard or /login)
├── (auth)/
│   ├── login/page.tsx        → "/login"
│   └── signup/page.tsx       → "/signup"
├── (dashboard)/              → "/" (UNUSED NOW - can be removed)
│   ├── layout.tsx
│   └── page.tsx
└── dashboard/                → "/dashboard" (NEW - actual dashboard)
    ├── layout.tsx
    ├── page.tsx
    └── error.tsx
```

**Next Steps**
The old `(dashboard)` route group can be safely deleted since it's no longer used.

## Outcome

- ✅ Impact: Dashboard now accessible at `/dashboard` route after authentication
- 🧪 Tests: Login flow tested - redirect works correctly
- 📁 Files: 3 files created (dashboard route)
- 🔁 Next prompts: Test complete task CRUD flow, verify backend integration
- 🧠 Reflection: Next.js route groups are for organization only, not URL structure; explicit routes needed for navigation targets

## Evaluation notes (flywheel)

- Failure modes observed:
  - Misunderstanding of Next.js route group behavior (parentheses don't create URL segments)
  - Circular redirect pattern not caught during development
- Graders run and results (PASS/FAIL):
  - Route creation: PASS
  - Authentication check: PASS
  - Layout rendering: PASS
- Prompt variant (if applicable): N/A
- Next experiment (smallest change to try): Add route structure diagram to CLAUDE.md to prevent similar issues
