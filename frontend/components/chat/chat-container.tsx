"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { chatApi } from "@/lib/chat-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { Send, Loader2 } from "lucide-react"
import type { ChatMessage } from "@/types/chat"

interface ChatContainerProps {
  userId: string
  conversationId: number | null
  onConversationCreated: (id: number) => void
}

export function ChatContainer({
  userId,
  conversationId,
  onConversationCreated,
}: ChatContainerProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSend = useCallback(async () => {
    if (!input.trim() || isLoading) return

    const userMessage = input.trim()
    setInput("")
    setMessages((prev) => [...prev, { role: "user", content: userMessage }])
    setIsLoading(true)

    try {
      const response = await chatApi.sendMessage(userId, {
        conversation_id: conversationId ?? undefined,
        message: userMessage,
      })

      // Update conversation ID if new
      if (!conversationId) {
        onConversationCreated(response.conversation_id)
      }

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: response.response },
      ])
    } catch (error) {
      toast.error("Failed to send message")
      // Remove optimistic user message on error
      setMessages((prev) => prev.slice(0, -1))
    } finally {
      setIsLoading(false)
    }
  }, [input, isLoading, conversationId, userId, onConversationCreated])

  return (
    <div className="flex flex-col flex-1 border rounded-lg bg-card">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <p className="text-muted-foreground text-center py-8">
            Start a conversation with the AI assistant
          </p>
        )}
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] rounded-lg px-4 py-2 ${
                msg.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted"
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-muted rounded-lg px-4 py-2">
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="border-t p-4">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            handleSend()
          }}
          className="flex gap-2"
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button type="submit" disabled={isLoading || !input.trim()}>
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            <span className="sr-only">Send message</span>
          </Button>
        </form>
      </div>
    </div>
  )
}
