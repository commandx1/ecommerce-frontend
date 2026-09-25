import { Skeleton } from "@/components/ui/skeleton"

export default function BuyerDashboardLayoutSkeleton() {
  const navSkeletonIds = ["nav-1", "nav-2", "nav-3", "nav-4", "nav-5"] as const
  const cardSkeletonIds = ["card-1", "card-2", "card-3"] as const
  const rowSkeletonIds = ["row-1", "row-2", "row-3", "row-4"] as const

  return (
    <div data-theme-scope="dashboard" className="relative isolate flex min-h-screen flex-col">
      <div className="dashboard-backdrop" aria-hidden />
      {/* sr-only: the real page's h1 ("Welcome back, ...!" in WelcomeSection) only
          mounts once auth-check/hydration finishes; this skeleton renders first,
          so without this the page has zero headings while it's up. */}
      <h1 className="sr-only">Buyer Dashboard</h1>
      <header className="h-16 glass-strip px-6">
        <div className="mx-auto flex h-full w-full max-w-screen-2xl items-center justify-between">
          <Skeleton className="h-7 w-44 rounded-md" />
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

        <main className="flex-1 p-6">
          <div className="mx-auto w-full max-w-screen-2xl space-y-6">
            <Skeleton className="h-9 w-64 rounded-md" />

            <div className="grid gap-4 md:grid-cols-3">
              {cardSkeletonIds.map((id) => (
                <div key={id} className="h-28 glass-panel p-4">
                  <Skeleton className="mb-3 h-4 w-24 rounded" />
                  <Skeleton className="h-6 w-32 rounded" />
                </div>
              ))}
            </div>

            <div className="glass-panel p-4">
              <Skeleton className="mb-4 h-5 w-40 rounded" />
              <div className="space-y-3">
                {rowSkeletonIds.map((id) => (
                  <Skeleton key={id} className="h-12 w-full rounded-lg" />
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
