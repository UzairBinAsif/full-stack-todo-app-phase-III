# Feature Specification: Professional Frontend Todo UI

**Feature Branch**: `001-frontend-todo-ui`
**Created**: 2025-02-07
**Status**: Draft
**Input**: Professional-grade, modern Todo web application frontend with shadcn/ui, Tailwind CSS v4, Better Auth integration, and premium design system

---

## Overview

This specification defines the frontend-only requirements for a **premium, production-ready Todo web application**. The goal is to create a visually stunning, highly intuitive user interface that rivals best-in-class SaaS products like Notion and Todoist.

**Scope**: Frontend UI/UX only. This spec does NOT cover backend implementation details.

**Target Audience**: Hackathon judges, end users seeking a modern task management experience.

**Design Philosophy**: Premium SaaS aesthetic with clean typography, thoughtful micro-interactions, mobile-first responsiveness, and full accessibility compliance.

---

## Design System

### Color Palette

| Token                  | Light Mode | Dark Mode | Usage                     |
| ---------------------- | ---------- | --------- | ------------------------- |
| `--background`         | `#FFFFFF`  | `#09090B` | Page background           |
| `--foreground`         | `#09090B`  | `#FAFAFA` | Primary text              |
| `--card`               | `#FFFFFF`  | `#18181B` | Card backgrounds          |
| `--card-foreground`    | `#09090B`  | `#FAFAFA` | Card text                 |
| `--primary`            | `#3B82F6`  | `#3B82F6` | Primary accent (blue-500) |
| `--primary-foreground` | `#FFFFFF`  | `#FFFFFF` | Text on primary           |
| `--secondary`          | `#F4F4F5`  | `#27272A` | Secondary backgrounds     |
| `--muted`              | `#F4F4F5`  | `#27272A` | Muted backgrounds         |
| `--muted-foreground`   | `#71717A`  | `#A1A1AA` | Muted text                |
| `--accent`             | `#F4F4F5`  | `#27272A` | Accent highlights         |
| `--destructive`        | `#EF4444`  | `#EF4444` | Error/danger (red-500)    |
| `--success`            | `#10B981`  | `#10B981` | Success states            |
| `--border`             | `#E4E4E7`  | `#27272A` | Borders                   |
| `--ring`               | `#3B82F6`  | `#3B82F6` | Focus rings               |

### Typography

| Element | Font                | Size     | Weight | Line Height |
| ------- | ------------------- | -------- | ------ | ----------- |
| H1      | Inter / System Sans | 2.25rem  | 700    | 2.5rem      |
| H2      | Inter / System Sans | 1.875rem | 600    | 2.25rem     |
| H3      | Inter / System Sans | 1.5rem   | 600    | 2rem        |
| Body    | Inter / System Sans | 1rem     | 400    | 1.5rem      |
| Small   | Inter / System Sans | 0.875rem | 400    | 1.25rem     |
| Caption | Inter / System Sans | 0.75rem  | 500    | 1rem        |

### Spacing & Sizing

| Token          | Value   | Usage              |
| -------------- | ------- | ------------------ |
| `--radius`     | 0.75rem | Border radius (lg) |
| `--spacing-xs` | 0.25rem | Tight spacing      |
| `--spacing-sm` | 0.5rem  | Small gaps         |
| `--spacing-md` | 1rem    | Standard gaps      |
| `--spacing-lg` | 1.5rem  | Section gaps       |
| `--spacing-xl` | 2rem    | Large sections     |

### Visual Effects

- **Glassmorphism**: `backdrop-blur-md bg-background/80` for overlays and modals
- **Shadows**: `shadow-sm` for cards, `shadow-lg` for elevated elements
- **Transitions**: `transition-all duration-200 ease-in-out` as default
- **Hover Scale**: `hover:scale-[1.02]` for interactive cards
- **Focus Ring**: `focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2`

### Responsive Breakpoints

| Breakpoint | Min Width | Target Devices |
| ---------- | --------- | -------------- |
| `sm`       | 640px     | Large phones   |
| `md`       | 768px     | Tablets        |
| `lg`       | 1024px    | Small laptops  |
| `xl`       | 1280px    | Desktops       |
| `2xl`      | 1536px    | Large displays |

---

## Folder Structure

