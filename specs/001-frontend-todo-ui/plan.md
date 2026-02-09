# Implementation Plan: Professional Frontend Todo UI

**Branch**: `001-frontend-todo-ui` | **Date**: 2025-02-07 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-frontend-todo-ui/spec.md`

---

## Summary

Build a premium, production-ready Todo web application frontend using Next.js 16+ App Router, TypeScript, shadcn/ui + Tailwind CSS v4, TanStack Query, and Better Auth. The implementation focuses on creating a visually stunning, highly performant, fully accessible UI that rivals best-in-class SaaS products like Notion and Todoist.

---

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode), React 19+, Next.js 16+
**Primary Dependencies**: shadcn/ui, Tailwind CSS v4, TanStack Query v5, Better Auth, next-themes, Zod, react-hook-form, lucide-react, sonner
**Storage**: N/A (frontend consumes REST API)
**Testing**: Manual verification, Lighthouse audits, responsive testing
**Target Platform**: Web browsers (Chrome 90+, Firefox 90+, Safari 14+, Edge 90+)
**Project Type**: Web application (monorepo frontend)
**Performance Goals**: <3s page load on 3G, CLS <0.1, 90+ Lighthouse accessibility
**Constraints**: Mobile-first responsive (320px-2560px), WCAG AA compliance
**Scale/Scope**: Single-user dashboard, 100+ tasks without degradation

---

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Technology Stack | ✅ PASS | Next.js 16+, TypeScript strict, Tailwind CSS only, Server Components default |
| II. Security & Data Isolation | ✅ PASS | API client attaches JWT, handles 401 → logout |
| III. API Design | ✅ PASS | Frontend consumes defined endpoints via typed client |
| IV. Database Schema | N/A | Frontend only - no direct DB access |
| V. Code Quality | ✅ PASS | TypeScript strict, clean code patterns, error handling |
| VI. Scope Limitation | ✅ PASS | Task CRUD + auth only, no extra features |
| VII. Judging & Traceability | ✅ PASS | Spec → Plan → Tasks pipeline followed |

**All gates pass. No violations.**

---

## 1. Overall Architecture Overview

### High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              FRONTEND (Next.js 16+)                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                         PROVIDERS (Root)                            │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌────────────────────────┐    │   │
│  │  │ ThemeProvider│  │QueryProvider │  │  Better Auth Provider  │    │   │
│  │  │ (next-themes)│  │(TanStack)    │  │  (Session + JWT)       │    │   │
│  │  └──────────────┘  └──────────────┘  └────────────────────────┘    │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                        │
│  ┌─────────────────────────────────┴───────────────────────────────────┐   │
│  │                         LAYOUTS                                      │   │
│  │  ┌─────────────┐              ┌──────────────────────────────────┐  │   │
│  │  │ Auth Layout │              │        Dashboard Layout          │  │   │
│  │  │ (public)    │              │  ┌────────┐ ┌─────────────────┐  │  │   │
│  │  │             │              │  │ Header │ │    Sidebar      │  │  │   │
│  │  │ /login      │              │  └────────┘ │  (collapsible)  │  │  │   │
│  │  │ /signup     │              │             └─────────────────┘  │  │   │
│  │  └─────────────┘              │  ┌───────────────────────────┐   │  │   │
│  │                               │  │      Main Content         │   │  │   │
│  │                               │  │   (Task Dashboard)        │   │  │   │
│  │                               │  └───────────────────────────┘   │  │   │
│  │                               └──────────────────────────────────┘  │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                        │
│  ┌─────────────────────────────────┴───────────────────────────────────┐   │
│  │                         DATA LAYER                                   │   │
│  │                                                                      │   │
│  │  ┌──────────────────┐    ┌──────────────────┐    ┌───────────────┐  │   │
│  │  │   TanStack Query │───▶│   API Client     │───▶│ Better Auth   │  │   │
│  │  │   (Hooks)        │    │   (/lib/api.ts)  │    │ (JWT Token)   │  │   │
│  │  │                  │    │                  │    │               │  │   │
│  │  │  - useTasksQuery │    │  - getTasks()    │    │ getSession()  │  │   │
│  │  │  - useCreateTask │    │  - createTask()  │    │     ↓         │  │   │
│  │  │  - useUpdateTask │    │  - updateTask()  │    │ Bearer Token  │  │   │
│  │  │  - useDeleteTask │    │  - deleteTask()  │    │               │  │   │
│  │  └──────────────────┘    └──────────────────┘    └───────────────┘  │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                        │
│                                    ▼                                        │
│                         ┌──────────────────┐                                │
│                         │   Backend API    │                                │
│                         │   (External)     │                                │
│                         └──────────────────┘                                │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **User Action** → Component triggers query/mutation
2. **TanStack Query** → Manages cache, optimistic updates, loading states
3. **API Client** → Typed fetch wrapper with error handling
4. **Better Auth Session** → Provides JWT token for Authorization header
5. **Backend API** → Receives request with Bearer token
6. **Response** → TanStack Query updates cache, UI reacts

### State Management Strategy

| State Type | Solution | Rationale |
|------------|----------|-----------|
| Server State (Tasks) | TanStack Query | Caching, background sync, optimistic UI |
| Auth State | Better Auth | Built-in session management, JWT exposure |
| UI State (Theme) | next-themes | SSR-safe, class strategy, persistent |
| Form State | react-hook-form + Zod | Validation, performance, type safety |
| Local UI State | React useState | Simple, co-located with components |

### Why This Stack

- **TanStack Query**: Eliminates boilerplate, provides caching, background refetching, optimistic updates out of the box
- **Better Auth**: Modern auth library with built-in JWT support, React hooks, and Next.js integration
- **shadcn/ui**: Accessible, customizable components that own the code (no black box)
- **Tailwind CSS v4**: Faster builds, better performance, consistent design system
- **TypeScript Strict**: Catches errors at compile time, better IDE support

---

## 2. Setup & Initialization Steps

### 2.1 Project Initialization

```bash
# Create Next.js project (if starting fresh)
npx create-next-app@latest frontend --typescript --tailwind --eslint --app --src-dir=false --import-alias="@/*"

