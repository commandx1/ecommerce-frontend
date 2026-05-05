export default function VendorDashboardLayoutSkeleton() {
  const navSkeletonIds = ["nav-1", "nav-2", "nav-3", "nav-4", "nav-5", "nav-6"] as const
  const metricSkeletonIds = ["metric-1", "metric-2", "metric-3", "metric-4"] as const
  const rowSkeletonIds = ["row-1", "row-2", "row-3", "row-4"] as const

  return (
    <div className="flex min-h-screen flex-col bg-canvas animate-pulse">
      <header className="h-16 border-b border-border-soft bg-surface-elevated px-6">
        <div className="mx-auto flex h-full w-full max-w-screen-2xl items-center justify-between">
          <div className="h-8 w-48 rounded-md bg-surface-muted" />
          <div className="h-10 w-10 rounded-full bg-surface-muted" />
        </div>
      </header>

      <div className="flex flex-1">
        <aside className="hidden w-72 border-r border-border-soft bg-surface-elevated p-6 lg:block">
          <div className="mb-8 h-6 w-36 rounded-md bg-surface-muted" />
          <div className="space-y-3">
            {navSkeletonIds.map((id) => (
              <div key={id} className="h-10 w-full rounded-lg bg-surface-muted" />
            ))}
          </div>
        </aside>

        <main className="flex-1 p-8">
          <div className="mb-6 h-10 w-80 rounded-xl bg-surface-muted" />
          <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
            {metricSkeletonIds.map((id) => (
              <div key={id} className="rounded-2xl border border-border-soft bg-surface-elevated p-5">
                <div className="mb-3 h-3 w-24 rounded bg-surface-muted" />
                <div className="h-7 w-20 rounded bg-surface-muted" />
                <div className="mt-3 h-2 w-28 rounded bg-surface-muted" />
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            <div className="rounded-2xl border border-border-soft bg-surface-elevated p-6">
              <div className="mb-4 h-5 w-40 rounded bg-surface-muted" />
              <div className="h-56 w-full rounded-xl bg-surface-muted" />
            </div>
            <div className="rounded-2xl border border-border-soft bg-surface-elevated p-6">
              <div className="mb-4 h-5 w-44 rounded bg-surface-muted" />
              <div className="space-y-3">
                {rowSkeletonIds.map((id) => (
                  <div key={id} className="h-10 w-full rounded-lg bg-surface-muted" />
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
