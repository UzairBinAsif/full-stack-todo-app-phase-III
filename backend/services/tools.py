"""Tool definitions and executor for AI function calling."""

import json
import logging
from typing import Any, Dict, List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select
from datetime import datetime, timezone

from models import Task

logger = logging.getLogger(__name__)

# Define available tools for OpenAI function calling
TASK_TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "create_task",
            "description": "Create a new task in the user's todo list",
            "parameters": {
                "type": "object",
                "properties": {
                    "title": {
                        "type": "string",
                        "description": "The title of the task (required, 1-200 characters)"
                    },
                    "description": {
                        "type": "string",
                        "description": "Optional description for the task"
                    }
                },
                "required": ["title"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "list_tasks",
            "description": "Get all tasks from the user's todo list",
            "parameters": {
                "type": "object",
                "properties": {
                    "status": {
                        "type": "string",
                        "enum": ["all", "pending", "completed"],
                        "description": "Filter tasks by status (default: all)"
                    }
                },
                "required": []
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "set_task_status",
            "description": "Mark a task as completed or not completed. You can identify the task by ID or by title.",
            "parameters": {
                "type": "object",
                "properties": {
                    "task_id": {
                        "type": "integer",
                        "description": "The ID of the task"
                    },
                    "title": {
                        "type": "string",
                        "description": "The title (or partial title) of the task"
                    },
                    "completed": {
                        "type": "boolean",
                        "description": "Set to true to mark as completed, false to mark as not completed"
                    }
                },
                "required": ["completed"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "delete_task",
            "description": "Delete a task from the todo list. You can identify the task by ID or by title.",
            "parameters": {
                "type": "object",
                "properties": {
                    "task_id": {
                        "type": "integer",
                        "description": "The ID of the task to delete"
                    },
                    "title": {
                        "type": "string",
                        "description": "The title (or partial title) of the task to delete"
                    }
                },
                "required": []
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "update_task",
            "description": "Update a task's title or description. You can identify the task by ID or by current title.",
            "parameters": {
                "type": "object",
                "properties": {
                    "task_id": {
                        "type": "integer",
                        "description": "The ID of the task to update"
                    },
                    "current_title": {
                        "type": "string",
                        "description": "The current title (or partial title) of the task to update"
                    },
                    "new_title": {
                        "type": "string",
                        "description": "New title for the task"
                    },
                    "description": {
                        "type": "string",
                        "description": "New description for the task"
                    }
                },
                "required": []
            }
        }
    }
]


async def execute_tool(
    tool_name: str,
    arguments: Dict[str, Any],
    user_id: str,
    db: AsyncSession,
) -> Dict[str, Any]:
    """
    Execute a tool and return the result.

    Args:
        tool_name: Name of the tool to execute
        arguments: Tool arguments
        user_id: Current user's ID for ownership
        db: Database session

    Returns:
        Tool execution result
    """
    logger.info(f"Executing tool: {tool_name} with args: {arguments}")

    try:
        if tool_name == "create_task":
            return await _create_task(arguments, user_id, db)
        elif tool_name == "list_tasks":
            return await _list_tasks(arguments, user_id, db)
        elif tool_name == "set_task_status":
            return await _set_task_status(arguments, user_id, db)
        elif tool_name == "delete_task":
            return await _delete_task(arguments, user_id, db)
        elif tool_name == "update_task":
            return await _update_task(arguments, user_id, db)
        else:
            return {"error": f"Unknown tool: {tool_name}"}
    except Exception as e:
        logger.error(f"Tool execution error: {str(e)}", exc_info=True)
        return {"error": str(e)}


async def _create_task(args: Dict[str, Any], user_id: str, db: AsyncSession) -> Dict[str, Any]:
    """Create a new task."""
    title = args.get("title", "").strip()
    if not title:
        return {"error": "Task title is required"}

    if len(title) > 200:
        return {"error": "Task title must be 200 characters or less"}

    task = Task(
        user_id=user_id,
        title=title,
        description=args.get("description"),
    )

    db.add(task)
    await db.commit()
    await db.refresh(task)

    logger.info(f"Created task {task.id}: {task.title}")

    return {
        "success": True,
        "task": {
            "id": task.id,
            "title": task.title,
            "description": task.description,
            "completed": task.completed,
        },
        "message": f"Task '{task.title}' created successfully"
    }


async def _list_tasks(args: Dict[str, Any], user_id: str, db: AsyncSession) -> Dict[str, Any]:
    """List user's tasks."""
    status_filter = args.get("status", "all")

    query = select(Task).where(Task.user_id == user_id)

    if status_filter == "completed":
        query = query.where(Task.completed == True)
    elif status_filter == "pending":
        query = query.where(Task.completed == False)

    query = query.order_by(Task.created_at.desc())

    result = await db.execute(query)
    tasks = result.scalars().all()

    task_list = [
        {
            "id": t.id,
            "title": t.title,
            "description": t.description,
            "completed": t.completed,
        }
        for t in tasks
    ]

    return {
        "success": True,
        "tasks": task_list,
        "count": len(task_list),
        "message": f"Found {len(task_list)} task(s)"
    }


async def _find_task(
    user_id: str,
    db: AsyncSession,
    task_id: Optional[int] = None,
    title: Optional[str] = None,
) -> Optional[Task]:
    """Find a task by ID or title."""
    if task_id:
        result = await db.execute(
            select(Task).where(Task.id == task_id, Task.user_id == user_id)
        )
        return result.scalar_one_or_none()
    elif title:
        # Try exact match first
        result = await db.execute(
            select(Task).where(Task.title == title, Task.user_id == user_id)
        )
        task = result.scalar_one_or_none()
        if task:
            return task

        # Try case-insensitive partial match
        result = await db.execute(
            select(Task).where(
                Task.title.ilike(f"%{title}%"),
                Task.user_id == user_id
            )
        )
        tasks = result.scalars().all()
        if len(tasks) == 1:
            return tasks[0]
        elif len(tasks) > 1:
            # Return None but log that multiple matches found
            logger.warning(f"Multiple tasks match '{title}': {[t.title for t in tasks]}")
            return None
    return None


async def _set_task_status(args: Dict[str, Any], user_id: str, db: AsyncSession) -> Dict[str, Any]:
    """Set a task's completed status."""
    task_id = args.get("task_id")
    title = args.get("title")
    completed = args.get("completed")

    if not task_id and not title:
        return {"error": "Either task_id or title is required"}

    if completed is None:
        return {"error": "completed status is required (true or false)"}

    task = await _find_task(user_id, db, task_id=task_id, title=title)

    if not task:
        identifier = f"ID {task_id}" if task_id else f"'{title}'"
        return {"error": f"Task with {identifier} not found. Use list_tasks to see available tasks."}

    task.completed = completed
    task.updated_at = datetime.now(timezone.utc).replace(tzinfo=None)

    await db.commit()

    status_text = "completed" if completed else "not completed"
    return {
        "success": True,
        "task": {
            "id": task.id,
            "title": task.title,
            "completed": task.completed,
        },
        "message": f"Task '{task.title}' marked as {status_text}"
    }


async def _delete_task(args: Dict[str, Any], user_id: str, db: AsyncSession) -> Dict[str, Any]:
    """Delete a task."""
    task_id = args.get("task_id")
    title = args.get("title")

    if not task_id and not title:
        return {"error": "Either task_id or title is required"}

    task = await _find_task(user_id, db, task_id=task_id, title=title)

    if not task:
        identifier = f"ID {task_id}" if task_id else f"'{title}'"
        return {"error": f"Task with {identifier} not found. Use list_tasks to see available tasks."}

    task_title = task.title
    await db.delete(task)
    await db.commit()

    return {
        "success": True,
        "message": f"Task '{task_title}' deleted successfully"
    }


async def _update_task(args: Dict[str, Any], user_id: str, db: AsyncSession) -> Dict[str, Any]:
    """Update a task."""
    task_id = args.get("task_id")
    current_title = args.get("current_title")

    if not task_id and not current_title:
        return {"error": "Either task_id or current_title is required"}

    task = await _find_task(user_id, db, task_id=task_id, title=current_title)

    if not task:
        identifier = f"ID {task_id}" if task_id else f"'{current_title}'"
        return {"error": f"Task with {identifier} not found. Use list_tasks to see available tasks."}

    if "new_title" in args and args["new_title"]:
        task.title = args["new_title"].strip()
    if "description" in args:
        task.description = args["description"]

    task.updated_at = datetime.now(timezone.utc).replace(tzinfo=None)

    await db.commit()
    await db.refresh(task)

    return {
        "success": True,
        "task": {
            "id": task.id,
            "title": task.title,
            "description": task.description,
            "completed": task.completed,
        },
        "message": f"Task '{task.title}' updated successfully"
    }
