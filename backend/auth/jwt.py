"""JWT token verification using PyJWT."""

import jwt
from typing import Any, Dict

from core.config import settings


class JWTError(Exception):
    """Base JWT error."""
    pass


class TokenExpiredError(JWTError):
    """Token has expired."""
    pass


class InvalidTokenError(JWTError):
    """Token is invalid or malformed."""
    pass


def decode_token(token: str) -> Dict[str, Any]:
    """
    Decode and verify JWT token.

    Args:
        token: JWT token string (without 'Bearer ' prefix)

    Returns:
        Decoded payload dictionary

    Raises:
        TokenExpiredError: If token has expired
        InvalidTokenError: If token is invalid
    """
    try:
        # Debug logging
        import logging
        logger = logging.getLogger(__name__)
        logger.debug(f"Decoding token (first 20 chars): {token[:20]}...")
        logger.debug(f"Using secret: {settings.BETTER_AUTH_SECRET[:10]}...")

        payload = jwt.decode(
            token,
            settings.BETTER_AUTH_SECRET,
            algorithms=[settings.JWT_ALGORITHM],
            options={
                "verify_signature": True,
                "verify_exp": True,
                "verify_iss": False,  # Don't require issuer
                "verify_aud": False,  # Don't require audience
            }
        )
        logger.debug(f"Token decoded successfully. Payload keys: {list(payload.keys())}")
        return payload
    except jwt.ExpiredSignatureError:
        raise TokenExpiredError("Token has expired")
    except jwt.InvalidTokenError as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"JWT decode error: {str(e)}")
        raise InvalidTokenError(f"Invalid token: {str(e)}")


def get_user_id_from_token(token: str) -> str:
    """
    Extract user_id from JWT token.

    Better Auth stores user ID in 'sub' claim.

    Args:
        token: JWT token string

    Returns:
        User ID string

    Raises:
        InvalidTokenError: If user_id not found in token
    """
    payload = decode_token(token)
    # Better Auth may use 'sub' or 'userId' - check both
    user_id = payload.get("sub") or payload.get("userId") or payload.get("id")
    if not user_id:
        raise InvalidTokenError("Token missing user identifier")
    return user_id
