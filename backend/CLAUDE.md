# Backend Development Guidelines

## Tech Stack

- **Framework**: FastAPI 0.115+
- **ORM**: SQLModel (SQLAlchemy + Pydantic)
- **Database**: Neon Serverless PostgreSQL (asyncpg)
- **Auth**: PyJWT for JWT verification
- **Config**: pydantic-settings

## Project Structure

```
backend/
├── main.py              # FastAPI app entry point
├── database.py          # Async engine and session
├── models.py            # SQLModel Task model
├── auth/
│   ├── jwt.py           # JWT decode/verify
│   └── dependencies.py  # get_current_user, verify_ownership
├── routes/
│   └── tasks.py         # Task CRUD endpoints
├── schemas/
│   └── task.py          # Pydantic request/response models
└── core/
    └── config.py        # Settings class
```

## Running Locally

```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set environment variables (copy from .env.example)
cp .env.example .env
# Edit .env with your values

# Run development server
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

## API Endpoints

All endpoints require Bearer token authentication.

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/{user_id}/tasks | List tasks |
| POST | /api/{user_id}/tasks | Create task |
| GET | /api/{user_id}/tasks/{id} | Get task |
| PUT | /api/{user_id}/tasks/{id} | Update task |
| DELETE | /api/{user_id}/tasks/{id} | Delete task |
| PATCH | /api/{user_id}/tasks/{id}/complete | Toggle completion |

## Authentication

- All routes use `CurrentUser` dependency which extracts user_id from JWT
- JWT must be signed with `BETTER_AUTH_SECRET` (shared with frontend)
- 401 returned for missing/invalid/expired tokens
- 403 returned if path user_id doesn't match token user_id

## Adding New Endpoints

1. Define Pydantic schemas in `schemas/`
2. Add route in `routes/tasks.py` (or new router file)
3. Use `CurrentUser` dependency for authentication
4. Call `verify_user_ownership()` to check path matches token
5. Filter all queries by `user_id`

## Environment Variables

- `DATABASE_URL`: PostgreSQL connection string (with `postgresql+asyncpg://` prefix)
- `BETTER_AUTH_SECRET`: JWT signing secret (must match frontend)
- `ENVIRONMENT`: development or production
- `CORS_ORIGINS`: Comma-separated allowed origins

## Docker

```bash
# Build image
docker build -t todo-api .

# Run container
docker run -p 8000:8000 --env-file .env todo-api
```
