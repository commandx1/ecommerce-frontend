"use client"

import SectionHeading from "@/components/layout/SectionHeading"
import RatingBreakdownPanel from "./components/RatingBreakdownPanel"
import ReviewFeed from "./components/ReviewFeed"
import ReviewHealthPanel from "./components/ReviewHealthPanel"
import ReviewKpiCards, { type ReviewKpi } from "./components/ReviewKpiCards"
import { useVendorReviewsPage } from "./hooks/useVendorReviewsPage"

export default function VendorReviewsPage() {
  const {
    loading,
    error,
    selectedStars,
    setSelectedStars,
    reviews,
    totalReviews,
    averageRating,
    positiveReviews,
    positiveRatio,
    reviewedProductsCount,
    ratingBreakdown,
  } = useVendorReviewsPage()

  const kpis: ReviewKpi[] = [
    { label: "Average Rating", value: averageRating.toFixed(1), hint: "Across vendor product reviews" },
    { label: "Total Reviews", value: String(totalReviews), hint: "All review records in this feed" },
    { label: "Positive Ratio", value: `${positiveRatio.toFixed(0)}%`, hint: "4-5 star review share" },
    { label: "Reviewed Products", value: String(reviewedProductsCount), hint: "Unique products with feedback" },
  ]

  return (
    <>
      <section className="mb-8">
        <SectionHeading
          titleAs="h1"
          variant="technical"
          title="Reviews"
          description="Customer feedback for your listed products."
        />
      </section>

      {error && !loading && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Reviews could not be loaded. Please refresh the page to try again.
        </div>
      )}

      <ReviewKpiCards kpis={kpis} loading={loading} />

      <div className="mb-8 grid grid-cols-1 gap-8 lg:grid-cols-2">
        <RatingBreakdownPanel
          ratingBreakdown={ratingBreakdown}
          selectedStars={selectedStars}
          onSelectStars={(stars) => setSelectedStars(selectedStars === stars ? null : stars)}
          loading={loading}
        />
        <ReviewHealthPanel
          averageRating={averageRating}
          positiveReviews={positiveReviews}
          positiveRatio={positiveRatio}
          loading={loading}
        />
      </div>

      <ReviewFeed
        reviews={reviews}
        selectedStars={selectedStars}
        onClearStars={() => setSelectedStars(null)}
        totalReviews={totalReviews}
        loading={loading}
      />
    </>
  )
}
