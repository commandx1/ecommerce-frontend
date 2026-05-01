import { Download, MessageSquare, Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import StarRating from "@/features/products/product-detail/components/StarRating"
import { formatRelativeDate } from "@/features/products/product-detail/utils/relativeDate"
import { cn } from "@/lib/utils"
import DashboardPanel from "../components/shared/DashboardPanel"
import { STATUS_TONE_CLASS_MAP } from "../components/shared/dashboardToneMaps"
import { VENDOR_REVIEWS } from "./mock-data"

const ratingSteps = [5, 4, 3, 2, 1]

export default function VendorReviewsPage() {
  const totalReviews = VENDOR_REVIEWS.length
  const averageRating =
    totalReviews > 0 ? VENDOR_REVIEWS.reduce((sum, review) => sum + review.rating, 0) / totalReviews : 0
  const positiveReviews = VENDOR_REVIEWS.filter((review) => review.rating >= 4).length
  const positiveRatio = totalReviews > 0 ? (positiveReviews / totalReviews) * 100 : 0
  const reviewedProductsCount = new Set(VENDOR_REVIEWS.map((review) => review.productId)).size

  const ratingBreakdown = ratingSteps.map((stars) => {
    const count = VENDOR_REVIEWS.filter((review) => review.rating === stars).length
    const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0
    return { stars, count, percentage }
  })

  const kpis = [
    { label: "Average Rating", value: averageRating.toFixed(1), hint: "Across vendor product reviews" },
    { label: "Total Reviews", value: String(totalReviews), hint: "All review records in this feed" },
    { label: "Positive Ratio", value: `${positiveRatio.toFixed(0)}%`, hint: "4-5 star review share" },
    { label: "Reviewed Products", value: String(reviewedProductsCount), hint: "Unique products with feedback" },
  ]

  return (
    <>
      <section className="mb-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-text-primary">Reviews</h1>
            <p className="mt-1 text-text-secondary">Customer feedback for your listed products.</p>
          </div>
          <Button type="button" variant="default" className="rounded-xl px-4">
            <Download className="mr-2 h-4 w-4" />
            Export Reviews
          </Button>
        </div>
      </section>

      <section className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="rounded-2xl border border-border-soft bg-surface-elevated p-5 shadow-soft">
            <div className="text-sm text-text-secondary">{kpi.label}</div>
            <div className="mt-2 text-2xl font-bold text-text-primary">{kpi.value}</div>
            <div className="mt-1 text-xs text-text-muted">{kpi.hint}</div>
          </div>
        ))}
      </section>

      <div className="mb-8 grid grid-cols-1 gap-8 lg:grid-cols-2">
        <DashboardPanel title="Rating Breakdown" description="Distribution of 1-5 star ratings">
          <div className="space-y-4">
            {ratingBreakdown.map((item) => (
              <div key={`rating-${item.stars}`} className="flex items-center gap-3">
                <div className="w-10 text-sm font-medium text-text-primary">{item.stars}★</div>
                <div className="h-2 flex-1 rounded-full bg-surface-muted">
                  <div className="h-2 rounded-full bg-brand" style={{ width: `${item.percentage}%` }}></div>
                </div>
                <div className="w-12 text-right text-sm text-text-secondary">{item.count}</div>
              </div>
            ))}
          </div>
        </DashboardPanel>

        <DashboardPanel title="Review Health" description="Quick quality signal from latest customer feedback">
          <div className="space-y-4">
            <div className="rounded-xl border border-border-soft bg-surface-muted/70 p-4">
              <div className="mb-2 flex items-center gap-2">
                <Star className="h-4 w-4 text-yellow-400" />
                <span className="text-sm font-medium text-text-primary">Overall score</span>
              </div>
              <div className="flex items-end gap-2">
                <span className="text-3xl font-bold text-text-primary">{averageRating.toFixed(1)}</span>
                <span className="pb-1 text-sm text-text-secondary">/ 5.0</span>
              </div>
            </div>
            <div
              className={cn(
                "inline-flex rounded-full border px-2 py-1 text-xs",
                positiveRatio >= 80 ? STATUS_TONE_CLASS_MAP.success : STATUS_TONE_CLASS_MAP.warning,
              )}
            >
              {positiveReviews} positive reviews ({positiveRatio.toFixed(0)}%)
            </div>
            <p className="text-sm text-text-secondary">
              Keep response times low on mixed/negative feedback to protect product conversion.
            </p>
          </div>
        </DashboardPanel>
      </div>

      <DashboardPanel
        title="Latest Product Reviews"
        description="Feedback feed from customers who purchased your products"
        action={
          <span className="inline-flex items-center gap-1 text-sm text-text-secondary">
            <MessageSquare className="h-4 w-4" />
            Mock feed
          </span>
        }
      >
        <div className="space-y-4">
          {VENDOR_REVIEWS.map((review) => (
            <article key={review.id} className="rounded-xl border border-border-soft bg-surface-muted/70 p-4">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="font-semibold text-text-primary">{review.title}</h3>
                  <p className="text-sm text-text-secondary">{review.productName}</p>
                </div>
                <div className="text-right">
                  <StarRating rating={review.rating} size="sm" className="justify-end text-yellow-400" />
                  <p className="text-xs text-text-muted">{formatRelativeDate(review.createdDate)}</p>
                </div>
              </div>
              <p className="mb-3 text-sm text-text-secondary">{review.comment}</p>
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="text-text-secondary">
                  {review.reviewerName} • {review.reviewerClinic}
                </span>
                {review.verifiedPurchase ? (
                  <span className={`inline-flex rounded-full border px-2 py-0.5 ${STATUS_TONE_CLASS_MAP.info}`}>
                    Verified purchase
                  </span>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      </DashboardPanel>
    </>
  )
}