# Navigate to frontend directory
cd frontend

# Install core dependencies
npm install @tanstack/react-query better-auth next-themes zod react-hook-form @hookform/resolvers lucide-react sonner clsx tailwind-merge class-variance-authority
```

### 2.2 shadcn/ui Initialization

```bash
# Initialize shadcn/ui (select defaults: New York style, Zinc base, CSS variables)
npx shadcn@latest init

# Install essential components (in order of priority)
npx shadcn@latest add button
npx shadcn@latest add input
npx shadcn@latest add card
npx shadcn@latest add checkbox
npx shadcn@latest add dialog
npx shadcn@latest add dropdown-menu
npx shadcn@latest add avatar
npx shadcn@latest add skeleton
npx shadcn@latest add sonner
npx shadcn@latest add label
npx shadcn@latest add separator
npx shadcn@latest add sheet
npx shadcn@latest add form
npx shadcn@latest add textarea
npx shadcn@latest add select
```

### 2.3 Tailwind Configuration Extensions

```typescript
// tailwind.config.ts - Extend with custom design tokens
import type { Config } from "tailwindcss"

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Custom semantic colors from design system
        success: {
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
        },
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.3s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
export default config
```

### 2.4 CSS Variables (globals.css additions)

```css
/* Add to globals.css after shadcn defaults */
@layer base {
  :root {
    --success: 158 64% 42%;
    --success-foreground: 0 0% 100%;
  }
  .dark {
    --success: 158 64% 42%;
    --success-foreground: 0 0% 100%;
  }
}
```

### 2.5 Folder Structure (Confirmed)

```
frontend/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   ├── signup/page.tsx
│   │   └── layout.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── api/auth/[...all]/route.ts
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── components/
│   ├── ui/                      # shadcn/ui (auto-generated)
│   ├── layout/
│   │   ├── header.tsx
│   │   ├── sidebar.tsx
│   │   ├── mobile-nav.tsx
│   │   └── theme-toggle.tsx
│   ├── todo/
│   │   ├── task-list.tsx
│   │   ├── task-item.tsx
│   │   ├── task-form.tsx
│   │   ├── task-dialog.tsx
│   │   ├── task-filters.tsx
│   │   ├── empty-state.tsx
│   │   └── loading-skeleton.tsx
│   ├── auth/
│   │   ├── login-form.tsx
│   │   ├── signup-form.tsx
│   │   └── user-dropdown.tsx
│   └── providers/
│       ├── theme-provider.tsx
│       └── query-provider.tsx
├── lib/
│   ├── api.ts
│   ├── auth.ts
│   ├── auth-client.ts
│   ├── utils.ts
│   └── validations.ts
├── hooks/
│   ├── use-tasks.ts
│   └── use-media-query.ts
├── types/
│   ├── task.ts
│   └── api.ts
└── public/
    └── empty-tasks.svg
