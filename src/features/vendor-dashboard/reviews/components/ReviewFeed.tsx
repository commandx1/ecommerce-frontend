import { MessageSquare } from "lucide-react"
import DashboardPanel from "@/components/dashboard-shared/DashboardPanel"
import { Skeleton } from "@/components/ui/skeleton"
import StarRating from "@/features/products/product-detail/components/StarRating"
import { formatRelativeDate } from "@/features/products/product-detail/utils/relativeDate"
import type { VendorReviewItem } from "@/lib/api/vendor-reviews"

const SKELETON_ROW_IDS = ["row-1", "row-2", "row-3"] as const

interface ReviewFeedProps {
  reviews: VendorReviewItem[]
  selectedStars: number | null
  onClearStars: () => void
  totalReviews: number
  loading: boolean
}

export default function ReviewFeed({ reviews, selectedStars, onClearStars, totalReviews, loading }: ReviewFeedProps) {
  return (
    <DashboardPanel
      title={selectedStars !== null ? `${selectedStars}-Star Reviews` : "Latest Product Reviews"}
      description={
        selectedStars !== null
          ? `Showing ${reviews.length} review${reviews.length !== 1 ? "s" : ""} with ${selectedStars} star${selectedStars !== 1 ? "s" : ""}`
          : "Feedback feed from customers who purchased your products"
      }
      action={
        selectedStars !== null ? (
          <button type="button" onClick={onClearStars} className="text-sm text-brand hover:underline">
            Show all
          </button>
        ) : (
          <span className="inline-flex items-center gap-1 text-sm text-text-secondary">
            <MessageSquare className="h-4 w-4" />
            {totalReviews} reviews
          </span>
        )
      }
    >
      {loading ? (
        <div className="space-y-4">
          {SKELETON_ROW_IDS.map((id) => (
            <Skeleton key={id} className="h-28 rounded-xl" />
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <p className="py-8 text-center text-sm text-text-muted">
          {selectedStars !== null ? `No ${selectedStars}-star reviews yet.` : "No reviews yet for your products."}
        </p>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <article key={review.id} className="rounded-xl border border-border-soft bg-surface-muted/70 p-4">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="font-semibold text-text-primary">{review.title}</h3>
                  <p className="text-sm text-text-secondary">{review.productName}</p>
                </div>
                <div className="text-right">
                  <StarRating rating={review.star} size="sm" className="justify-end text-yellow-400" />
                  <p className="text-xs text-text-muted">{formatRelativeDate(review.createdDate)}</p>
                </div>
              </div>
              <p className="mb-3 text-sm text-text-secondary">{review.comment}</p>
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="text-text-secondary">
                  {review.reviewerName}
                  {review.reviewerClinic ? ` • ${review.reviewerClinic}` : ""}
                </span>
                {review.peopleFoundHelpful > 0 && (
                  <span className="text-text-muted">{review.peopleFoundHelpful} found helpful</span>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </DashboardPanel>
  )
}
