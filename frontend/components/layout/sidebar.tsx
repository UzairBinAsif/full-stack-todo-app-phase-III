"use client"

import { cn } from "@/lib/utils"
import { ListTodo, CheckCircle2, Circle, MessageSquare } from "lucide-react"
import Link from "next/link"
import { useSearchParams, usePathname } from "next/navigation"

const navItems = [
  { label: "All Tasks", icon: ListTodo, href: "/dashboard", filter: "all" },
  { label: "Pending", icon: Circle, href: "/dashboard?status=pending", filter: "pending" },
  { label: "Completed", icon: CheckCircle2, href: "/dashboard?status=completed", filter: "completed" },
]

const chatItem = { label: "Chat", icon: MessageSquare, href: "/chat" }

interface SidebarProps {
  onNavigate?: () => void
}

export function Sidebar({ onNavigate }: SidebarProps) {
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const currentStatus = searchParams.get("status")
  const currentFilter = searchParams.get("filter")

  const getIsActive = (item: typeof navItems[0]) => {
    if (item.filter === "completed") {
      return currentStatus === "completed"
    }
    if (item.filter === "pending") {
      return currentStatus === "pending"
    }
    return !currentStatus && !currentFilter
  }

  return (
    <nav className="flex flex-col gap-1 p-4">
      <div className="mb-2 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        Tasks
      </div>
      {navItems.map((item) => {
        const isActive = getIsActive(item)
        return (
          <Link
            key={item.label}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
              "hover:bg-accent hover:text-accent-foreground",
              isActive && "bg-accent text-accent-foreground font-medium"
            )}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </Link>
        )
      })}

      {/* Chat Section */}
      <div className="mt-6 mb-2 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        AI Assistant
      </div>
      <Link
        href={chatItem.href}
        onClick={onNavigate}
        className={cn(
          "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
          "hover:bg-accent hover:text-accent-foreground",
          pathname === "/chat" && "bg-accent text-accent-foreground font-medium"
        )}
      >
        <chatItem.icon className="h-4 w-4" />
        {chatItem.label}
      </Link>
    </nav>
  )
}
