---
name: error-boundary
description: Handle runtime errors in Next.js App Router using error.tsx boundaries, not-found.tsx, and client-side ErrorBoundary components — never let unhandled errors show raw Next.js error screens to users
---

# Workflow

## 1. Decide which error boundary to use

Next.js App Router has three distinct error handling mechanisms. Use the right one for each case:

| Error type                     | Solution                              |
| ------------------------------ | ------------------------------------- |
| Async server component throws  | `error.tsx` in the same route segment |
| Page or resource not found     | `not-found.tsx` + `notFound()`        |
| Client component runtime error | `<ErrorBoundary>` wrapper             |
| Global unhandled errors (root) | `app/global-error.tsx`                |
| API / fetch errors in hooks    | `try/catch` → `showToast.error()`     |

Never use a single solution for all cases.

## 2. error.tsx — segment-level boundary

Place `error.tsx` next to the `page.tsx` it protects. It must be a client component.

```tsx
// app/(dashboard)/claims/error.tsx
"use client"

import { useEffect } from "react"
import { AlertTriangle } from "lucide-react"

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function ClaimsError({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log to error reporting service (Sentry, etc.)
    console.error("[ClaimsError]", error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-64 gap-4">
      <div className="flex items-center gap-2 text-red-600">
        <AlertTriangle className="w-5 h-5" />
        <span className="font-semibold">Something went wrong</span>
      </div>
      <p className="text-gray-500 text-sm text-center max-w-sm">
        {error.message ?? "An unexpected error occurred. Please try again."}
      </p>
      <button onClick={reset} className="bg-steel-blue text-white px-4 py-2 rounded-lg text-sm hover:bg-opacity-90">
        Try again
      </button>
    </div>
  )
}
```

Rules:

- Always `"use client"` — error.tsx is always a client component
- Always log the error in `useEffect` before displaying the fallback
- Always provide a `reset` button — never show a dead-end error screen
- `error.digest` is the server-side error ID — log it for traceability
- Never expose raw `error.message` directly without sanitizing in production

## 3. error.tsx placement strategy

Place `error.tsx` at the granularity level that makes sense — not always at the page level.

```
app/
├── error.tsx                         → catches layout-level errors (below root)
├── global-error.tsx                  → catches root layout errors
├── (dashboard)/
│   ├── error.tsx                     → catches all dashboard errors (fallback)
│   ├── claims/
│   │   ├── page.tsx
│   │   └── error.tsx                 → catches claims-specific errors
│   └── settings/
│       ├── page.tsx
│       └── error.tsx                 → catches settings-specific errors
```

Rules:

- Each route segment with a distinct failure mode gets its own `error.tsx`
- A parent `error.tsx` catches errors from all child segments that don't have their own
- `global-error.tsx` must include `<html>` and `<body>` — it replaces the root layout

```tsx
// app/global-error.tsx
"use client"

export default function GlobalError({ error, reset }: ErrorProps) {
  return (
    <html>
      <body>
        <div className="flex flex-col items-center justify-center min-h-screen gap-4">
          <h2 className="text-xl font-semibold">Something went wrong</h2>
          <button onClick={reset}>Try again</button>
        </div>
      </body>
    </html>
  )
}
```

## 4. not-found.tsx + notFound()

Use `notFound()` for missing resources — never throw a generic error for 404s.

```tsx
// app/(dashboard)/claims/[id]/page.tsx
import { notFound } from "next/navigation"
import { claimsService } from "@/features/claims/claimsService"

export default async function ClaimDetailPage({ params }: { params: { id: string } }) {
  const claim = await claimsService.getById(params.id)

  if (!claim) notFound() // ← triggers not-found.tsx

  return <ClaimDetail claim={claim} />
}
```

```tsx
// app/(dashboard)/claims/[id]/not-found.tsx
import Link from "next/link"

export default function ClaimNotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-64 gap-4">
      <p className="text-gray-500">Claim not found or has been removed.</p>
      <Link href="/claims" className="text-steel-blue text-sm hover:underline">
        Back to Claims
      </Link>
    </div>
  )
}
```

