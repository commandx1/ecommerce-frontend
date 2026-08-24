"use client"

import { MessageSquare, Star } from "lucide-react"
import { useEffect, useState } from "react"
import StarRating from "@/features/products/product-detail/components/StarRating"
import { formatRelativeDate } from "@/features/products/product-detail/utils/relativeDate"
import { getVendorReviewDashboard, type VendorReviewDashboard } from "@/lib/api/vendor-reviews"
import { cn } from "@/lib/utils"
import { useAuthStore } from "@/stores/authStore"
import DashboardPanel from "../components/shared/DashboardPanel"
import { STATUS_TONE_CLASS_MAP } from "../components/shared/dashboardToneMaps"

const STAR_STEPS = [5, 4, 3, 2, 1]

export default function VendorReviewsPage() {
  const { accessToken } = useAuthStore()
  const [data, setData] = useState<VendorReviewDashboard | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!accessToken) {
      setLoading(false)
      return
    }
    setLoading(true)
    setError(false)
    getVendorReviewDashboard(accessToken)
      .then((result) => {
        if (result === null) setError(true)
        else setData(result)
      })
      .finally(() => setLoading(false))
  }, [accessToken])

  const [selectedStars, setSelectedStars] = useState<number | null>(null)

  const allReviews = data?.reviews ?? []
  const reviews = selectedStars === null ? allReviews : allReviews.filter((r) => r.star === selectedStars)
  const totalReviews = data?.totalReviews ?? 0
  const averageRating = data?.averageRating ?? 0
  const positiveReviews = data?.positiveReviews ?? 0
  const positiveRatio = data?.positiveRatio ?? 0
  const reviewedProductsCount = data?.reviewedProducts ?? 0

  const ratingBreakdown = STAR_STEPS.map((stars) => {
    const count = data?.starBreakdown?.[String(stars)] ?? 0
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
        </div>
      </section>

      {error && !loading && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Reviews could not be loaded. Please refresh the page to try again.
        </div>
      )}

      <section className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="rounded-2xl border border-border-soft bg-surface-elevated p-5 shadow-soft">
            <div className="text-sm text-text-secondary">{kpi.label}</div>
            <div className="mt-2 text-2xl font-bold text-text-primary">
              {loading ? <span className="inline-block h-7 w-12 animate-pulse rounded bg-surface-muted" /> : kpi.value}
            </div>
            <div className="mt-1 text-xs text-text-muted">{kpi.hint}</div>
          </div>
        ))}
      </section>

      <div className="mb-8 grid grid-cols-1 gap-8 lg:grid-cols-2">
        <DashboardPanel title="Rating Breakdown" description="Distribution of 1-5 star ratings">
          <div className="space-y-4">
            {loading
              ? STAR_STEPS.map((stars) => (
                  <div key={stars} className="flex items-center gap-3">
                    <div className="w-10 text-sm font-medium text-text-primary">{stars}★</div>
                    <div className="h-2 flex-1 animate-pulse rounded-full bg-surface-muted" />
                    <div className="h-4 w-6 animate-pulse rounded bg-surface-muted" />
                  </div>
                ))
              : ratingBreakdown.map((item) => {
                  const isActive = selectedStars === item.stars
                  return (
                    <button
                      key={`rating-${item.stars}`}
                      type="button"
                      onClick={() => setSelectedStars(isActive ? null : item.stars)}
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

        <DashboardPanel title="Review Health" description="Quick quality signal from latest customer feedback">
          <div className="space-y-4">
            <div className="rounded-xl border border-border-soft bg-surface-muted/70 p-4">
              <div className="mb-2 flex items-center gap-2">
                <Star className="h-4 w-4 text-yellow-400" />
                <span className="text-sm font-medium text-text-primary">Overall score</span>
              </div>
              <div className="flex items-end gap-2">
                {loading ? (
                  <span className="inline-block h-9 w-16 animate-pulse rounded bg-surface-muted" />
                ) : (
                  <>
                    <span className="text-3xl font-bold text-text-primary">{averageRating.toFixed(1)}</span>
                    <span className="pb-1 text-sm text-text-secondary">/ 5.0</span>
                  </>
                )}
              </div>
            </div>
            {loading ? (
              <span className="inline-block h-6 w-48 animate-pulse rounded-full bg-surface-muted" />
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
      </div>

      <DashboardPanel
        title={selectedStars !== null ? `${selectedStars}-Star Reviews` : "Latest Product Reviews"}
        description={
          selectedStars !== null
            ? `Showing ${reviews.length} review${reviews.length !== 1 ? "s" : ""} with ${selectedStars} star${selectedStars !== 1 ? "s" : ""}`
            : "Feedback feed from customers who purchased your products"
        }
        action={
          selectedStars !== null ? (
            <button type="button" onClick={() => setSelectedStars(null)} className="text-sm text-brand hover:underline">
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
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-28 animate-pulse rounded-xl bg-surface-muted" />
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
    </>
  )
}
