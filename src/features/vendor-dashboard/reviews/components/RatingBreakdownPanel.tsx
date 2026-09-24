import DashboardPanel from "@/app/vendor-dashboard/components/shared/DashboardPanel"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import type { RatingBreakdownEntry } from "../lib/review-stats"

interface RatingBreakdownPanelProps {
  ratingBreakdown: RatingBreakdownEntry[]
  selectedStars: number | null
  onSelectStars: (stars: number) => void
  loading: boolean
}

export default function RatingBreakdownPanel({
  ratingBreakdown,
  selectedStars,
  onSelectStars,
  loading,
}: RatingBreakdownPanelProps) {
  return (
    <DashboardPanel title="Rating Breakdown" description="Distribution of 1-5 star ratings">
      <div className="space-y-4">
        {loading
          ? ratingBreakdown.map((item) => (
              <div key={item.stars} className="flex items-center gap-3">
                <div className="w-10 text-sm font-medium text-text-primary">{item.stars}★</div>
                <Skeleton className="h-2 flex-1 rounded-full" />
                <Skeleton className="h-4 w-6 rounded" />
              </div>
            ))
          : ratingBreakdown.map((item) => {
              const isActive = selectedStars === item.stars
              return (
                <button
                  key={`rating-${item.stars}`}
                  type="button"
                  onClick={() => onSelectStars(item.stars)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg px-2 py-1.5 transition-colors",
                    isActive ? "bg-brand/10 ring-1 ring-brand/30" : "hover:bg-surface-muted/60",
                  )}
                >
                  <div className={cn("w-10 text-sm font-medium", isActive ? "text-brand" : "text-text-primary")}>
                    {item.stars}★
                  </div>
                  <div className="h-2 flex-1 rounded-full bg-surface-muted">
                    <div
                      className="h-2 rounded-full transition-colors bg-brand"
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                  <div
                    className={cn(
                      "w-12 text-right text-sm",
                      isActive ? "font-semibold text-brand" : "text-text-secondary",
                    )}
                  >
                    {item.count}
                  </div>
                </button>
              )
            })}
      </div>
    </DashboardPanel>
  )
}