Rules:

- `notFound()` immediately stops rendering and triggers `not-found.tsx`
- Always place `not-found.tsx` in the same segment as the page that calls `notFound()`
- Never redirect to a 404 page manually — use `notFound()`

## 5. Client-side ErrorBoundary (for client components)

`error.tsx` does not catch errors thrown inside client components during rendering. Use a reusable `<ErrorBoundary>` for these.

```tsx
// components/ErrorBoundary.tsx
"use client"

import { Component, type ReactNode } from "react"

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    console.error("[ErrorBoundary]", error, info.componentStack)
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div className="p-4 rounded-lg bg-red-50 border border-red-100 text-sm text-red-600">
            This section failed to load.
          </div>
        )
      )
    }
    return this.props.children
  }
}
```

Usage — wrap individual widgets, not whole pages:

```tsx
<ErrorBoundary fallback={<p className="text-sm text-red-500">Chart failed to load.</p>}>
  <RevenueChart />
</ErrorBoundary>
```

Rules:

- `ErrorBoundary` must be a class component — hooks cannot catch render errors
- Wrap individual risky widgets, not entire pages
- Always pass a custom `fallback` that matches the widget size — no full-page error states for a single widget
- `error.tsx` and `<ErrorBoundary>` can be combined: `error.tsx` for async server errors, `<ErrorBoundary>` for client render errors

## 6. API errors in hooks — never let them bubble up unhandled

Errors from API calls in hooks must be caught and shown via `showToast`, not allowed to crash the component tree.

```ts
// WRONG — unhandled rejection crashes the component or silently fails
const fetchClaims = async () => {
  const data = await claimsService.getAll()
  setClaims(data)
}

// CORRECT — always catch, always inform the user
const fetchClaims = async () => {
  try {
    const data = await claimsService.getAll()
    setClaims(data)
  } catch (err) {
    if (axios.isAxiosError(err)) {
      showToast.error("Failed to load claims", err.response?.data?.message ?? err.message)
    } else {
      showToast.error("Failed to load claims", "An unexpected error occurred")
    }
  }
}
```

Rules:

- Every async call in a hook must be wrapped in `try/catch`
- Use `axios.isAxiosError()` to distinguish network errors from unexpected errors
- API errors → `showToast.error()`, never `console.error()` alone
- Never let an API error propagate to trigger `error.tsx` — that is for unexpected crashes only

## 7. Error reporting

Every `error.tsx` and `ErrorBoundary.componentDidCatch` must log the error. When an error reporting service (Sentry) is integrated, call it here — never scattered throughout components.

```tsx
// utils/reportError.ts
export const reportError = (error: Error, context?: Record<string, unknown>) => {
  console.error("[Error]", error, context)
  // Sentry.captureException(error, { extra: context })  ← uncomment when Sentry is set up
}
```

```tsx
// In error.tsx
useEffect(() => {
  reportError(error, { digest: error.digest, page: "claims" })
}, [error])

// In ErrorBoundary
componentDidCatch(error: Error, info: { componentStack: string }) {
  reportError(error, { componentStack: info.componentStack })
}
```

## 8. Checklist

- [ ] Every route segment with a distinct failure mode has its own `error.tsx`
- [ ] `global-error.tsx` exists at the root with `<html>` and `<body>`
- [ ] `error.tsx` is always `"use client"` and always has a `reset` button
- [ ] `notFound()` used for missing resources — no manual 404 redirects
- [ ] `not-found.tsx` co-located with the page that calls `notFound()`
- [ ] Risky client components wrapped with `<ErrorBoundary>`, not relying on `error.tsx` alone
- [ ] Every async call in hooks has `try/catch` → `showToast.error()`
- [ ] All errors logged via `reportError()` — no silent failures
- [ ] Raw `error.message` never directly shown to users in production