```
frontend/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   │   └── page.tsx
│   │   ├── signup/
│   │   │   └── page.tsx
│   │   └── layout.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── api/
│   │   └── auth/
│   │       └── [...all]/
│   │           └── route.ts
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── components/
│   ├── ui/                    # shadcn/ui components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── checkbox.tsx
│   │   ├── dialog.tsx
│   │   ├── dropdown-menu.tsx
│   │   ├── input.tsx
│   │   ├── label.tsx
│   │   ├── skeleton.tsx
│   │   ├── sonner.tsx         # Toast notifications
│   │   ├── avatar.tsx
│   │   └── ...
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
│   │   ├── user-dropdown.tsx
│   │   └── auth-provider.tsx
│   └── providers/
│       ├── theme-provider.tsx
│       └── query-provider.tsx
├── lib/
│   ├── api.ts                 # API client with auth
│   ├── auth.ts                # Better Auth client config
│   ├── auth-client.ts         # Better Auth React hooks
│   ├── utils.ts               # cn() utility and helpers
│   └── validations.ts         # Form validation schemas
├── hooks/
│   ├── use-tasks.ts           # Task data fetching hook
│   ├── use-auth.ts            # Auth state hook
│   └── use-media-query.ts     # Responsive utilities
├── types/
│   ├── task.ts
│   ├── user.ts
│   └── api.ts
└── public/
    ├── logo.svg
    └── empty-tasks.svg
```

---

## User Scenarios & Testing

### User Story 1 - Task Creation (Priority: P1)

As a logged-in user, I want to quickly add new tasks so I can capture my to-dos without friction.

**Why this priority**: Core functionality. Without task creation, the app has no value. This is the most frequent user action.

**Independent Test**: Can be fully tested by logging in and adding a task. Delivers immediate value by allowing task capture.

**Acceptance Scenarios**:

1. **Given** I am on the dashboard, **When** I type in the task input and press Enter, **Then** the task appears in my task list immediately
2. **Given** I am on the dashboard, **When** I click the "Add Task" button, **Then** a dialog opens for detailed task entry
3. **Given** I submit a task, **When** the submission succeeds, **Then** I see a success toast notification
4. **Given** I try to add an empty task, **When** I submit, **Then** I see a validation error and the task is not created
5. **Given** I add a task with a description, **When** viewing the task list, **Then** I see a preview of the description

---

### User Story 2 - Authentication Flow (Priority: P1)

As a visitor, I want to sign up and log in securely so I can access my personal tasks.

**Why this priority**: Without authentication, users cannot have personal task lists. Security is foundational.

**Independent Test**: Can be fully tested by completing signup/login flow. Delivers secure access to the application.

**Acceptance Scenarios**:

1. **Given** I am on the login page, **When** I enter valid credentials and submit, **Then** I am redirected to the dashboard
2. **Given** I am on the signup page, **When** I complete registration, **Then** I receive confirmation and can log in
3. **Given** I enter invalid credentials, **When** I submit, **Then** I see an appropriate error message
4. **Given** I am logged in, **When** I click logout in the user dropdown, **Then** I am logged out and redirected to login
5. **Given** I am not logged in, **When** I try to access the dashboard, **Then** I am redirected to the login page

---

### User Story 3 - Task Management (Priority: P2)

As a logged-in user, I want to view, edit, complete, and delete my tasks so I can manage my to-do list effectively.

**Why this priority**: Essential CRUD operations. Users need to manage tasks after creation.

**Independent Test**: Can be fully tested by creating a task, then editing, completing, and deleting it.

**Acceptance Scenarios**:

1. **Given** I have tasks, **When** I click the checkbox on a task, **Then** the task is marked complete with strikethrough styling
2. **Given** I click on a task, **When** the edit dialog opens, **Then** I can modify the title and description
3. **Given** I click the delete icon on a task, **When** I confirm deletion, **Then** the task is removed from my list
4. **Given** I complete a task, **When** viewing the list, **Then** completed tasks appear visually distinct
5. **Given** I edit a task, **When** I save changes, **Then** the updates are reflected immediately

---

### User Story 4 - Task Filtering & Sorting (Priority: P3)

As a logged-in user, I want to filter and sort my tasks so I can focus on what matters most.

**Why this priority**: Quality-of-life feature. Enhances usability but not critical for MVP.

**Independent Test**: Can be tested by creating multiple tasks and applying filters/sorts.

**Acceptance Scenarios**:

1. **Given** I have mixed completed/pending tasks, **When** I filter by "Pending", **Then** only pending tasks are shown
2. **Given** I have multiple tasks, **When** I sort by "Created Date", **Then** tasks are ordered chronologically
3. **Given** I apply a filter, **When** viewing the list, **Then** the active filter is visually indicated
4. **Given** I am on mobile, **When** I access filters, **Then** they are accessible via a dropdown or sheet

