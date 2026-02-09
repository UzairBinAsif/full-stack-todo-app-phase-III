# Frontend Development Guidelines

## Tech Stack

- **Framework**: Next.js 16+ with App Router
- **Language**: TypeScript 5.x (strict mode)
- **Styling**: Tailwind CSS v4 + shadcn/ui (New York style)
- **State Management**: TanStack Query v5 (server state), React useState (local UI)
- **Authentication**: Better Auth with JWT plugin
- **Forms**: react-hook-form + Zod validation
- **Icons**: lucide-react
- **Notifications**: sonner

## Project Structure

```
frontend/
├── app/                    # Next.js App Router pages
│   ├── (auth)/            # Public auth routes (login, signup)
│   ├── (dashboard)/       # Protected dashboard routes
│   └── api/auth/          # Better Auth API routes
├── components/
│   ├── ui/                # shadcn/ui components
│   ├── layout/            # Layout components (header, sidebar)
│   ├── todo/              # Task-related components
│   ├── auth/              # Auth forms and user dropdown
│   └── providers/         # Context providers
├── lib/                   # Utilities and configurations
├── hooks/                 # Custom React hooks
└── types/                 # TypeScript type definitions
```

## Component Patterns

### Data Fetching
Use TanStack Query hooks from `hooks/use-tasks.ts`:
- `useTasksQuery(filters?)` - Fetch tasks with optional filters
- `useCreateTaskMutation()` - Create task with optimistic updates
- `useUpdateTaskMutation()` - Update task with optimistic updates
- `useDeleteTaskMutation()` - Delete task with optimistic removal
- `useToggleCompleteMutation()` - Toggle completion status

### Form Validation
All forms use Zod schemas from `lib/validations.ts` with react-hook-form.

### Authentication
- Use `useSession()` from `lib/auth-client.ts` for client-side session
- Protected routes use server-side session check in layout

### Toast Notifications
Import `toast` from `sonner` for notifications:
```tsx
toast.success("Task created")
toast.error("Failed to create task")
```

## Accessibility Requirements

- All interactive elements must have aria-labels
- Icon-only buttons must include sr-only text
- Forms must have proper error handling with aria-describedby
- Focus must be visible (focus-visible ring styling)
- Color contrast meets WCAG AA standards

## Code Standards

- Use `"use client"` directive for client components
- Prefer Server Components where possible
- Use `cn()` utility for conditional class names
- Follow existing component patterns for consistency