```

---

## 3. Authentication Layer

### 3.1 Better Auth Configuration

```typescript
// lib/auth.ts - Server-side Better Auth instance
import { betterAuth } from "better-auth"
import { jwt } from "better-auth/plugins"

export const auth = betterAuth({
  // Database adapter configured separately
  plugins: [
    jwt({
      jwt: {
        expirationTime: "7d",
      },
    }),
  ],
  emailAndPassword: {
    enabled: true,
  },
})
```

```typescript
// lib/auth-client.ts - Client-side hooks
import { createAuthClient } from "better-auth/react"
import { jwtClient } from "better-auth/client/plugins"

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL,
  plugins: [jwtClient()],
})

export const { useSession, signIn, signUp, signOut } = authClient
```

### 3.2 Auth API Route Handler

```typescript
// app/api/auth/[...all]/route.ts
import { auth } from "@/lib/auth"
import { toNextJsHandler } from "better-auth/next-js"

export const { GET, POST } = toNextJsHandler(auth)
```

### 3.3 Protected Route Pattern

```typescript
// app/(dashboard)/layout.tsx - Protected layout with redirect
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session) {
    redirect("/login")
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header + Sidebar + Main */}
      {children}
    </div>
  )
}
```

### 3.4 Login Form Structure

```typescript
// components/auth/login-form.tsx - Using shadcn form + react-hook-form
"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { signIn } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { toast } from "sonner"

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
})

export function LoginForm() {
  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
  })

  async function onSubmit(data: z.infer<typeof loginSchema>) {
    const result = await signIn.email({
      email: data.email,
      password: data.password,
    })

    if (result.error) {
      toast.error(result.error.message)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* Form fields */}
      </form>
    </Form>
  )
}
```

### 3.5 User Dropdown Component

```typescript
// components/auth/user-dropdown.tsx
"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useSession, signOut } from "@/lib/auth-client"
import { LogOut, User } from "lucide-react"
import { ThemeToggle } from "@/components/layout/theme-toggle"

export function UserDropdown() {
  const { data: session } = useSession()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Avatar className="h-8 w-8 cursor-pointer">
          <AvatarImage src={session?.user?.image} />
          <AvatarFallback>{session?.user?.name?.[0] ?? "U"}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <div className="flex items-center gap-2 p-2">
          <div className="flex flex-col">
            <span className="text-sm font-medium">{session?.user?.name}</span>
            <span className="text-xs text-muted-foreground">{session?.user?.email}</span>
          </div>
        </div>
        <DropdownMenuSeparator />
        <ThemeToggle />
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => signOut()}>
          <LogOut className="mr-2 h-4 w-4" />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
```

---

## 4. API Client & Data Layer

### 4.1 Type Definitions

```typescript
// types/task.ts
export interface Task {
  id: number
  title: string
  description: string | null
  completed: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateTaskInput {
  title: string
  description?: string
}

export interface UpdateTaskInput {
  title?: string
  description?: string
  completed?: boolean
}

export interface TaskFilters {
  status?: "all" | "pending" | "completed"
  sort?: "created" | "title"
}
```

### 4.2 API Client with JWT

```typescript
// lib/api.ts
import { authClient } from "./auth-client"
import type { Task, CreateTaskInput, UpdateTaskInput, TaskFilters } from "@/types/task"

const API_BASE = process.env.NEXT_PUBLIC_API_URL

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message)
  }
}

