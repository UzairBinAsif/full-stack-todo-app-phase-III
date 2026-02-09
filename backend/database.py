"""Database configuration and session management for Neon PostgreSQL."""

from sqlmodel import SQLModel
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
from typing import AsyncGenerator

from core.config import settings


def get_asyncpg_url(url: str) -> str:
    """Convert sslmode to ssl for asyncpg compatibility."""
    # asyncpg uses 'ssl' instead of 'sslmode'
    return url.replace("sslmode=", "ssl=")


# Async engine for Neon PostgreSQL
async_engine = create_async_engine(
    get_asyncpg_url(settings.DATABASE_URL),
    echo=settings.ENVIRONMENT == "development",
    pool_pre_ping=True,
    pool_size=5,
    max_overflow=10,
)

# Async session factory
async_session_maker = sessionmaker(
    async_engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Dependency: yield async database session."""
    async with async_session_maker() as session:
        try:
            yield session
        finally:
            await session.close()


async def create_db_tables():
    """Create all tables on startup (development only)."""
    async with async_engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)
