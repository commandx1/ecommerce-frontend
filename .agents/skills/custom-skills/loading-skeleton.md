---
name: loading-skeleton
description: Add loading states to components using Suspense boundaries and skeleton UI — never use raw spinners or boolean isLoading checks in JSX
---

# Workflow

## 1. Decide the loading strategy

Before writing any code, answer these two questions:

**Is the data fetched server-side or client-side?**

- Server component (fetch in page.tsx / layout.tsx) → use `<Suspense>` + skeleton
- Client component (SWR / React Query / useEffect) → use conditional skeleton render

**Is this a full page or a sub-section?**

- Full page → Suspense boundary in `page.tsx` or `layout.tsx`
- Sub-section / widget → Suspense boundary wraps only that component

## 2. Suspense boundary placement (server-side / RSC)

Wrap the async component at the closest meaningful boundary — not the whole page unless necessary.

```tsx
// app/claims/page.tsx
import { Suspense } from "react"
import { ClaimsTable } from "@/features/claims/components/ClaimsTable"
import { ClaimsTableSkeleton } from "@/features/claims/components/ClaimsTableSkeleton"
import { ClaimsSummary } from "@/features/claims/components/ClaimsSummary"
import { ClaimsSummarySkeleton } from "@/features/claims/components/ClaimsSummarySkeleton"

export default function ClaimsPage() {
  return (
    <div>
      <Suspense fallback={<ClaimsSummarySkeleton />}>
        <ClaimsSummary />
      </Suspense>
      <Suspense fallback={<ClaimsTableSkeleton />}>
        <ClaimsTable />
      </Suspense>
    </div>
  )
}
```

Rules:

- Each independently loading section gets its own `<Suspense>` — never one wrapper for the whole page
- The `fallback` must match the shape and dimensions of the real component exactly
- Never use a generic spinner as `fallback` — always use a shape-matched skeleton

## 3. Client-side loading state (SWR / React Query)

Do NOT render `{isLoading && <Spinner />}` inline in the component. Instead:

```tsx
// features/claims/components/ClaimsSummaryWidget.tsx
import { ClaimsSummarySkeleton } from "./ClaimsSummarySkeleton"
import { useClaimsSummary } from "../hooks/useClaimsSummary"

export const ClaimsSummaryWidget = () => {
  const { data, isLoading, error } = useClaimsSummary()

  if (isLoading) return <ClaimsSummarySkeleton />
  if (error) return null // or an error state component

  return <ClaimsSummaryContent data={data} />
}
```

Rules:

- Early return for `isLoading` — never inline ternary in JSX
- Skeleton component is always a separate file
- Error state is handled separately from loading state

## 4. Build the skeleton component

The skeleton must mirror the real component's layout precisely — same spacing, same number of rows, same column widths.

```tsx
// features/claims/components/ClaimsTableSkeleton.tsx
export const ClaimsTableSkeleton = () => (
  <div className="space-y-2">
    <SkeletonRow columns={[200, 120, 100, 80, 60]} />
    <SkeletonRow columns={[200, 120, 100, 80, 60]} />
    <SkeletonRow columns={[200, 120, 100, 80, 60]} />
    <SkeletonRow columns={[200, 120, 100, 80, 60]} />
    <SkeletonRow columns={[200, 120, 100, 80, 60]} />
  </div>
)

interface SkeletonRowProps {
  columns: number[]
}

const SkeletonRow = ({ columns }: SkeletonRowProps) => (
  <div className="flex items-center gap-4 p-3 rounded-lg bg-gray-50">
    {columns.map((width, i) => (
      <div key={i} className="h-4 bg-gray-200 rounded animate-pulse" style={{ width }} />
    ))}
  </div>
)
```

## 5. Skeleton patterns by component type

**Card skeleton:**

```tsx
export const CardSkeleton = () => (
  <div className="p-4 rounded-xl border border-gray-100 space-y-3">
    <div className="h-4 w-1/3 bg-gray-200 rounded animate-pulse" />
    <div className="h-8 w-1/2 bg-gray-200 rounded animate-pulse" />
    <div className="h-3 w-full bg-gray-100 rounded animate-pulse" />
  </div>
)
```

**List skeleton:**

```tsx
export const ListSkeleton = ({ count = 5 }: { count?: number }) => (
  <div className="divide-y divide-gray-100">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="flex items-center gap-3 py-3">
        <div className="h-9 w-9 rounded-full bg-gray-200 animate-pulse shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-3 w-1/3 bg-gray-200 rounded animate-pulse" />
          <div className="h-3 w-2/3 bg-gray-100 rounded animate-pulse" />
        </div>
      </div>
    ))}
  </div>
)
```

**Form skeleton:**

```tsx
export const FormSkeleton = () => (
  <div className="space-y-6">
    {Array.from({ length: 4 }).map((_, i) => (
      <div key={i} className="space-y-2">
        <div className="h-3 w-24 bg-gray-200 rounded animate-pulse" />
        <div className="h-10 w-full bg-gray-100 rounded-lg animate-pulse" />
      </div>
    ))}
  </div>
)
```

## 6. Animation

- Always use Tailwind's `animate-pulse` — never write custom CSS animations for skeleton
- Apply `animate-pulse` on each individual block, not on the wrapper
- Do not mix `animate-pulse` with other animations

## 7. File placement

```
features/<feature>/components/
├── ClaimsTable.tsx
├── ClaimsTableSkeleton.tsx     ← always co-located with the real component
├── ClaimsSummary.tsx
└── ClaimsSummarySkeleton.tsx
```

Skeleton file is always next to the real component — never in a global `/skeletons` folder.

## 8. Checklist

- [ ] Suspense boundaries wrap independent sections, not the whole page
- [ ] `fallback` is a shape-matched skeleton, not a spinner
- [ ] Client-side loading uses early return, not inline ternary
- [ ] Skeleton mirrors real component layout (same widths, rows, spacing)
- [ ] `animate-pulse` on individual blocks only
- [ ] Skeleton file co-located with real component
- [ ] Error state handled separately from loading state
- [ ] No `isLoading && <Spinner />` pattern anywhere