---

### User Story 5 - Theme & Accessibility (Priority: P3)

As a user, I want the application to support dark mode and be fully accessible so I can use it comfortably in any environment.

**Why this priority**: Polish feature. Important for user experience but not blocking.

**Independent Test**: Can be tested by toggling themes and navigating with keyboard only.

**Acceptance Scenarios**:

1. **Given** I click the theme toggle, **When** the theme changes, **Then** all UI elements update consistently
2. **Given** I use keyboard only, **When** I navigate the app, **Then** all interactive elements are reachable with visible focus indicators
3. **Given** I use a screen reader, **When** navigating tasks, **Then** all elements have appropriate labels
4. **Given** I am on the dashboard, **When** the page loads, **Then** my preferred theme is applied automatically

---

### Edge Cases

- **Empty State**: When a user has no tasks, display a friendly illustration with "Add your first task" call-to-action
- **Network Error**: When API calls fail, display a toast with retry option; maintain optimistic UI state
- **Session Expiry**: When the session expires during use, redirect to login with a message
- **Long Task Titles**: Truncate with ellipsis after 2 lines; show full title on hover/click
- **Rapid Submissions**: Debounce form submissions to prevent duplicate tasks
- **Offline State**: Show an offline indicator; queue actions for retry when online

---

## Requirements

### Functional Requirements

**Authentication**

- **FR-001**: System MUST display a login form with email and password fields
- **FR-002**: System MUST display a signup form with email, password, and name fields
- **FR-003**: System MUST show inline validation errors for invalid form inputs
- **FR-004**: System MUST redirect authenticated users away from auth pages to dashboard
- **FR-005**: System MUST redirect unauthenticated users from protected pages to login
- **FR-006**: System MUST display a user dropdown with avatar, name, and logout option

**Task Management**

- **FR-007**: System MUST display a quick-add input at the top of the task list
- **FR-008**: System MUST display all user's tasks in a scrollable list
- **FR-009**: System MUST allow users to mark tasks as complete via checkbox
- **FR-010**: System MUST display completed tasks with strikethrough styling
- **FR-011**: System MUST provide edit functionality via click or dedicated button
- **FR-012**: System MUST provide delete functionality with confirmation
- **FR-013**: System MUST show toast notifications for all CRUD operations
- **FR-014**: System MUST validate task titles (required, 1-200 characters)

**Filtering & Sorting**

- **FR-015**: System MUST allow filtering by status (All, Pending, Completed)
- **FR-016**: System MUST allow sorting by creation date or title
- **FR-017**: System MUST persist filter/sort preferences during session

**UI/UX**

- **FR-018**: System MUST support light and dark themes with toggle
- **FR-019**: System MUST be fully responsive across all breakpoints
- **FR-020**: System MUST show loading skeletons during data fetching
- **FR-021**: System MUST show empty state when no tasks exist
- **FR-022**: System MUST provide optimistic UI updates for all mutations

**Accessibility**

- **FR-023**: All interactive elements MUST be keyboard accessible
- **FR-024**: All form inputs MUST have associated labels
- **FR-025**: Focus indicators MUST be visible on all interactive elements
- **FR-026**: Color contrast MUST meet WCAG AA standards

### Key Entities

- **User**: Represents an authenticated person with id, email, name, and avatar (managed by auth provider)
- **Task**: Represents a to-do item with id, title, description (optional), completed status, and timestamps

---

## Pages & Layouts

### Root Layout (`app/layout.tsx`)

- Wraps entire app with theme provider and query provider
- Includes toast container (Sonner)
- Sets up Inter font and base styles

### Auth Layout (`app/(auth)/layout.tsx`)

- Centered card layout for auth forms
- Gradient or subtle pattern background
- No navigation (public pages)
- Logo at top

### Dashboard Layout (`app/(dashboard)/layout.tsx`)

- **Header**: App logo, theme toggle, user avatar dropdown
- **Sidebar** (desktop): Navigation links (All Tasks, Completed), collapsible
- **Mobile Nav**: Bottom sheet or hamburger menu
- **Main Content Area**: Task list and controls
- Protected route (redirects to login if unauthenticated)

### Page Specifications

| Route        | Component        | Purpose              | Auth Required |
| ------------ | ---------------- | -------------------- | ------------- |
| `/`          | Landing/Redirect | Public landing       | No            |
| `/login`     | Login Form       | User authentication  | No            |
| `/signup`    | Signup Form      | User registration    | No            |
| `/dashboard` | Task Dashboard   | Main task management | Yes           |

