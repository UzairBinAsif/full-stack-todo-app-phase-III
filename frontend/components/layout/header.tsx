"use client"

import { CheckSquare } from "lucide-react"
import { ThemeToggle } from "./theme-toggle"
import { UserDropdown } from "@/components/auth/user-dropdown"
import { MobileNav } from "./mobile-nav"

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center px-4 md:px-6">
        <MobileNav />

        <div className="flex items-center gap-2">
          <CheckSquare className="h-6 w-6 text-primary" />
          <span className="font-semibold text-lg hidden sm:inline-block">TaskFlow</span>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />
          <UserDropdown />
        </div>
      </div>
    </header>
  )
}
