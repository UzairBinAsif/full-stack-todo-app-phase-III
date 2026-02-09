# Research: Backend API for Todo Application

**Feature**: 002-backend-api-spec
**Date**: 2026-02-07

---

## Technology Decisions

### 1. Async Database Driver

**Decision**: Use `asyncpg` with SQLAlchemy async engine

**Rationale**:
- Native PostgreSQL async driver (fastest option)
- Full compatibility with SQLModel and SQLAlchemy 2.0
- Required for Neon serverless connection pooling

**Alternatives Considered**:
- `psycopg3` async: Good but asyncpg has better performance benchmarks
- Sync `psycopg2`: Would block event loop, not suitable for FastAPI async

---

### 2. JWT Library

**Decision**: Use `PyJWT` for token verification

**Rationale**:
- Industry standard, well-maintained
- Simple API for decode/verify operations
- Direct support for HS256 algorithm (Better Auth default)
- No need for token creation (frontend handles that)

**Alternatives Considered**:
- `python-jose`: More features but overkill for verify-only use case
- `authlib`: Full OAuth library, unnecessary complexity

---

### 3. Configuration Management

**Decision**: Use `pydantic-settings` for environment configuration

**Rationale**:
- Native Pydantic v2 integration
- Type-safe settings with validation
- Automatic .env file loading
- Clear error messages for missing required vars

**Alternatives Considered**:
- `python-dotenv` alone: No type validation
- Raw `os.environ`: No structure or validation

---

### 4. Database Session Pattern

**Decision**: Async generator dependency with context manager

**Rationale**:
- Clean resource management (auto-close)
- Works with FastAPI dependency injection
- Proper transaction handling

**Code Pattern**:
```python
async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with async_session_maker() as session:
        try:
            yield session
        finally:
            await session.close()
```

---

### 5. Authentication Scheme

**Decision**: HTTPBearer security scheme (not OAuth2PasswordBearer)

**Rationale**:
- Frontend (Better Auth) handles login, we only verify tokens
- HTTPBearer correctly represents our use case
- Better Swagger UI experience for testing

**Alternatives Considered**:
- OAuth2PasswordBearer: Implies we handle login (we don't)
- API Key: Less secure, not JWT-based

---

### 6. User ID Extraction from JWT

**Decision**: Extract from `sub` claim

**Rationale**:
- Better Auth stores user ID in standard `sub` (subject) claim
- JWT RFC 7519 standard practice
- Consistent with OAuth2/OIDC conventions

**Token Structure** (from Better Auth):
```json
{
  "sub": "user_id_here",
  "email": "user@example.com",
  "exp": 1234567890,
  "iat": 1234567890
}
```

---

### 7. Ownership Verification Pattern

**Decision**: Two-layer verification (path + query)

**Rationale**:
- First: Verify path `user_id` matches token `user_id` (403 if mismatch)
- Second: All DB queries filter by `user_id` (404 if task not found)
- Defense in depth: prevents IDOR even if first check bypassed

---

## Best Practices Applied

### FastAPI 2025 Patterns

1. **Annotated dependencies**: Use `Annotated[T, Depends(...)]` over old syntax
2. **Lifespan context manager**: Replace deprecated `on_startup`/`on_shutdown`
3. **Pydantic v2 ConfigDict**: Use `model_config` not `class Config`
4. **Type hints everywhere**: Enable strict mypy checking

### SQLModel 2025 Patterns

1. **Optional primary key**: `Optional[int] = Field(default=None, primary_key=True)`
2. **Explicit table=True**: Class must declare `table=True` for DB mapping
3. **Use SQLAlchemy select()**: Not deprecated `.query()` pattern

### Security Best Practices

1. **Never log tokens**: Only log user IDs, never credentials
2. **Constant-time comparison**: JWT library handles this internally
3. **Required claims**: Enforce `exp` and `sub` presence in tokens
4. **CORS allowlist**: Explicit origins, not `*`

---

## Resolved Clarifications

| Question | Resolution | Source |
|----------|------------|--------|
| JWT algorithm? | HS256 (Better Auth default) | Better Auth docs |
| User ID claim location? | `sub` claim | JWT standard + Better Auth |
| Database connection type? | Async with pooling | Neon serverless requirements |
| Token validation library? | PyJWT | Industry standard |
| Session management? | None (stateless JWT) | Spec requirement |