---

## Components Catalog

### shadcn/ui Components Required

```bash
# Initialization
npx shadcn@latest init

# Component installation
npx shadcn@latest add button
npx shadcn@latest add card
npx shadcn@latest add checkbox
npx shadcn@latest add dialog
npx shadcn@latest add dropdown-menu
npx shadcn@latest add input
npx shadcn@latest add label
npx shadcn@latest add skeleton
npx shadcn@latest add sonner
npx shadcn@latest add avatar
npx shadcn@latest add separator
npx shadcn@latest add sheet
npx shadcn@latest add form
npx shadcn@latest add textarea
```

### Custom Components

| Component         | Location                             | Purpose                                   |
| ----------------- | ------------------------------------ | ----------------------------------------- |
| `Header`          | `components/layout/header.tsx`       | App header with logo, theme, user menu    |
| `Sidebar`         | `components/layout/sidebar.tsx`      | Desktop navigation sidebar                |
| `MobileNav`       | `components/layout/mobile-nav.tsx`   | Mobile navigation (sheet or bottom nav)   |
| `ThemeToggle`     | `components/layout/theme-toggle.tsx` | Dark/light mode switch                    |
| `TaskList`        | `components/todo/task-list.tsx`      | Container for rendering task items        |
| `TaskItem`        | `components/todo/task-item.tsx`      | Individual task row with actions          |
| `TaskForm`        | `components/todo/task-form.tsx`      | Quick-add input form                      |
| `TaskDialog`      | `components/todo/task-dialog.tsx`    | Create/edit task modal                    |
| `TaskFilters`     | `components/todo/task-filters.tsx`   | Filter and sort controls                  |
| `EmptyState`      | `components/todo/empty-state.tsx`    | No-tasks illustration and CTA             |
| `LoadingSkeleton` | `components/todo/loading-skeleton.tsx` | Task list loading state                 |
| `LoginForm`       | `components/auth/login-form.tsx`     | Email/password login form                 |
| `SignupForm`      | `components/auth/signup-form.tsx`    | Registration form                         |
| `UserDropdown`    | `components/auth/user-dropdown.tsx`  | User avatar with menu (profile, logout)   |
| `AuthProvider`    | `components/auth/auth-provider.tsx`  | Auth context wrapper                      |
| `ThemeProvider`   | `components/providers/theme-provider.tsx` | next-themes wrapper                  |
| `QueryProvider`   | `components/providers/query-provider.tsx` | TanStack Query wrapper               |

---

## User Flows

### Authentication Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                        UNAUTHENTICATED                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   Landing (/)  ──────────────────────> Login (/login)           │
│                                           │                     │
│                                           ├── Enter credentials │
│                                           │                     │
│                                           ▼                     │
│                                    [Validate Form]              │
│                                           │                     │
│                         ┌─────────────────┴─────────────────┐   │
│                         │                                   │   │
│                    [Success]                           [Error]  │
│                         │                                   │   │
│                         ▼                                   ▼   │
│              Redirect to Dashboard              Show Error Toast│
│                                                                 │
│   New User? ────────────────────────> Signup (/signup)          │
│                                           │                     │
│                                           ├── Fill form         │
│                                           │                     │
│                                           ▼                     │
│                                    [Create Account]             │
│                                           │                     │
│                                           ▼                     │
│                                   Redirect to Login             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Task Management Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                      DASHBOARD (AUTHENTICATED)                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │ HEADER: Logo │ Theme Toggle │ User Avatar Dropdown      │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│   ┌──────────┐  ┌──────────────────────────────────────────┐   │
│   │ SIDEBAR  │  │  MAIN CONTENT                            │   │
│   │          │  │                                          │   │
│   │ All      │  │  ┌──────────────────────────────────┐    │   │
│   │ Tasks    │  │  │ Quick Add: [________] [+ Add]    │    │   │
│   │          │  │  └──────────────────────────────────┘    │   │
│   │ Completed│  │                                          │   │
│   │          │  │  ┌──────────────────────────────────┐    │   │
│   │          │  │  │ Filters: [All ▼] Sort: [Date ▼]  │    │   │
│   │          │  │  └──────────────────────────────────┘    │   │
│   │          │  │                                          │   │
│   │          │  │  ┌──────────────────────────────────┐    │   │
│   │          │  │  │ ☐ Task 1 title...    [Edit][Del] │    │   │
│   │          │  │  │   Description preview...         │    │   │
│   │          │  │  ├──────────────────────────────────┤    │   │
│   │          │  │  │ ☑ Task 2 (completed) [Edit][Del] │    │   │
│   │          │  │  │   Description preview...         │    │   │
│   │          │  │  └──────────────────────────────────┘    │   │
│   │          │  │                                          │   │
│   └──────────┘  └──────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

