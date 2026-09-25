import { Star } from "lucide-react"
import DashboardPanel from "@/components/dashboard-shared/DashboardPanel"
import { STATUS_TONE_CLASS_MAP } from "@/components/dashboard-shared/dashboardToneMaps"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

interface ReviewHealthPanelProps {
  averageRating: number
  positiveReviews: number
  positiveRatio: number
  loading: boolean
}

export default function ReviewHealthPanel({
  averageRating,
  positiveReviews,
  positiveRatio,
  loading,
}: ReviewHealthPanelProps) {
  return (
    <DashboardPanel title="Review Health" description="Quick quality signal from latest customer feedback">
      <div className="space-y-4">
        <div className="rounded-xl border border-border-soft bg-surface-muted/70 p-4">
          <div className="mb-2 flex items-center gap-2">
            <Star className="h-4 w-4 text-yellow-400" />
            <span className="text-sm font-medium text-text-primary">Overall score</span>
          </div>
          <div className="flex items-end gap-2">
            {loading ? (
              <Skeleton className="inline-block h-9 w-16 rounded" />
            ) : (
              <>
                <span className="text-3xl font-bold text-text-primary">{averageRating.toFixed(1)}</span>
                <span className="pb-1 text-sm text-text-secondary">/ 5.0</span>
              </>
            )}
          </div>
        </div>
        {loading ? (
          <Skeleton className="inline-block h-6 w-48 rounded-full" />
        ) : (
          <div
            className={cn(
              "inline-flex rounded-full border px-2 py-1 text-xs",
              positiveRatio >= 80 ? STATUS_TONE_CLASS_MAP.success : STATUS_TONE_CLASS_MAP.warning,
            )}
          >
            {positiveReviews} positive reviews ({positiveRatio.toFixed(0)}%)
          </div>
        )}
        <p className="text-sm text-text-secondary">
          Keep response times low on mixed/negative feedback to protect product conversion.
        </p>
      </div>
    </DashboardPanel>
  )
}
