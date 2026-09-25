import DashboardShellSkeleton from "@/components/dashboard-shared/DashboardShellSkeleton"
import { Skeleton } from "@/components/ui/skeleton"

export default function BuyerDashboardLayoutSkeleton() {
  const cardSkeletonIds = ["card-1", "card-2", "card-3"] as const
  const rowSkeletonIds = ["row-1", "row-2", "row-3", "row-4"] as const

  return (
    // sr-only h1: the real page's h1 ("Welcome back, ...!" in WelcomeSection) only mounts once
    // auth-check/hydration finishes; this skeleton renders first, so without this the page has
    // zero headings while it's up (design doc §3; regression guard, see the co-located test).
    <DashboardShellSkeleton
      heading="Buyer Dashboard"
      navCount={5}
      brandClassName="h-7 w-44 rounded-md"
      mainClassName="p-6"
    >
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
    </DashboardShellSkeleton>
  )
}
