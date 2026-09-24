import { Skeleton } from "@/components/ui/skeleton"

export default function VendorDashboardLayoutSkeleton() {
  const navSkeletonIds = ["nav-1", "nav-2", "nav-3", "nav-4", "nav-5", "nav-6"] as const
  const metricSkeletonIds = ["metric-1", "metric-2", "metric-3", "metric-4"] as const
  const rowSkeletonIds = ["row-1", "row-2", "row-3", "row-4"] as const

  return (
    <div data-theme-scope="dashboard" className="relative isolate flex min-h-screen flex-col">
      <div className="dashboard-backdrop" aria-hidden />
      {/* sr-only: the real page's h1 ("Vendor Dashboard" in VendorWelcomeHeader) only
          mounts once auth-check/hydration finishes; this skeleton renders first,
          so without this the page has zero headings while it's up. Deliberately
          worded differently from that final heading so a test waiting for the
          exact "Vendor Dashboard" accessible name can't resolve early against
          this transient node (see CartLoadingState for the same footgun). */}
      <h1 className="sr-only">Loading Vendor Dashboard</h1>
      <header className="h-16 glass-strip px-6">
        <div className="mx-auto flex h-full w-full max-w-screen-2xl items-center justify-between">
          <Skeleton className="h-8 w-48 rounded-md" />
          <Skeleton className="h-10 w-10 rounded-full" />
        </div>
      </header>

      <div className="flex flex-1">
        <aside className="hidden w-[3.05rem] shrink-0 md:mt-3 md:ml-3 md:block md:h-[calc(100vh-5.5rem)] glass-panel p-2">
          <div className="flex flex-col items-center gap-2">
            {navSkeletonIds.map((id) => (
              <Skeleton key={id} className="h-8 w-8 rounded-md" />
            ))}
          </div>
        </aside>

        <main className="flex-1 p-8">
          <Skeleton className="mb-6 h-10 w-80 rounded-xl" />
          <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
            {metricSkeletonIds.map((id) => (
              <div key={id} className="glass-panel p-5">
                <Skeleton className="mb-3 h-3 w-24 rounded" />
                <Skeleton className="h-7 w-20 rounded" />
                <Skeleton className="mt-3 h-2 w-28 rounded" />
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            <div className="glass-panel p-6">
              <Skeleton className="mb-4 h-5 w-40 rounded" />
              <Skeleton className="h-56 w-full rounded-xl" />
            </div>
            <div className="glass-panel p-6">
              <Skeleton className="mb-4 h-5 w-44 rounded" />
              <div className="space-y-3">
                {rowSkeletonIds.map((id) => (
                  <Skeleton key={id} className="h-10 w-full rounded-lg" />
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
