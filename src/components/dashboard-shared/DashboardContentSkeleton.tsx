import { Skeleton } from "@/components/ui/skeleton"

const rowSkeletonIds = ["row-1", "row-2", "row-3", "row-4"] as const

interface DashboardContentSkeletonProps {
  /** sr-only heading shown while this stands in for the real page - the real header/sidebar
   *  chrome around it is already on screen by the time this can render (see the loading.tsx
   *  files that use it), so this only ever needs to speak for the content area. */
  label: string
}

/**
 * Shared content-only fallback for `buyer-dashboard/loading.tsx` and `vendor-dashboard/loading.tsx`.
 * A dashboard-root `loading.tsx` is the fallback for every nested route under it (orders,
 * settings, favorites, analytics, ...) that doesn't have its own - there is no single real page
 * shape to mirror, so this is deliberately neutral (a title bar + one panel of placeholder rows)
 * rather than modelled on any specific page (e.g. the vendor overview's metrics/chart layout).
 * Reuses the same `glass-panel`/`Skeleton` primitives BuyerDashboardLayoutSkeleton and
 * VendorDashboardLayoutSkeleton already use, without touching either of those files.
 */
export default function DashboardContentSkeleton({ label }: DashboardContentSkeletonProps) {
  return (
    <div aria-busy="true" className="mx-auto w-full max-w-screen-2xl space-y-6">
      <h1 className="sr-only">{label}</h1>
      <Skeleton className="h-9 w-64 rounded-md" />

      <div className="glass-panel p-4">
        <Skeleton className="mb-4 h-5 w-40 rounded" />
        <div className="space-y-3">
          {rowSkeletonIds.map((id) => (
            <Skeleton key={id} className="h-12 w-full rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  )
}
