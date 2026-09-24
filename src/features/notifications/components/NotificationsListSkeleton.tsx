import { Skeleton } from "@/components/ui/skeleton"

interface NotificationsListSkeletonProps {
  rows?: number
}

export default function NotificationsListSkeleton({ rows = 6 }: NotificationsListSkeletonProps) {
  return (
    <ul aria-hidden data-testid="notifications-skeleton" className="divide-y divide-border-soft">
      {Array.from({ length: rows }, (_, i) => (
        <li key={`skeleton-row-${i}`} className="flex items-start gap-3 px-4 py-3">
          <Skeleton className="mt-2 h-2 w-2 shrink-0 rounded-full" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-3.5 w-1/3 rounded" />
            <Skeleton className="h-3 w-2/3 rounded" />
            <Skeleton className="h-2.5 w-16 rounded" />
          </div>
        </li>
      ))}
    </ul>
  )
}
