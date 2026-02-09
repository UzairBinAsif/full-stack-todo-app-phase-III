# Tasks: Professional Frontend Todo UI

**Input**: Design documents from `/specs/001-frontend-todo-ui/`
**Prerequisites**: plan.md (required), spec.md (required for user stories)

**Tests**: Tests are NOT explicitly requested in the spec. Manual verification and Lighthouse audits will be used.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Web app**: `frontend/` at repository root (monorepo structure)
- All frontend paths are relative to `frontend/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization, dependencies, and base configuration

- [x] T001 Create Next.js project with TypeScript in `frontend/` using `npx create-next-app@latest frontend --typescript --tailwind --eslint --app --src-dir=false --import-alias="@/*"`
- [x] T002 Install core dependencies: `@tanstack/react-query better-auth next-themes zod react-hook-form @hookform/resolvers lucide-react sonner clsx tailwind-merge class-variance-authority`
- [x] T003 Initialize shadcn/ui with `npx shadcn@latest init` (New York style, Zinc base, CSS variables)
- [x] T004 Install shadcn/ui components: button, input, card, checkbox, dialog, dropdown-menu, avatar, skeleton, sonner, label, separator, sheet, form, textarea, select
- [x] T005 [P] Create folder structure: `components/layout/`, `components/todo/`, `components/auth/`, `components/providers/`, `lib/`, `hooks/`, `types/`
- [x] T006 [P] Configure `tailwind.config.ts` with custom design tokens (success color, fade-in animation)
- [x] T007 [P] Add custom CSS variables to `frontend/app/globals.css` (--success, --success-foreground)
- [x] T008 [P] Create utility function `cn()` in `frontend/lib/utils.ts`
- [x] T009 [P] Create TypeScript types in `frontend/types/task.ts` (Task, CreateTaskInput, UpdateTaskInput, TaskFilters)
- [x] T010 [P] Create TypeScript types in `frontend/types/api.ts` (ApiError, ApiResponse)

**Checkpoint**: Project structure ready, all dependencies installed

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T011 Create ThemeProvider component in `frontend/components/providers/theme-provider.tsx` using next-themes
- [x] T012 Create QueryProvider component in `frontend/components/providers/query-provider.tsx` with TanStack Query client
- [x] T013 Configure root layout in `frontend/app/layout.tsx` with ThemeProvider, QueryProvider, Inter font, and Toaster
- [x] T014 [P] Create Better Auth server config in `frontend/lib/auth.ts` with JWT plugin
- [x] T015 [P] Create Better Auth client in `frontend/lib/auth-client.ts` with useSession, signIn, signUp, signOut exports
- [x] T016 Create auth API route handler in `frontend/app/api/auth/[...all]/route.ts`
- [x] T017 Create API client with JWT auto-attachment in `frontend/lib/api.ts` (fetchWithAuth, ApiError class, tasksApi object)
- [x] T018 [P] Create form validation schemas in `frontend/lib/validations.ts` (loginSchema, signupSchema, taskSchema)
- [x] T019 Create root page in `frontend/app/page.tsx` with redirect to /login or /dashboard based on auth status

**Checkpoint**: Foundation ready - auth, providers, and API client configured

---

## Phase 3: User Story 2 - Authentication Flow (Priority: P1) 🎯 MVP

**Goal**: Users can sign up, log in, and log out securely

**Independent Test**: Complete signup → login → see dashboard → logout → redirected to login

**Note**: Auth is numbered US2 in spec but implemented first as it gates all other features

### Implementation for Authentication

- [x] T020 [P] [US2] Create auth layout in `frontend/app/(auth)/layout.tsx` with centered card, gradient background, logo
- [x] T021 [P] [US2] Create login page in `frontend/app/(auth)/login/page.tsx` with LoginForm component
- [x] T022 [P] [US2] Create signup page in `frontend/app/(auth)/signup/page.tsx` with SignupForm component
- [x] T023 [US2] Create LoginForm component in `frontend/components/auth/login-form.tsx` with email/password fields, validation, error toasts
- [x] T024 [US2] Create SignupForm component in `frontend/components/auth/signup-form.tsx` with name/email/password fields, validation, success redirect
- [x] T025 [US2] Create UserDropdown component in `frontend/components/auth/user-dropdown.tsx` with avatar, name, email, theme toggle, logout
- [x] T026 [US2] Create protected dashboard layout in `frontend/app/(dashboard)/layout.tsx` with session check and redirect

**Checkpoint**: Users can sign up, log in, see protected pages, and log out

---

## Phase 4: User Story 1 - Task Creation (Priority: P1) 🎯 MVP

**Goal**: Logged-in users can quickly add new tasks

**Independent Test**: Log in → add task via quick-add input → see task appear in list immediately

### Implementation for Task Creation

- [x] T027 [P] [US1] Create Header component in `frontend/components/layout/header.tsx` with logo, ThemeToggle, UserDropdown
- [x] T028 [P] [US1] Create ThemeToggle component in `frontend/components/layout/theme-toggle.tsx` with sun/moon icons
- [x] T029 [P] [US1] Create Sidebar component in `frontend/components/layout/sidebar.tsx` with nav items (All Tasks, Today, Completed)
- [x] T030 [P] [US1] Create MobileNav component in `frontend/components/layout/mobile-nav.tsx` using Sheet for mobile sidebar
- [x] T031 [US1] Update dashboard layout in `frontend/app/(dashboard)/layout.tsx` to include Header, Sidebar, MobileNav, main content area
- [x] T032 [US1] Create useTasksQuery hook in `frontend/hooks/use-tasks.ts` with TanStack Query (queryKey, queryFn, staleTime)
- [x] T033 [US1] Create useCreateTaskMutation hook in `frontend/hooks/use-tasks.ts` with optimistic updates (onMutate, onError rollback, onSettled invalidate)
- [x] T034 [US1] Create TaskForm component in `frontend/components/todo/task-form.tsx` with quick-add input, Add button, Zod validation
- [x] T035 [US1] Create TaskList component in `frontend/components/todo/task-list.tsx` with loading/error/empty states, task mapping
- [x] T036 [US1] Create TaskItem component (basic) in `frontend/components/todo/task-item.tsx` with title display and checkbox placeholder
- [x] T037 [US1] Create EmptyState component in `frontend/components/todo/empty-state.tsx` with icon, message, CTA
- [x] T038 [US1] Create LoadingSkeleton component in `frontend/components/todo/loading-skeleton.tsx` with 5 skeleton cards
- [x] T039 [US1] Create dashboard page in `frontend/app/(dashboard)/page.tsx` with title, TaskForm, TaskList

**Checkpoint**: Users can add tasks and see them appear in the list with optimistic UI

---

## Phase 5: User Story 3 - Task Management (Priority: P2)

**Goal**: Users can view, edit, complete, and delete their tasks

**Independent Test**: Create task → toggle complete → edit task → delete task → verify all changes persist

### Implementation for Task Management

- [x] T040 [US3] Create useToggleCompleteMutation hook in `frontend/hooks/use-tasks.ts` with optimistic toggle
- [x] T041 [US3] Create useUpdateTaskMutation hook in `frontend/hooks/use-tasks.ts` with optimistic updates
- [x] T042 [US3] Create useDeleteTaskMutation hook in `frontend/hooks/use-tasks.ts` with optimistic removal and confirmation toast
- [x] T043 [US3] Update TaskItem component in `frontend/components/todo/task-item.tsx` with checkbox toggle, strikethrough styling, description preview
- [x] T044 [US3] Add action menu to TaskItem in `frontend/components/todo/task-item.tsx` with DropdownMenu (Edit, Delete options)
- [x] T045 [US3] Create TaskDialog component in `frontend/components/todo/task-dialog.tsx` for create/edit with title input, description textarea, submit
- [x] T046 [US3] Wire up edit flow in TaskItem: open TaskDialog on edit click, pass task data, handle update mutation
- [x] T047 [US3] Wire up delete flow in TaskItem: confirmation via dialog or direct with toast, handle delete mutation
- [x] T048 [US3] Add hover effects to TaskItem: `hover:bg-accent/50`, `hover:shadow-sm`, action button visibility toggle

**Checkpoint**: Full CRUD operations work with optimistic UI and proper feedback

---

## Phase 6: User Story 4 - Task Filtering & Sorting (Priority: P3)

**Goal**: Users can filter tasks by status and sort by date or title

**Independent Test**: Create multiple tasks (some completed) → filter by Pending → verify only pending shown → sort by title → verify order

### Implementation for Filtering & Sorting

- [x] T049 [US4] Create TaskFilters component in `frontend/components/todo/task-filters.tsx` with status Select (All/Pending/Completed) and sort Select (Created/Title)
- [x] T050 [US4] Add filter state to dashboard page in `frontend/app/(dashboard)/page.tsx` using useState or URL params
- [x] T051 [US4] Update useTasksQuery hook in `frontend/hooks/use-tasks.ts` to accept filters parameter and include in queryKey
- [x] T052 [US4] Update API client getAll in `frontend/lib/api.ts` to pass status and sort query params
- [x] T053 [US4] Update Sidebar navigation in `frontend/components/layout/sidebar.tsx` to set filter via URL params (?status=completed)
- [x] T054 [US4] Add visual indicator for active filter in TaskFilters component (highlighted state)
- [x] T055 [US4] Wire TaskFilters into dashboard page between TaskForm and TaskList

**Checkpoint**: Filters and sorting work, sidebar navigation reflects current filter

---

## Phase 7: User Story 5 - Theme & Accessibility (Priority: P3)

**Goal**: Full dark mode support and WCAG AA accessibility compliance

**Independent Test**: Toggle theme → verify all elements update → navigate with keyboard only → verify all interactive elements reachable

### Implementation for Theme & Accessibility

- [x] T056 [US5] Verify ThemeToggle persists preference via next-themes (localStorage)
- [x] T057 [US5] Add aria-labels to all interactive elements in TaskItem (checkbox, edit button, delete button)
- [x] T058 [US5] Add aria-labels to TaskForm (input, submit button)
- [x] T059 [US5] Ensure focus trap in TaskDialog using shadcn Dialog (built-in)
- [x] T060 [US5] Add keyboard submit (Enter) handling to TaskForm
- [x] T061 [US5] Verify color contrast in both themes using shadcn defaults (WCAG AA compliant)
- [x] T062 [US5] Add focus-visible ring styling to all buttons and inputs via Tailwind classes
- [x] T063 [US5] Add screen reader text (sr-only) for icon-only buttons

**Checkpoint**: Dark mode works seamlessly, keyboard navigation complete, screen reader compatible

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Final polish, error handling, and production readiness

- [x] T064 [P] Create error boundary component in `frontend/app/(dashboard)/error.tsx` with retry button
- [x] T065 [P] Add loading states to all mutation buttons (disabled + spinner while pending)
- [x] T066 [P] Add toast notifications for all operations (create success, update success, delete success, errors)
- [x] T067 [P] Add fade-in animation to TaskItem using `animate-in` class with staggered delays
- [x] T068 Verify responsive design at breakpoints: 320px, 768px, 1280px
- [x] T069 Run Lighthouse audit and fix any accessibility issues (target: 90+ all metrics)
- [x] T070 Clean up console.log statements and ensure no debug code in production
- [x] T071 Create `.env.example` with required environment variables (NEXT_PUBLIC_APP_URL, NEXT_PUBLIC_API_URL, BETTER_AUTH_SECRET)
- [x] T072 Update `frontend/CLAUDE.md` with implementation patterns and component guidelines

**Checkpoint**: Production-ready, polished, accessible frontend

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Story 2 - Auth (Phase 3)**: Depends on Foundational - MUST complete before other stories
- **User Story 1 - Task Creation (Phase 4)**: Depends on Auth (needs protected routes)
- **User Story 3 - Task Management (Phase 5)**: Depends on Task Creation (needs TaskItem base)
- **User Story 4 - Filtering (Phase 6)**: Depends on Task Management (needs task list)
- **User Story 5 - Theme/A11y (Phase 7)**: Can run in parallel with Phase 6
- **Polish (Phase 8)**: Depends on all user stories being complete

### User Story Dependencies

```
Phase 1 (Setup)
     │
     ▼
