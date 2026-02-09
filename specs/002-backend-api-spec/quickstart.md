# Quickstart: Backend API for Todo Application

**Feature**: 002-backend-api-spec
**Date**: 2026-02-07

---

## Prerequisites

- Python 3.11+
- Access to Neon PostgreSQL database
- Frontend running (for JWT tokens)

---

## Setup Steps

### 1. Create Backend Directory

```bash
cd todo-app-phsse-II
mkdir -p backend/{auth,schemas,routes,core,tests}
touch backend/{auth,schemas,routes,core,tests}/__init__.py
```

### 2. Create Virtual Environment

```bash
cd backend
python -m venv venv

# Activate (choose your OS)
source venv/bin/activate      # macOS/Linux
venv\Scripts\activate         # Windows
```

### 3. Install Dependencies

```bash
pip install fastapi uvicorn[standard] sqlmodel asyncpg pyjwt pydantic-settings python-dotenv
pip install httpx pytest pytest-asyncio  # Dev dependencies
```

### 4. Configure Environment

Create `backend/.env`:

```bash
# Copy from frontend and adapt
DATABASE_URL=postgresql+asyncpg://user:pass@host/dbname?sslmode=require
BETTER_AUTH_SECRET=<copy-from-frontend-.env>
ENVIRONMENT=development
CORS_ORIGINS=http://localhost:3000,http://localhost:3001
```

**Important**: The `DATABASE_URL` must use `postgresql+asyncpg://` prefix (not just `postgresql://`).

### 5. Run Development Server

```bash
cd backend
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### 6. Verify Installation

```bash
# Health check
curl http://localhost:8000/health
# Expected: {"status":"healthy","version":"1.0.0"}

# API docs
open http://localhost:8000/docs
```

---

## Testing with curl

### Get JWT Token

1. Start the frontend (`npm run dev` in /frontend)
2. Sign up / Sign in at http://localhost:3000
3. Open browser DevTools → Application → Cookies → Copy JWT token

### Test Endpoints

```bash
# Set your token
TOKEN="your-jwt-token-here"
USER_ID="your-user-id-from-token"

# List tasks
curl -X GET "http://localhost:8000/api/$USER_ID/tasks" \
  -H "Authorization: Bearer $TOKEN"

# Create task
curl -X POST "http://localhost:8000/api/$USER_ID/tasks" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"My first task","description":"Test description"}'

# Get single task
curl -X GET "http://localhost:8000/api/$USER_ID/tasks/1" \
  -H "Authorization: Bearer $TOKEN"

# Update task
curl -X PUT "http://localhost:8000/api/$USER_ID/tasks/1" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Updated title"}'

# Toggle completion
curl -X PATCH "http://localhost:8000/api/$USER_ID/tasks/1/complete" \
  -H "Authorization: Bearer $TOKEN"

# Delete task
curl -X DELETE "http://localhost:8000/api/$USER_ID/tasks/1" \
  -H "Authorization: Bearer $TOKEN"
```

---

## Project Structure

```
backend/
├── main.py              # FastAPI app + CORS + lifespan
├── database.py          # Async engine + session
├── models.py            # Task SQLModel
├── requirements.txt     # Dependencies
├── .env                 # Environment (gitignored)
├── .env.example         # Template
│
├── auth/
│   ├── __init__.py
│   ├── jwt.py           # Token decode/verify
│   └── dependencies.py  # get_current_user, verify_ownership
│
├── schemas/
│   ├── __init__.py
│   └── task.py          # CreateTask, UpdateTask, TaskResponse
│
├── routes/
│   ├── __init__.py
│   └── tasks.py         # All task endpoints
│
├── core/
│   ├── __init__.py
│   └── config.py        # Settings class
│
└── tests/
    └── ...              # Test files
```

---

## Common Issues

### 1. Database Connection Error

**Error**: `asyncpg.exceptions.InvalidCatalogNameError`

**Fix**: Ensure DATABASE_URL uses `postgresql+asyncpg://` prefix

### 2. JWT Decode Fails

**Error**: `InvalidTokenError: Invalid token`

**Fix**: Ensure BETTER_AUTH_SECRET matches frontend exactly

### 3. CORS Blocked

**Error**: Browser shows CORS error

**Fix**: Add your frontend URL to CORS_ORIGINS in .env

### 4. Tables Not Created

**Error**: `relation "tasks" does not exist`

**Fix**: Set `ENVIRONMENT=development` to auto-create tables on startup

---

## Next Steps

1. Run `/sp.tasks` to generate implementation tasks
2. Implement files in order: config → database → auth → schemas → routes → main
3. Test each endpoint manually before moving to next
4. Connect frontend to backend API
