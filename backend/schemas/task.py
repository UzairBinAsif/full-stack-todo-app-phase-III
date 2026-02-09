"""Pydantic schemas for Task API."""

from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime
from typing import Optional
from enum import Enum


class TaskStatus(str, Enum):
    """Task filter status options."""
    ALL = "all"
    PENDING = "pending"
    COMPLETED = "completed"


class TaskSort(str, Enum):
    """Task sort options."""
    CREATED = "created"
    TITLE = "title"


class CreateTask(BaseModel):
    """Schema for creating a new task."""

    title: str = Field(
        min_length=1,
        max_length=200,
        description="Task title (required, 1-200 characters)"
    )
    description: Optional[str] = Field(
        default=None,
        description="Optional task description"
    )

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "title": "Buy groceries",
                "description": "Milk, eggs, bread"
            }
        }
    )


class UpdateTask(BaseModel):
    """Schema for updating an existing task."""

    title: Optional[str] = Field(
        default=None,
        min_length=1,
        max_length=200,
        description="New title (1-200 characters)"
    )
    description: Optional[str] = Field(
        default=None,
        description="New description"
    )
    completed: Optional[bool] = Field(
        default=None,
        description="Completion status"
    )

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "title": "Buy groceries (updated)",
                "completed": True
            }
        }
    )


class TaskResponse(BaseModel):
    """Schema for task response."""

    id: int
    user_id: str
    title: str
    description: Optional[str]
    completed: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(
        from_attributes=True,
        json_schema_extra={
            "example": {
                "id": 1,
                "user_id": "user_abc123",
                "title": "Buy groceries",
                "description": "Milk, eggs, bread",
                "completed": False,
                "created_at": "2026-02-07T12:00:00Z",
                "updated_at": "2026-02-07T12:00:00Z"
            }
        }
    )