Phase 2 (Foundational)
     │
     ▼
Phase 3 (Auth - US2) ◄── MVP Milestone 1
     │
     ▼
Phase 4 (Task Creation - US1) ◄── MVP Milestone 2
     │
     ▼
Phase 5 (Task Management - US3)
     │
     ├─────────────────┐
     ▼                 ▼
Phase 6 (Filtering)  Phase 7 (Theme/A11y)
     │                 │
     └────────┬────────┘
              ▼
      Phase 8 (Polish)
```

### Within Each User Story

- Models/Types before hooks
- Hooks before components
- Components before pages
- Core implementation before integration

### Parallel Opportunities

**Phase 1** (all [P] tasks can run in parallel):
- T005, T006, T007, T008, T009, T010

**Phase 2** (these can run in parallel):
- T014, T015 (auth configs)
- T018 (validations)

**Phase 3 - Auth**:
- T020, T021, T022 (pages/layouts)

**Phase 4 - Task Creation**:
- T027, T028, T029, T030 (layout components)

**Phase 8 - Polish**:
- T064, T065, T066, T067 (independent enhancements)

---

## Parallel Execution Example: Phase 4 (Task Creation)

```bash
# Wave 1: Layout components (can run in parallel)
T027 Header component
T028 ThemeToggle component
T029 Sidebar component
T030 MobileNav component

