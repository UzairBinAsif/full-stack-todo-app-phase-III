"""Task API routes with user isolation."""

from typing import Annotated, List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select
from datetime import datetime, timezone

from database import get_db
from models import Task
from schemas.task import (
    CreateTask,
    UpdateTask,
    TaskResponse,
    TaskStatus,
    TaskSort,
)
from auth.dependencies import CurrentUser, verify_user_ownership

router = APIRouter(prefix="/api", tags=["tasks"])


@router.get(
    "/{user_id}/tasks",
    response_model=List[TaskResponse],
    summary="List user's tasks",
)
async def list_tasks(
    user_id: str,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
    status: TaskStatus = Query(default=TaskStatus.ALL),
    sort: TaskSort = Query(default=TaskSort.CREATED),
):
    """Get all tasks for authenticated user with optional filtering."""
    verify_user_ownership(user_id, current_user)

    query = select(Task).where(Task.user_id == current_user)

    # Apply status filter
    if status == TaskStatus.COMPLETED:
        query = query.where(Task.completed == True)
    elif status == TaskStatus.PENDING:
        query = query.where(Task.completed == False)

    # Apply sorting
    if sort == TaskSort.TITLE:
        query = query.order_by(Task.title)
    else:
        query = query.order_by(Task.created_at.desc())

    result = await db.execute(query)
    return result.scalars().all()


@router.post(
    "/{user_id}/tasks",
    response_model=TaskResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create new task",
)
async def create_task(
    user_id: str,
    task_data: CreateTask,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Create a new task for authenticated user."""
    import logging
    logger = logging.getLogger(__name__)

    logger.info(f"Creating task for user {current_user}: {task_data.title}")
    verify_user_ownership(user_id, current_user)

    try:
        task = Task(
            user_id=current_user,
            title=task_data.title,
            description=task_data.description,
        )

        db.add(task)
        await db.commit()
        await db.refresh(task)

        logger.info(f"Task created successfully with ID: {task.id}")
        return task
    except Exception as e:
        logger.error(f"Failed to create task: {str(e)}", exc_info=True)
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create task: {str(e)}"
        )


@router.get(
    "/{user_id}/tasks/{task_id}",
    response_model=TaskResponse,
    summary="Get single task",
)
async def get_task(
    user_id: str,
    task_id: int,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Get a specific task by ID."""
    verify_user_ownership(user_id, current_user)

    query = select(Task).where(
        Task.id == task_id,
        Task.user_id == current_user,
    )
    result = await db.execute(query)
    task = result.scalar_one_or_none()

    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Task {task_id} not found",
        )

    return task


@router.put(
    "/{user_id}/tasks/{task_id}",
    response_model=TaskResponse,
    summary="Update task",
)
async def update_task(
    user_id: str,
    task_id: int,
    task_data: UpdateTask,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Update an existing task."""
    verify_user_ownership(user_id, current_user)

    query = select(Task).where(
        Task.id == task_id,
        Task.user_id == current_user,
    )
    result = await db.execute(query)
    task = result.scalar_one_or_none()

    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Task {task_id} not found",
        )

    # Update only provided fields
    update_data = task_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(task, field, value)

    task.updated_at = datetime.now(timezone.utc).replace(tzinfo=None)

    await db.commit()
    await db.refresh(task)

    return task


@router.delete(
    "/{user_id}/tasks/{task_id}",
    status_code=status.HTTP_200_OK,
    summary="Delete task",
)
async def delete_task(
    user_id: str,
    task_id: int,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Delete a task permanently."""
    verify_user_ownership(user_id, current_user)

    query = select(Task).where(
        Task.id == task_id,
        Task.user_id == current_user,
    )
    result = await db.execute(query)
    task = result.scalar_one_or_none()

    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Task {task_id} not found",
        )

    await db.delete(task)
    await db.commit()

    return {"message": "Task deleted successfully"}


@router.patch(
    "/{user_id}/tasks/{task_id}/complete",
    response_model=TaskResponse,
    summary="Toggle task completion",
)
async def toggle_complete(
    user_id: str,
    task_id: int,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Toggle the completed status of a task."""
    verify_user_ownership(user_id, current_user)

    query = select(Task).where(
        Task.id == task_id,
        Task.user_id == current_user,
    )
    result = await db.execute(query)
    task = result.scalar_one_or_none()

    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Task {task_id} not found",
        )

    task.completed = not task.completed
    task.updated_at = datetime.now(timezone.utc).replace(tzinfo=None)

    await db.commit()
    await db.refresh(task)

    return task
