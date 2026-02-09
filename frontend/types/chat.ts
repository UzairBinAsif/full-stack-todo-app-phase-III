/**
 * Chat type definitions for Phase III chatbot integration.
 */

export interface ChatMessage {
  role: "user" | "assistant"
  content: string
}

export interface ChatRequest {
  conversation_id?: number
  message: string
}

export interface ToolCallMetadata {
  tool: string
  arguments: Record<string, unknown>
  result: string
}

export interface ChatResponse {
  conversation_id: number
  response: string
  tool_calls: ToolCallMetadata[]
}
