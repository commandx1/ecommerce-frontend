"use client"

import { Edit2, Reply, ThumbsUp, Trash2 } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { useState } from "react"
import PageSectionContainer from "@/components/layout/PageSectionContainer"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import SurfaceCard from "@/components/ui/SurfaceCard"
import { showToast } from "@/components/ui/Toast"
import { fetchReviewsByProduct } from "@/lib/api/product-reviews"
import { useAuthStore } from "@/stores/authStore"
import type { Review, ReviewsResponse } from "../types"
import { formatRelativeDate } from "../utils/relativeDate"
import { resolveSelectedUserProductId } from "../utils/selectedVendor"
import DeleteReviewModal from "./DeleteReviewModal"
import EditReviewModal from "./EditReviewModal"
import StarRating from "./StarRating"
import WriteReviewButton from "./WriteReviewButton"

interface UserProduct {
  id: string
  vendor: string
}

interface ProductReviewsProps {
  productId: string
  initialReviews?: ReviewsResponse | null
  /** Vendor the SSR reviews were fetched for; undefined means they cover all vendors. */
  initialUserProductId?: string
  userProducts: UserProduct[]
}

const ALL_VENDORS = "all" as const

export default function ProductReviews({
  productId,
  initialReviews,
  initialUserProductId,
  userProducts,
}: ProductReviewsProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuthStore()
  const [editingReview, setEditingReview] = useState<Review | null>(null)
  const [deletingReview, setDeletingReview] = useState<Review | null>(null)

  // Which vendor's reviews are being shown. Starts at whatever the server rendered.
  const [activeFilter, setActiveFilter] = useState<string>(initialUserProductId ?? ALL_VENDORS)
  const [fetchedReviews, setFetchedReviews] = useState<ReviewsResponse | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // The vendor selected in the supplier table drives where a *new* review is submitted,
  // independently of which vendor's reviews are currently being read.
  const purchaseUserProductId = resolveSelectedUserProductId(searchParams.get("vendorId"), userProducts)
  const purchaseVendorName = userProducts.find((up) => up.id === purchaseUserProductId)?.vendor

  const activeVendorName = userProducts.find((up) => up.id === activeFilter)?.vendor

  const ssrFilter = initialUserProductId ?? ALL_VENDORS

  /** Loads a slice, falling back to the server-rendered one when it is the slice being asked for. */
  const loadReviews = async (filter: string) => {
    if (filter === ssrFilter) {
      setFetchedReviews(null)
      return
    }

    setIsLoading(true)
    try {
      const result = await fetchReviewsByProduct({
        productId,
        userProductId: filter === ALL_VENDORS ? undefined : filter,
      })
      setFetchedReviews(result)
    } finally {
      setIsLoading(false)
    }
  }

  const handleFilterChange = async (nextFilter: string) => {
    if (nextFilter === activeFilter) return

    const previousFilter = activeFilter
    setActiveFilter(nextFilter)

    try {
      await loadReviews(nextFilter)
    } catch (error) {
      showToast.error((error as Error)?.message || "Failed to load reviews")
      setActiveFilter(previousFilter)
    }
  }

  // Default empty reviews if not provided
  const reviewsData: ReviewsResponse = fetchedReviews ||
    initialReviews || {
      content: [],
      pageable: {
        pageNumber: 0,
        pageSize: 10,
        sort: { empty: true, sorted: false, unsorted: true },
        offset: 0,
        paged: true,
        unpaged: false,
      },
      last: true,
      totalPages: 0,
      totalElements: 0,
      size: 10,
      number: 0,
      sort: { empty: true, sorted: false, unsorted: true },
      numberOfElements: 0,
      first: true,
      empty: true,
    }

  // The backend already scoped this page to the active filter, so no client-side filtering.
  const reviews = reviewsData.content || []
  const reviewCountLabel = reviewsData.totalElements
  const averageRating = reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.star, 0) / reviews.length : 0

  // Calculate rating breakdown
  const ratingBreakdown = [5, 4, 3, 2, 1].map((stars) => {
    const count = reviews.filter((r) => Math.floor(r.star) === stars).length
    const percentage = reviews.length > 0 ? (count / reviews.length) * 100 : 0
    return { stars, count, percentage }
  })

  return (
    <section id="product-reviews" className="bg-surface-muted/45 py-10 sm:py-12">
      <PageSectionContainer as="div">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="mb-2 text-2xl font-semibold text-text-primary sm:text-3xl">Product Reviews</h2>
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center space-x-2">
                <StarRating rating={averageRating} size="lg" className="text-yellow-400" />
                <span className="text-2xl font-bold text-brand">{averageRating.toFixed(1)}</span>
                <span className="text-text-secondary">out of 5</span>
              </div>
              <span className="text-text-secondary">
                Based on {reviewCountLabel} reviews
                {activeVendorName ? ` for ${activeVendorName}` : " across all vendors"}
              </span>
            </div>
          </div>
          <WriteReviewButton
            productId={productId}
            userProductId={purchaseUserProductId}
            vendorName={purchaseVendorName}
          />
        </div>

        {userProducts.length > 1 && (
          <div className="mb-8 flex flex-wrap items-center gap-3">
            <span className="text-sm font-medium text-text-secondary">Show reviews for:</span>
            <Select value={activeFilter} onValueChange={handleFilterChange} disabled={isLoading}>
              <SelectTrigger className="h-9 w-full rounded-full border-border-soft bg-surface px-4 py-2 shadow-soft sm:w-72">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[{ id: ALL_VENDORS, vendor: "All vendors" }, ...userProducts].map((option) => (
                  <SelectItem key={option.id} value={option.id}>
                    {option.vendor}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Rating Breakdown */}
        {!isLoading && reviews.length > 0 && (
          <SurfaceCard className="mb-8 w-full p-5 sm:p-8 lg:w-1/2">
            <div>
              <h3 className="mb-6 text-xl font-semibold text-text-primary">Rating Breakdown</h3>
              <div className="space-y-4">
                {ratingBreakdown.map((breakdown) => (
                  <div key={breakdown.stars} className="flex items-center space-x-4">
                    <span className="w-8 text-sm font-medium text-text-primary">{breakdown.stars}★</span>
                    <div className="h-2 flex-1 rounded-full bg-surface-muted">
                      <div className="bg-yellow-400 h-2 rounded-full" style={{ width: `${breakdown.percentage}%` }} />
                    </div>
                    <span className="w-12 text-sm text-text-secondary">{breakdown.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </SurfaceCard>
        )}

        {/* Individual Reviews */}
        {isLoading ? (
          <div className="space-y-6">
            {Array.from({ length: 3 }, (_, index) => (
              <div
                key={`review-skeleton-${index + 1}`}
                className="h-36 animate-pulse rounded-[1.75rem] bg-surface-muted"
              />
            ))}
          </div>
        ) : reviews.length > 0 ? (
          <div className="space-y-6">
            {reviews.map((review) => (
              <SurfaceCard key={review.id} className="p-5 sm:p-8">
                <div className="flex items-start space-x-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand text-primary-foreground">
                    <span className="text-lg font-semibold">{review.username.charAt(0).toUpperCase()}</span>
                  </div>
                  <div className="flex-1">
                    <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <div className="font-semibold text-text-primary">{review.username}</div>
                      </div>
                      <div className="text-right">
                        <StarRating rating={review.star} size="sm" className="text-yellow-400 mb-1" />
                        <div className="text-sm text-text-muted">{formatRelativeDate(review.createdDate)}</div>
                      </div>
                    </div>
                    <h4 className="mb-3 font-semibold text-text-primary">{review.title}</h4>
                    <p className="mb-4 leading-relaxed text-text-secondary">{review.comment}</p>
                    <div className="flex items-center space-x-6 text-sm text-text-secondary">
                      {user?.id === review.userId && (
                        <>
                          <button
                            type="button"
                            onClick={() => setEditingReview(review)}
                            className="flex items-center space-x-1 transition-colors hover:text-brand"
                          >
                            <Edit2 className="w-4 h-4" />
                            <span>Edit</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingReview(review)}
                            className="flex items-center space-x-1 transition-colors hover:text-danger"
                          >
                            <Trash2 className="w-4 h-4" />
                            <span>Delete</span>
                          </button>
                        </>
                      )}
                      <button type="button" className="flex items-center space-x-1 transition-colors hover:text-brand">
                        <ThumbsUp className="w-4 h-4" />
                        <span>Helpful ({review.peopleFoundHelpful})</span>
                      </button>
                      <button type="button" className="flex items-center space-x-1 transition-colors hover:text-brand">
                        <Reply className="w-4 h-4" />
                        <span>Reply</span>
                      </button>
                    </div>
                  </div>
                </div>
              </SurfaceCard>
            ))}
          </div>
        ) : (
          <SurfaceCard className="p-8 text-center">
            <p className="text-text-secondary">
              {activeFilter !== ALL_VENDORS
                ? "No reviews for this vendor yet."
                : "No reviews yet. Be the first to review this product!"}
            </p>
          </SurfaceCard>
        )}

        {!isLoading && !reviewsData.last && (
          <div className="mt-8 text-center">
            <button
              type="button"
              className="rounded-full bg-brand px-8 py-3 font-medium text-primary-foreground transition-colors hover:bg-brand-strong"
            >
              Load More Reviews
            </button>
          </div>
        )}
      </PageSectionContainer>

      {editingReview && (
        <EditReviewModal
          review={editingReview}
          isOpen={!!editingReview}
          onClose={() => setEditingReview(null)}
          onSuccess={() => {
            setEditingReview(null)
            router.refresh()
          }}
        />
      )}

      {deletingReview && (
        <DeleteReviewModal
          review={deletingReview}
          isOpen={!!deletingReview}
          onClose={() => setDeletingReview(null)}
          onSuccess={() => {
            setDeletingReview(null)
            // Refresh the server data (hero counts, supplier ratings) and reload the visible slice.
            router.refresh()
            loadReviews(activeFilter).catch(() => setFetchedReviews(null))
          }}
        />
      )}
    </section>
  )
}