async function fetchWithAuth<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const session = await authClient.getSession()

  if (!session?.data?.session) {
    throw new ApiError(401, "Not authenticated")
  }

  const token = session.data.session.token // JWT from Better Auth
  const userId = session.data.user.id

  const response = await fetch(`${API_BASE}/api/${userId}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  })

  if (response.status === 401) {
    await authClient.signOut()
    window.location.href = "/login"
    throw new ApiError(401, "Session expired")
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Request failed" }))
    throw new ApiError(response.status, error.message)
  }

  return response.json()
}

// Task API functions
export const tasksApi = {
  getAll: (filters?: TaskFilters): Promise<Task[]> => {
    const params = new URLSearchParams()
    if (filters?.status && filters.status !== "all") {
      params.set("status", filters.status)
    }
    if (filters?.sort) {
      params.set("sort", filters.sort)
    }
    const query = params.toString()
    return fetchWithAuth(`/tasks${query ? `?${query}` : ""}`)
  },

  getOne: (id: number): Promise<Task> =>
    fetchWithAuth(`/tasks/${id}`),

  create: (data: CreateTaskInput): Promise<Task> =>
    fetchWithAuth("/tasks", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (id: number, data: UpdateTaskInput): Promise<Task> =>
    fetchWithAuth(`/tasks/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  delete: (id: number): Promise<void> =>
    fetchWithAuth(`/tasks/${id}`, { method: "DELETE" }),

  toggleComplete: (id: number): Promise<Task> =>
    fetchWithAuth(`/tasks/${id}/complete`, { method: "PATCH" }),
}
```

### 4.3 TanStack Query Hooks with Optimistic Updates

```typescript
// hooks/use-tasks.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { tasksApi } from "@/lib/api"
import type { Task, CreateTaskInput, UpdateTaskInput, TaskFilters } from "@/types/task"
import { toast } from "sonner"

const TASKS_KEY = ["tasks"]

export function useTasksQuery(filters?: TaskFilters) {
  return useQuery({
    queryKey: [...TASKS_KEY, filters],
    queryFn: () => tasksApi.getAll(filters),
    staleTime: 1000 * 60, // 1 minute
  })
}

export function useCreateTaskMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: tasksApi.create,
    onMutate: async (newTask) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: TASKS_KEY })

      // Snapshot previous value
      const previousTasks = queryClient.getQueryData<Task[]>(TASKS_KEY)

      // Optimistically add task
      queryClient.setQueryData<Task[]>(TASKS_KEY, (old) => [
        ...(old ?? []),
        {
          id: Date.now(), // Temp ID
          ...newTask,
          description: newTask.description ?? null,
          completed: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ])

      return { previousTasks }
    },
    onError: (err, _, context) => {
      queryClient.setQueryData(TASKS_KEY, context?.previousTasks)
      toast.error("Failed to create task")
    },
    onSuccess: () => {
      toast.success("Task created")
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: TASKS_KEY })
    },
  })
}

export function useToggleCompleteMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: tasksApi.toggleComplete,
    onMutate: async (taskId) => {
      await queryClient.cancelQueries({ queryKey: TASKS_KEY })
      const previousTasks = queryClient.getQueryData<Task[]>(TASKS_KEY)

      queryClient.setQueryData<Task[]>(TASKS_KEY, (old) =>
        old?.map((task) =>
          task.id === taskId ? { ...task, completed: !task.completed } : task
        )
      )

      return { previousTasks }
    },
    onError: (_, __, context) => {
      queryClient.setQueryData(TASKS_KEY, context?.previousTasks)
      toast.error("Failed to update task")
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: TASKS_KEY })
    },
  })
}

export function useDeleteTaskMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: tasksApi.delete,
    onMutate: async (taskId) => {
      await queryClient.cancelQueries({ queryKey: TASKS_KEY })
      const previousTasks = queryClient.getQueryData<Task[]>(TASKS_KEY)

      queryClient.setQueryData<Task[]>(TASKS_KEY, (old) =>
        old?.filter((task) => task.id !== taskId)
      )

      return { previousTasks }
    },
    onError: (_, __, context) => {
      queryClient.setQueryData(TASKS_KEY, context?.previousTasks)
      toast.error("Failed to delete task")
    },
    onSuccess: () => {
      toast.success("Task deleted")
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: TASKS_KEY })
    },
  })
}
```

---

## 5. Core UI Layout & Shell

### 5.1 Root Layout

```typescript
// app/layout.tsx
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/providers/theme-provider"
import { QueryProvider } from "@/components/providers/query-provider"
import { Toaster } from "@/components/ui/sonner"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "TaskFlow - Modern Todo App",
  description: "A premium task management application",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <QueryProvider>
            {children}
            <Toaster richColors position="bottom-right" />
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
```

### 5.2 Dashboard Layout Structure

```typescript
// app/(dashboard)/layout.tsx
import { Header } from "@/components/layout/header"
import { Sidebar } from "@/components/layout/sidebar"
import { MobileNav } from "@/components/layout/mobile-nav"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="flex">
        {/* Desktop Sidebar */}
        <aside className="hidden md:flex w-64 flex-col border-r bg-card">
          <Sidebar />
        </aside>
        {/* Mobile Nav (Sheet) */}
        <MobileNav className="md:hidden" />
        {/* Main Content */}
        <main className="flex-1 p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
