"""Chat API routes with stateless conversation management."""

import logging
from typing import Annotated, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select
from datetime import datetime, timezone

from database import get_db
from models import Conversation, Message, MessageRole
from schemas.chat import ChatRequest, ChatResponse, ToolCallMetadata
from auth.dependencies import CurrentUser, verify_user_ownership
from services.openai_service import generate_chat_response

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["chat"])


@router.post(
    "/{user_id}/chat",
    response_model=ChatResponse,
    summary="Process chat message",
    description="Handle user chat message with stateless conversation management",
)
async def chat(
    user_id: str,
    request: ChatRequest,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
) -> ChatResponse:
    """
    Process a chat message.

    Flow:
    1. Verify user ownership
    2. Get or create conversation
    3. Load full message history (stateless)
    4. Store user message
    5. [PLACEHOLDER] Generate response via external handler
    6. Store assistant response
    7. Return structured response
    """
    # Step 1: Verify user_id from path matches token
    verify_user_ownership(user_id, current_user)

    try:
        # Step 2: Get or create conversation
        conversation: Conversation
        if request.conversation_id:
            # Fetch existing conversation with ownership check
            result = await db.execute(
                select(Conversation).where(
                    Conversation.id == request.conversation_id,
                    Conversation.user_id == current_user
                )
            )
            conversation = result.scalar_one_or_none()
            if not conversation:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Conversation not found"
                )
            logger.debug(f"Found existing conversation {conversation.id}")
        else:
            # Create new conversation
            conversation = Conversation(user_id=current_user)
            db.add(conversation)
            await db.commit()
            await db.refresh(conversation)
            logger.info(f"Created new conversation {conversation.id} for user {current_user}")

        # Step 3: Load full message history (STATELESS - always from DB)
        history_result = await db.execute(
            select(Message)
            .where(Message.conversation_id == conversation.id)
            .order_by(Message.created_at.asc())
        )
        message_history = history_result.scalars().all()
        # Full history loaded for stateless operation
        logger.debug(f"Loaded {len(message_history)} messages for conversation {conversation.id}")

        # Step 4: Store user message
        user_message = Message(
            conversation_id=conversation.id,
            user_id=current_user,
            role=MessageRole.USER,
            content=request.message,
        )
        db.add(user_message)
        await db.commit()

        # Step 5: Generate response using OpenAI with tool calling
        tool_calls: List[ToolCallMetadata] = []
        try:
            assistant_text, tool_calls_data = await generate_chat_response(
                message_history=list(message_history),
                current_message=request.message,
                user_id=current_user,
                db=db,
            )
            # Convert tool calls to response format
            tool_calls = [
                ToolCallMetadata(
                    name=tc["name"],
                    arguments=tc["arguments"],
                    result=tc["result"],
                )
                for tc in tool_calls_data
            ]
        except Exception as e:
            logger.error(f"Failed to generate AI response: {str(e)}")
            assistant_text = "I'm sorry, I'm having trouble processing your request right now. Please try again later."

        # Step 6: Store assistant response
        assistant_message = Message(
            conversation_id=conversation.id,
            user_id=current_user,
            role=MessageRole.ASSISTANT,
            content=assistant_text,
        )
        db.add(assistant_message)

        # Update conversation timestamp
        conversation.updated_at = datetime.now(timezone.utc).replace(tzinfo=None)
        db.add(conversation)
        await db.commit()

        logger.info(f"Chat completed for conversation {conversation.id}")

        # Step 7: Return response
        return ChatResponse(
            conversation_id=conversation.id,
            response=assistant_text,
            tool_calls=tool_calls,
        )

    except HTTPException:
        # Re-raise HTTP exceptions (like 404)
        raise
    except Exception as e:
        logger.error(f"Error in chat endpoint: {str(e)}", exc_info=True)
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )
