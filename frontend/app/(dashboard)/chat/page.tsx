"use client"

import { useEffect, useState } from "react"
import { useSession } from "@/lib/auth-client"
import { ChatContainer } from "@/components/chat/chat-container"
import { Loader2 } from "lucide-react"

const STORAGE_KEY = "chatConversationId"

export default function ChatPage() {
  const { data: session, isPending } = useSession()
  const [conversationId, setConversationId] = useState<number | null>(null)
  const [isHydrated, setIsHydrated] = useState(false)

  // Hydrate conversation ID from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const parsed = parseInt(stored, 10)
      if (!isNaN(parsed)) {
        setConversationId(parsed)
      }
    }
    setIsHydrated(true)
  }, [])

  // Persist conversation ID to localStorage
  useEffect(() => {
    if (conversationId && isHydrated) {
      localStorage.setItem(STORAGE_KEY, String(conversationId))
    }
  }, [conversationId, isHydrated])

  // Handle new conversation creation
  const handleConversationCreated = (id: number) => {
    setConversationId(id)
  }

  // Clear conversation (start fresh)
  const handleNewConversation = () => {
    localStorage.removeItem(STORAGE_KEY)
    setConversationId(null)
  }

  if (isPending || !isHydrated) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-8rem)]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!session?.user) {
    return null // Layout handles redirect
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Chat with AI Assistant</h1>
        {conversationId && (
          <button
            onClick={handleNewConversation}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Start new conversation
          </button>
        )}
      </div>
      <ChatContainer
        userId={session.user.id}
        conversationId={conversationId}
        onConversationCreated={handleConversationCreated}
      />
    </div>
  )
}