```

### 5.3 Header Component

```typescript
// components/layout/header.tsx
import { CheckSquare } from "lucide-react"
import { ThemeToggle } from "./theme-toggle"
import { UserDropdown } from "@/components/auth/user-dropdown"
import { MobileNav } from "./mobile-nav"

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center px-4 md:px-6">
        {/* Mobile menu trigger */}
        <MobileNav className="mr-2 md:hidden" />

        {/* Logo */}
        <div className="flex items-center gap-2">
          <CheckSquare className="h-6 w-6 text-primary" />
          <span className="font-semibold text-lg">TaskFlow</span>
        </div>

        {/* Right side */}
        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />
          <UserDropdown />
        </div>
      </div>
    </header>
  )
}
```

### 5.4 Sidebar Component

```typescript
// components/layout/sidebar.tsx
"use client"

import { cn } from "@/lib/utils"
import { ListTodo, CheckCircle2, Calendar } from "lucide-react"
import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"

const navItems = [
  { label: "All Tasks", icon: ListTodo, href: "/dashboard", filter: "all" },
  { label: "Today", icon: Calendar, href: "/dashboard?filter=today", filter: "today" },
  { label: "Completed", icon: CheckCircle2, href: "/dashboard?status=completed", filter: "completed" },
]

export function Sidebar() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const currentFilter = searchParams.get("status") ?? "all"

  return (
    <nav className="flex flex-col gap-1 p-4">
      {navItems.map((item) => (
        <Link
          key={item.label}
          href={item.href}
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
            "hover:bg-accent hover:text-accent-foreground",
            currentFilter === item.filter && "bg-accent text-accent-foreground font-medium"
          )}
        >
          <item.icon className="h-4 w-4" />
          {item.label}
        </Link>
      ))}
    </nav>
  )
}
```

### 5.5 Mobile Navigation (Sheet)

```typescript
// components/layout/mobile-nav.tsx
"use client"

import { Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Sidebar } from "./sidebar"

export function MobileNav({ className }: { className?: string }) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className={className}>
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-64 p-0">
        <Sidebar />
      </SheetContent>
    </Sheet>
  )
}
```

---

## 6. Dashboard Page Breakdown

### 6.1 Main Dashboard Page

```typescript
// app/(dashboard)/page.tsx
import { TaskForm } from "@/components/todo/task-form"
import { TaskFilters } from "@/components/todo/task-filters"
import { TaskList } from "@/components/todo/task-list"

export default function DashboardPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">My Tasks</h1>
        <p className="text-muted-foreground">Manage your daily tasks</p>
      </div>

      {/* Quick Add Form */}
      <TaskForm />

      {/* Filters */}
      <TaskFilters />

      {/* Task List */}
      <TaskList />
    </div>
  )
}
```

### 6.2 Task Form (Quick Add)

```typescript
// components/todo/task-form.tsx
"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useCreateTaskMutation } from "@/hooks/use-tasks"

const taskSchema = z.object({
  title: z.string().min(1, "Title required").max(200, "Title too long"),
})

export function TaskForm() {
  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(taskSchema),
  })
  const createTask = useCreateTaskMutation()

  const onSubmit = (data: z.infer<typeof taskSchema>) => {
    createTask.mutate(data, {
      onSuccess: () => reset(),
    })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex gap-2">
      <Input
        {...register("title")}
        placeholder="Add a new task..."
        className="flex-1"
        autoComplete="off"
      />
      <Button type="submit" disabled={createTask.isPending}>
        <Plus className="h-4 w-4 mr-2" />
        Add
      </Button>
    </form>
  )
}
```

### 6.3 Task List Component

```typescript
// components/todo/task-list.tsx
"use client"

