import DashboardShellSkeleton from "@/components/dashboard-shared/DashboardShellSkeleton"
import { Skeleton } from "@/components/ui/skeleton"

export default function VendorDashboardLayoutSkeleton() {
  const metricSkeletonIds = ["metric-1", "metric-2", "metric-3", "metric-4"] as const
  const rowSkeletonIds = ["row-1", "row-2", "row-3", "row-4"] as const

  return (
    // sr-only h1: the real "Vendor Dashboard" h1 only mounts once the auth check finishes. Worded
    // differently so a test waiting for that exact name cannot resolve early against this node.
    <DashboardShellSkeleton
      heading="Loading Vendor Dashboard"
      navCount={6}
      brandClassName="h-8 w-48 rounded-md"
      mainClassName="p-8"
    >
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
    </DashboardShellSkeleton>
  )
}
