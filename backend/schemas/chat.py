"""Pydantic schemas for chat endpoint."""

from pydantic import BaseModel, Field, field_validator
from typing import Optional, List, Any


class ChatRequest(BaseModel):
    """Request schema for chat endpoint."""

    conversation_id: Optional[int] = Field(
        default=None,
        description="Existing conversation ID. If omitted, creates new conversation."
    )
    message: str = Field(
        ...,
        min_length=1,
        max_length=4000,
        description="User's natural language input"
    )

    @field_validator("message")
    @classmethod
    def validate_message(cls, v: str) -> str:
        """Strip whitespace and reject empty messages."""
        stripped = v.strip()
        if not stripped:
            raise ValueError("Message cannot be empty or whitespace only")
        return stripped


class ToolCallMetadata(BaseModel):
    """Metadata for tool calls made during response generation."""

    name: str = Field(..., description="Name of the tool/function called")
    arguments: dict[str, Any] = Field(..., description="Arguments passed to the tool")
    result: dict[str, Any] = Field(..., description="Result of the tool call")


class ChatResponse(BaseModel):
    """Response schema for chat endpoint."""

    conversation_id: int = Field(
        ...,
        description="The conversation ID (existing or newly created)"
    )
    response: str = Field(
        ...,
        description="Assistant's text reply"
    )
    tool_calls: List[ToolCallMetadata] = Field(
        default_factory=list,
        description="Metadata about any backend actions performed"
    )