# Wave 2: Data layer
T032 useTasksQuery hook
T033 useCreateTaskMutation hook

# Wave 3: UI components (can run in parallel after Wave 2)
T034 TaskForm component
T035 TaskList component
T036 TaskItem (basic)
T037 EmptyState component
T038 LoadingSkeleton component

# Wave 4: Integration
T031 Update dashboard layout
T039 Dashboard page
```

---

## Implementation Strategy

### MVP Scope (Recommended First Delivery)

**Phase 1 + Phase 2 + Phase 3 + Phase 4** = Minimal Viable Product

This delivers:
- Project setup with all dependencies
- Working authentication (signup/login/logout)
- Task creation with optimistic UI
- Basic task display

### Incremental Delivery

1. **MVP (Phases 1-4)**: Auth + Task Creation
2. **+Phase 5**: Full CRUD (edit, complete, delete)
3. **+Phase 6**: Filtering & Sorting
4. **+Phase 7**: Theme & Accessibility polish
5. **+Phase 8**: Production polish

---

## Summary

| Phase | Story | Tasks | Parallel |
|-------|-------|-------|----------|
| 1 - Setup | - | T001-T010 (10) | 6 |
| 2 - Foundational | - | T011-T019 (9) | 3 |
| 3 - Auth | US2 | T020-T026 (7) | 3 |
| 4 - Task Creation | US1 | T027-T039 (13) | 5 |
| 5 - Task Management | US3 | T040-T048 (9) | 0 |
| 6 - Filtering | US4 | T049-T055 (7) | 0 |
| 7 - Theme/A11y | US5 | T056-T063 (8) | 0 |
| 8 - Polish | - | T064-T072 (9) | 4 |
| **TOTAL** | | **72 tasks** | **21 parallel** |

---

**Tasks generation complete. Ready for `/sp.implement` to begin execution (start with Phase 1: Setup).**