import { useTasksQuery } from "@/hooks/use-tasks"
import { TaskItem } from "./task-item"
import { EmptyState } from "./empty-state"
import { LoadingSkeleton } from "./loading-skeleton"

export function TaskList() {
  const { data: tasks, isLoading, error } = useTasksQuery()

  if (isLoading) {
    return <LoadingSkeleton />
  }

  if (error) {
    return (
      <div className="text-center py-8 text-destructive">
        Failed to load tasks. Please try again.
      </div>
    )
  }

  if (!tasks?.length) {
    return <EmptyState />
  }

  return (
    <div className="space-y-2">
      {tasks.map((task) => (
        <TaskItem key={task.id} task={task} />
      ))}
    </div>
  )
}
```

### 6.4 Task Item Component

```typescript
// components/todo/task-item.tsx
"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react"
import { useToggleCompleteMutation, useDeleteTaskMutation } from "@/hooks/use-tasks"
import { TaskDialog } from "./task-dialog"
import type { Task } from "@/types/task"

interface TaskItemProps {
  task: Task
}

export function TaskItem({ task }: TaskItemProps) {
  const [editOpen, setEditOpen] = useState(false)
  const toggleComplete = useToggleCompleteMutation()
  const deleteTask = useDeleteTaskMutation()

  return (
    <>
      <div
        className={cn(
          "group flex items-center gap-3 rounded-lg border bg-card p-4",
          "transition-all hover:shadow-sm hover:bg-accent/50",
          task.completed && "opacity-60"
        )}
      >
        <Checkbox
          checked={task.completed}
          onCheckedChange={() => toggleComplete.mutate(task.id)}
          aria-label={`Mark "${task.title}" as ${task.completed ? "incomplete" : "complete"}`}
        />

        <div className="flex-1 min-w-0">
          <p className={cn(
            "font-medium truncate",
            task.completed && "line-through text-muted-foreground"
          )}>
            {task.title}
          </p>
          {task.description && (
            <p className="text-sm text-muted-foreground truncate">
              {task.description}
            </p>
          )}
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">Task actions</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setEditOpen(true)}>
              <Pencil className="h-4 w-4 mr-2" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => deleteTask.mutate(task.id)}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <TaskDialog
        task={task}
        open={editOpen}
        onOpenChange={setEditOpen}
      />
    </>
  )
}
```

### 6.5 Empty State Component

```typescript
// components/todo/empty-state.tsx
import { ClipboardList } from "lucide-react"

export function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="rounded-full bg-muted p-4 mb-4">
        <ClipboardList className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="font-semibold text-lg mb-1">No tasks yet</h3>
      <p className="text-muted-foreground text-sm max-w-xs">
        Get started by adding your first task using the form above.
      </p>
    </div>
  )
}
```

### 6.6 Loading Skeleton

```typescript
// components/todo/loading-skeleton.tsx
import { Skeleton } from "@/components/ui/skeleton"

export function LoadingSkeleton() {
  return (
    <div className="space-y-2">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-center gap-3 rounded-lg border bg-card p-4">
          <Skeleton className="h-5 w-5 rounded" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  )
}
```

---

## 7. Polish & Performance Features

### 7.1 Loading States

- Skeleton components for task list during initial fetch
- Button loading states with disabled + spinner
- Form submission states with visual feedback

### 7.2 Optimistic Updates (Implemented in hooks)

- **Create**: Task appears immediately with temp ID
- **Toggle**: Checkbox state updates instantly
- **Delete**: Task removed from list immediately
- **Error Rollback**: Previous state restored on failure

### 7.3 Micro-Animations (CSS-based for performance)

```css
/* Add to globals.css */
@layer utilities {
  .animate-in {
    animation: fade-in 0.2s ease-out;
  }
}
```

```typescript
// TaskItem with animation
<div className="animate-in" style={{ animationDelay: `${index * 50}ms` }}>
  {/* content */}
</div>
```

### 7.4 Accessibility Checklist

| Feature | Implementation |
|---------|----------------|
| Focus management | shadcn Dialog auto-traps focus |
| Keyboard navigation | Tab order, Enter submit, Escape close |
| Screen reader labels | aria-label on all interactive elements |
| Color contrast | WCAG AA compliant (via shadcn defaults) |
| Focus indicators | Visible ring on all focusable elements |

### 7.5 Error Handling

```typescript
// components/error-boundary.tsx
"use client"