User Actions:
─────────────
• Type in quick add + Enter → Create task (optimistic)
• Click checkbox → Toggle complete (optimistic)
• Click task row → Open edit dialog
• Click delete icon → Confirm + delete (optimistic)
• Change filter/sort → Update displayed list
• Click user avatar → Show dropdown (profile, logout)
• Click theme toggle → Switch light/dark
```

---

## API Client Interface

### Type Definitions (`types/task.ts`)

```typescript
interface Task {
  id: number;
  title: string;
  description: string | null;
  completed: boolean;
  createdAt: string; // ISO date
  updatedAt: string; // ISO date
}

interface CreateTaskInput {
  title: string;
  description?: string;
}

interface UpdateTaskInput {
  title?: string;
  description?: string;
  completed?: boolean;
}

interface TaskFilters {
  status?: 'all' | 'pending' | 'completed';
  sort?: 'created' | 'title';
}
```

### API Client Functions (`lib/api.ts`)

The API client MUST:
- Auto-attach `Authorization: Bearer <token>` header from auth session
- Handle 401 responses by logging out and redirecting to login
- Return typed responses
- Support optimistic updates via TanStack Query integration

```typescript
// Function signatures (implementation details intentionally omitted)

getTasks(filters?: TaskFilters): Promise<Task[]>
getTask(id: number): Promise<Task>
createTask(data: CreateTaskInput): Promise<Task>
updateTask(id: number, data: UpdateTaskInput): Promise<Task>
deleteTask(id: number): Promise<void>
toggleComplete(id: number): Promise<Task>
```

### Data Fetching Pattern

- Use TanStack Query for all data fetching
- Implement optimistic updates for mutations
- Cache task list with appropriate stale time
- Invalidate cache after mutations
- Show loading skeletons during initial fetch
- Background refresh on window focus

---

## Success Criteria

### Measurable Outcomes

- **SC-001**: Users can complete the signup-to-first-task flow in under 2 minutes
- **SC-002**: Task creation from quick-add takes under 2 seconds (perceived)
- **SC-003**: 100% of interactive elements are reachable via keyboard navigation
- **SC-004**: App achieves a Lighthouse accessibility score of 90+
- **SC-005**: Page loads complete within 3 seconds on 3G connection
- **SC-006**: Zero layout shift during page load (CLS < 0.1)
- **SC-007**: All UI elements render correctly on screens from 320px to 2560px width
- **SC-008**: Theme toggle updates all elements within 100ms (no flash)
- **SC-009**: Users can manage 100+ tasks without noticeable performance degradation
- **SC-010**: Error states are communicated clearly within 500ms of occurrence

---

## Assumptions

- Better Auth will be configured with email/password authentication
- API endpoints follow the pattern defined in the project constitution
- JWT tokens are accessible via Better Auth session hooks
- The application will be deployed in an environment supporting Next.js App Router
- Users have modern browsers (Chrome 90+, Firefox 90+, Safari 14+, Edge 90+)

---

## Dependencies

### Runtime Dependencies

- `next` (16+) - React framework
- `react`, `react-dom` (19+) - UI library
- `tailwindcss` (4+) - Styling
- `@tanstack/react-query` - Data fetching and caching
- `better-auth` - Authentication
- `next-themes` - Theme management
- `lucide-react` - Icons
- `zod` - Form validation
- `react-hook-form` - Form management
- `sonner` - Toast notifications
- `class-variance-authority` - Component variants
- `clsx`, `tailwind-merge` - Class utilities

### Development Dependencies

- `typescript` - Type checking
- `eslint`, `eslint-config-next` - Linting
- `prettier`, `prettier-plugin-tailwindcss` - Formatting

---

## Out of Scope

- Backend API implementation
- Database schema and migrations
- Server-side JWT verification logic
- Drag-and-drop task reordering (future enhancement)
- Task categories/tags (future enhancement)
- Due dates and reminders (future enhancement)
- Task search functionality (future enhancement)
- Collaborative features (future enhancement)
- Mobile native apps (future enhancement)

---

**Frontend professional specification complete. Ready for /sp.plan to create detailed implementation architecture.**
