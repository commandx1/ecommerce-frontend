export default function BuyerDashboardLayoutSkeleton() {
  const navSkeletonIds = ["nav-1", "nav-2", "nav-3", "nav-4", "nav-5"] as const
  const cardSkeletonIds = ["card-1", "card-2", "card-3"] as const
  const rowSkeletonIds = ["row-1", "row-2", "row-3", "row-4"] as const

  return (
    <div className="flex min-h-screen flex-col bg-canvas animate-pulse">
      <header className="h-16 border-b border-border-soft bg-surface-elevated px-6">
        <div className="mx-auto flex h-full w-full max-w-screen-2xl items-center justify-between">
          <div className="h-7 w-44 rounded-md bg-surface-muted" />
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

        <main className="flex-1 p-6">
          <div className="mx-auto w-full max-w-screen-2xl space-y-6">
            <div className="h-9 w-64 rounded-md bg-surface-muted" />

            <div className="grid gap-4 md:grid-cols-3">
              {cardSkeletonIds.map((id) => (
                <div key={id} className="h-28 rounded-xl border border-border-soft bg-surface-elevated p-4">
                  <div className="mb-3 h-4 w-24 rounded bg-surface-muted" />
                  <div className="h-6 w-32 rounded bg-surface-muted" />
                </div>
              ))}
            </div>

            <div className="rounded-2xl border border-border-soft bg-surface-elevated p-4">
              <div className="mb-4 h-5 w-40 rounded bg-surface-muted" />
              <div className="space-y-3">
                {rowSkeletonIds.map((id) => (
                  <div key={id} className="h-12 w-full rounded-lg bg-surface-muted" />
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