import { Button } from "@/components/ui/button"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
      <h2 className="text-xl font-semibold">Something went wrong</h2>
      <p className="text-muted-foreground">{error.message}</p>
      <Button onClick={reset}>Try again</Button>
    </div>
  )
}
```

---

## 8. Phased Implementation Order

### Phase 1: Project Setup (Tasks T001-T005)
1. Initialize Next.js project with TypeScript
2. Install and configure shadcn/ui
3. Set up Tailwind CSS with custom tokens
4. Configure next-themes for dark mode
5. Create folder structure

### Phase 2: Authentication (Tasks T006-T012)
1. Configure Better Auth (server + client)
2. Create auth API route handler
3. Build login page and form
4. Build signup page and form
5. Implement protected route wrapper
6. Create user dropdown component
7. Test auth flow end-to-end

### Phase 3: Layout Shell (Tasks T013-T018)
1. Build root layout with providers
2. Create Header component
3. Create Sidebar component
4. Create MobileNav component
5. Build dashboard layout
6. Connect all layout pieces

### Phase 4: Data Layer (Tasks T019-T024)
1. Define TypeScript types
2. Build API client with auth
3. Create TanStack Query provider
4. Implement useTasksQuery hook
5. Implement mutation hooks (create, toggle, delete)
6. Test data layer with mock/real API

### Phase 5: Task UI (Tasks T025-T032)
1. Build TaskForm (quick add)
2. Build TaskList component
3. Build TaskItem component
4. Build TaskDialog (edit)
5. Build EmptyState component
6. Build LoadingSkeleton component
7. Build TaskFilters component
8. Wire up dashboard page

### Phase 6: Polish (Tasks T033-T038)
1. Add loading skeletons everywhere
2. Implement optimistic updates
3. Add toast notifications
4. Add micro-animations
5. Accessibility audit and fixes
6. Responsive testing and fixes

---

## 9. Quality Gates & Testing Notes

### TypeScript Strict Mode
```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true
  }
}
```

### Manual Verification Checklist

After each phase, verify:

- [ ] No TypeScript errors (`npm run build`)
- [ ] No ESLint warnings (`npm run lint`)
- [ ] Responsive: Test at 320px, 768px, 1280px
- [ ] Dark mode: Toggle works, no flash
- [ ] Keyboard: Tab through all interactive elements
- [ ] Screen reader: Test with VoiceOver/NVDA

### Lighthouse Targets

| Metric | Target |
|--------|--------|
| Performance | 90+ |
| Accessibility | 90+ |
| Best Practices | 90+ |
| SEO | 90+ |

---

## Project Structure (Final)

```text
frontend/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   ├── signup/page.tsx
│   │   └── layout.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── error.tsx
│   ├── api/auth/[...all]/route.ts
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── components/
│   ├── ui/                      # shadcn/ui
│   ├── layout/
│   │   ├── header.tsx
│   │   ├── sidebar.tsx
│   │   ├── mobile-nav.tsx
│   │   └── theme-toggle.tsx
│   ├── todo/
│   │   ├── task-list.tsx
│   │   ├── task-item.tsx
│   │   ├── task-form.tsx
│   │   ├── task-dialog.tsx
│   │   ├── task-filters.tsx
│   │   ├── empty-state.tsx
│   │   └── loading-skeleton.tsx
│   ├── auth/
│   │   ├── login-form.tsx
│   │   ├── signup-form.tsx
│   │   └── user-dropdown.tsx
│   └── providers/
│       ├── theme-provider.tsx
│       └── query-provider.tsx
├── lib/
│   ├── api.ts
│   ├── auth.ts
│   ├── auth-client.ts
│   ├── utils.ts
│   └── validations.ts
├── hooks/
│   ├── use-tasks.ts
│   └── use-media-query.ts
├── types/
│   ├── task.ts
│   └── api.ts
└── public/
    └── empty-tasks.svg
```

**Structure Decision**: Web application structure with frontend in dedicated folder per constitution monorepo layout.

---

**Frontend implementation plan complete. This architecture ensures a premium, fast, accessible Todo UI.**

**Ready for /sp.tasks to break into atomic implementation steps (start with Phase 1: Setup).**
