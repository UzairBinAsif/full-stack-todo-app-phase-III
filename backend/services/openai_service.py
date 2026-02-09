"""OpenAI integration service for chat functionality with tool calling."""

import json
import logging
from typing import List, Optional, Tuple
from openai import AsyncOpenAI
from openai.types.chat import ChatCompletionMessageParam
from sqlalchemy.ext.asyncio import AsyncSession

from core.config import settings
from models import Message, MessageRole
from .tools import TASK_TOOLS, execute_tool

logger = logging.getLogger(__name__)

# Initialize async OpenAI client
_client: Optional[AsyncOpenAI] = None

# System prompt for the todo assistant
SYSTEM_PROMPT = """You are a helpful assistant for a todo/task management application. You can help users manage their tasks by:

- Creating new tasks
- Listing their existing tasks
- Marking tasks as completed
- Deleting tasks
- Updating task titles or descriptions

When a user asks you to perform any task-related action, use the appropriate tool to do it.
Be concise and helpful. After performing an action, confirm what you did.

If a user asks about something unrelated to task management, you can still help with general questions, but remind them that your primary function is task management."""


def get_openai_client() -> AsyncOpenAI:
    """Get or create OpenAI async client."""
    global _client
    if _client is None:
        if not settings.OPENAI_API_KEY:
            raise ValueError("OPENAI_API_KEY is not configured")
        _client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
    return _client


def build_messages(
    message_history: List[Message],
    current_message: str,
    system_prompt: Optional[str] = None,
) -> List[ChatCompletionMessageParam]:
    """
    Build OpenAI message format from conversation history.

    Args:
        message_history: Previous messages from database
        current_message: The new user message
        system_prompt: Optional system prompt

    Returns:
        List of messages in OpenAI format
    """
    messages: List[ChatCompletionMessageParam] = []

    # Add system prompt
    messages.append({
        "role": "system",
        "content": system_prompt or SYSTEM_PROMPT
    })

    # Add conversation history
    for msg in message_history:
        role = "user" if msg.role == MessageRole.USER else "assistant"
        messages.append({"role": role, "content": msg.content})

    # Add current message
    messages.append({"role": "user", "content": current_message})

    return messages


async def generate_chat_response(
    message_history: List[Message],
    current_message: str,
    user_id: str,
    db: AsyncSession,
    system_prompt: Optional[str] = None,
) -> Tuple[str, List[dict]]:
    """
    Generate a chat response using OpenAI with tool calling support.

    Args:
        message_history: Previous messages from database
        current_message: The new user message
        user_id: Current user's ID for tool execution
        db: Database session for tool execution
        system_prompt: Optional system prompt override

    Returns:
        Tuple of (assistant's response text, list of tool calls made)

    Raises:
        Exception: If OpenAI API call fails
    """
    client = get_openai_client()
    messages = build_messages(message_history, current_message, system_prompt)
    tool_calls_made = []

    logger.debug(f"Sending {len(messages)} messages to OpenAI model {settings.OPENAI_MODEL}")

    try:
        # First API call with tools
        response = await client.chat.completions.create(
            model=settings.OPENAI_MODEL,
            messages=messages,
            tools=TASK_TOOLS,
            tool_choice="auto",
            max_tokens=1024,
            temperature=0.7,
        )

        response_message = response.choices[0].message

        # Check if the model wants to call tools
        if response_message.tool_calls:
            logger.info(f"Model requested {len(response_message.tool_calls)} tool call(s)")

            # Add assistant's response with tool calls to messages
            messages.append({
                "role": "assistant",
                "content": response_message.content,
                "tool_calls": [
                    {
                        "id": tc.id,
                        "type": "function",
                        "function": {
                            "name": tc.function.name,
                            "arguments": tc.function.arguments,
                        }
                    }
                    for tc in response_message.tool_calls
                ]
            })

            # Execute each tool call
            for tool_call in response_message.tool_calls:
                function_name = tool_call.function.name
                function_args = json.loads(tool_call.function.arguments)

                logger.info(f"Executing tool: {function_name}")

                # Execute the tool
                result = await execute_tool(
                    tool_name=function_name,
                    arguments=function_args,
                    user_id=user_id,
                    db=db,
                )

                tool_calls_made.append({
                    "name": function_name,
                    "arguments": function_args,
                    "result": result,
                })

                # Add tool result to messages
                messages.append({
                    "role": "tool",
                    "tool_call_id": tool_call.id,
                    "content": json.dumps(result),
                })

            # Second API call to get final response after tool execution
            final_response = await client.chat.completions.create(
                model=settings.OPENAI_MODEL,
                messages=messages,
                max_tokens=1024,
                temperature=0.7,
            )

            assistant_message = final_response.choices[0].message.content
        else:
            # No tool calls, use the direct response
            assistant_message = response_message.content

        if assistant_message is None:
            assistant_message = "I apologize, but I couldn't generate a response."

        logger.debug(f"Received response: {len(assistant_message)} chars, {len(tool_calls_made)} tool calls")
        return assistant_message, tool_calls_made

    except Exception as e:
        logger.error(f"OpenAI API error: {str(e)}", exc_info=True)
        raise
