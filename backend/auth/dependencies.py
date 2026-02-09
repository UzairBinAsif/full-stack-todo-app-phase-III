"""Authentication dependencies for FastAPI."""

from typing import Annotated
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession

from auth.jwt import (
    get_user_id_from_token,
    TokenExpiredError,
    InvalidTokenError,
)
from auth.session import verify_session_token, SessionError
from database import get_db

# Security scheme for Swagger UI
security = HTTPBearer(
    scheme_name="Bearer Token",
    description="Enter your session token from Better Auth"
)


async def get_current_user(
    credentials: Annotated[
        HTTPAuthorizationCredentials,
        Depends(security)
    ],
    db: Annotated[AsyncSession, Depends(get_db)]
) -> str:
    """
    Dependency: Extract and validate user_id from Better Auth session token.

    Tries session token verification first (for Better Auth tokens),
    falls back to JWT verification for backwards compatibility.

    Returns:
        User ID from token

    Raises:
        HTTPException 401: If token missing, expired, or invalid
    """
    import logging
    logger = logging.getLogger(__name__)

    token = credentials.credentials
    logger.debug(f"Authenticating token: {token[:20]}... (has dots: {'.' in token})")

    # First try: Better Auth session token (no dots, just a random string)
    if '.' not in token:
        try:
            logger.debug("Attempting session token verification...")
            user_id = await verify_session_token(token, db)
            if user_id:
                logger.info(f"Session authentication successful for user: {user_id}")
                return user_id
        except SessionError as e:
            logger.warning(f"Session authentication failed: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Invalid session: {str(e)}",
                headers={"WWW-Authenticate": "Bearer"},
            )

    # Second try: JWT token (has dots like header.payload.signature)
    logger.debug("Attempting JWT token verification...")
    try:
        user_id = get_user_id_from_token(token)
        logger.info(f"JWT authentication successful for user: {user_id}")
        return user_id
    except TokenExpiredError:
        logger.warning("JWT token expired")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except InvalidTokenError as e:
        logger.warning(f"JWT authentication failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid token: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )


def verify_user_ownership(
    path_user_id: str,
    current_user_id: str,
) -> None:
    """
    Verify that path user_id matches authenticated user.

    Args:
        path_user_id: User ID from URL path
        current_user_id: User ID from JWT token

    Raises:
        HTTPException 403: If user_ids don't match
    """
    if path_user_id != current_user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: Cannot access other user's resources",
        )


# Type alias for cleaner route signatures
CurrentUser = Annotated[str, Depends(get_current_user)]
