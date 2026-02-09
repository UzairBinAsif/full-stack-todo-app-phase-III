/**
 * Chat API client for Phase III chatbot integration.
 */

import { authClient } from "./auth-client"
import { ApiError } from "./api"
import type { ChatRequest, ChatResponse } from "@/types/chat"

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

export const chatApi = {
  /**
   * Send a chat message to the backend.
   * Creates a new conversation if conversation_id is not provided.
   */
  sendMessage: async (
    userId: string,
    request: ChatRequest
  ): Promise<ChatResponse> => {
    const session = await authClient.getSession()

    if (!session?.data?.session) {
      throw new ApiError(401, "Not authenticated")
    }

    const token = session.data.session.token

    const response = await fetch(`${API_BASE}/api/${userId}/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(request),
    })

    if (response.status === 401) {
      await authClient.signOut()
      if (typeof window !== "undefined") {
        window.location.href = "/login"
      }
      throw new ApiError(401, "Session expired")
    }

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ error: "Request failed" }))
      throw new ApiError(
        response.status,
        error.error || error.detail || "Request failed"
      )
    }

    return response.json()
  },
}
