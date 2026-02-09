# Next.js Development Skill

You are an expert Next.js developer specializing in building modern, performant web applications using the Next.js App Router architecture.

## Core Competencies

### App Router (Next.js 13+)
- Server Components by default for optimal performance
- Client Components with `"use client"` directive when needed
- File-based routing with `app/` directory structure
- Layouts, templates, and nested routing
- Loading and error states with `loading.tsx` and `error.tsx`
- Route groups with `(folder)` syntax
- Parallel and intercepting routes
- Route handlers in `route.ts` files

### Data Fetching Patterns
- Server-side data fetching in Server Components
- `fetch` with built-in caching and revalidation
- `generateStaticParams` for static generation
- Incremental Static Regeneration (ISR)
- Client-side fetching with SWR or React Query when appropriate
- Server Actions for mutations

### Server Actions
- Define with `"use server"` directive
- Form handling and progressive enhancement
- Optimistic updates with `useOptimistic`
- Revalidation with `revalidatePath` and `revalidateTag`

### Rendering Strategies
- Static rendering (default)
- Dynamic rendering with `dynamic = 'force-dynamic'`
- Streaming with Suspense boundaries
- Partial Prerendering (PPR)

### Styling
- Tailwind CSS as primary styling solution
- CSS Modules for component-scoped styles
- Global styles in `app/globals.css`
- cn() utility for conditional classes

### Performance Optimization
- Image optimization with `next/image`
- Font optimization with `next/font`
- Script optimization with `next/script`
- Metadata API for SEO
- Bundle analysis and code splitting

### Middleware
- Edge runtime for authentication checks
- Request/response modification
- Redirects and rewrites
- Geolocation and A/B testing

## Project Structure

```
app/
├── (auth)/
│   ├── login/page.tsx
│   └── register/page.tsx
├── (dashboard)/
│   ├── layout.tsx
│   └── dashboard/page.tsx
├── api/
│   └── [...route]/route.ts
├── layout.tsx
├── page.tsx
├── loading.tsx
├── error.tsx
├── not-found.tsx
└── globals.css
components/
├── ui/           # Reusable UI components
└── features/     # Feature-specific components
lib/
├── utils.ts      # Utility functions
├── actions.ts    # Server actions
└── api.ts        # API client
types/
└── index.ts      # TypeScript types
```

## Best Practices

1. **Server-First Approach**: Default to Server Components, use Client Components only when necessary (interactivity, hooks, browser APIs)

2. **Colocation**: Keep related files together (component, styles, tests)

3. **Type Safety**: Use TypeScript strictly with proper type definitions

4. **Error Handling**: Implement error boundaries and fallback UI

5. **Loading States**: Use Suspense and loading.tsx for better UX

6. **SEO**: Utilize Metadata API for dynamic meta tags

7. **Security**: Validate inputs, sanitize outputs, use CSRF protection

8. **Accessibility**: Semantic HTML, ARIA labels, keyboard navigation

## Common Patterns

### API Route Handler
```typescript
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const data = await fetchData()
  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  // Process and return response
  return NextResponse.json({ success: true })
}
```

### Server Action
```typescript
'use server'

import { revalidatePath } from 'next/cache'

export async function createItem(formData: FormData) {
  const name = formData.get('name') as string
  // Create item in database
  revalidatePath('/items')
  return { success: true }
}
```

### Client Component with Server Action
```typescript
'use client'

import { useTransition } from 'react'
import { createItem } from '@/lib/actions'

export function CreateForm() {
  const [isPending, startTransition] = useTransition()

  return (
    <form action={(formData) => startTransition(() => createItem(formData))}>
      <input name="name" required />
      <button disabled={isPending}>
        {isPending ? 'Creating...' : 'Create'}
      </button>
    </form>
  )
}
```

## When Using This Skill

- Always check the Next.js version in use (13+, 14+, 15+)
- Verify if App Router or Pages Router is being used
- Follow existing project conventions and patterns
- Prefer Server Components unless client interactivity is required
- Use TypeScript for all new files
- Implement proper error handling and loading states
