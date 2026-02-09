"""Better Auth session token verification."""

import asyncio
from typing import Optional, Dict, Any
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text


class SessionError(Exception):
    """Session validation error."""
    pass


async def verify_session_token(token: str, db: AsyncSession) -> Optional[str]:
    """
    Verify Better Auth session token against database.

    Args:
        token: Session token from Better Auth
        db: Database session

    Returns:
        User ID if session is valid, None otherwise

    Raises:
        SessionError: If session is invalid or expired
    """
    import logging
    logger = logging.getLogger(__name__)

    try:
        # Query session table for this token
        query = text("""
            SELECT "userId", "expiresAt"
            FROM session
            WHERE token = :token
        """)

        result = await db.execute(query, {"token": token})
        row = result.fetchone()

        if not row:
            logger.warning(f"Session not found for token: {token[:20]}...")
            raise SessionError("Session not found")

        user_id, expires_at = row
        logger.debug(f"Found session for user: {user_id}, expires: {expires_at}")

        # Check if session has expired
        # Handle both timezone-aware and naive datetimes
        now = datetime.now(timezone.utc)

        # If expires_at is naive, make it timezone-aware (assume UTC)
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)

        if expires_at < now:
            logger.warning(f"Session expired: {expires_at} < {now}")
            raise SessionError("Session expired")

        logger.info(f"Session validated successfully for user: {user_id}")
        return user_id

    except Exception as e:
        if isinstance(e, SessionError):
            raise
        logger.error(f"Session validation error: {str(e)}")
        raise SessionError(f"Session validation failed: {str(e)}")
