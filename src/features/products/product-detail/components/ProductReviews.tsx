"use client"

import { Edit2, Reply, ThumbsUp } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import PageSectionContainer from "@/components/layout/PageSectionContainer"
import SurfaceCard from "@/components/ui/SurfaceCard"
import { useAuthStore } from "@/stores/authStore"
import type { Review, ReviewsResponse } from "../types"
import { formatRelativeDate } from "../utils/relativeDate"
import EditReviewModal from "./EditReviewModal"
import StarRating from "./StarRating"
import WriteReviewButton from "./WriteReviewButton"

interface ProductReviewsProps {
  productId: string
  initialReviews?: ReviewsResponse | null
}

export default function ProductReviews({ productId, initialReviews }: ProductReviewsProps) {
  const router = useRouter()
  const { user } = useAuthStore()
  const [editingReview, setEditingReview] = useState<Review | null>(null)

  // Default empty reviews if not provided
  const reviewsData: ReviewsResponse = initialReviews || {
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

  const reviews = reviewsData.content || []
  const averageRating = reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.star, 0) / reviews.length : 0

  // Calculate rating breakdown
  const ratingBreakdown = [5, 4, 3, 2, 1].map((stars) => {
    const count = reviews.filter((r) => Math.floor(r.star) === stars).length
    const percentage = reviews.length > 0 ? (count / reviews.length) * 100 : 0
    return { stars, count, percentage }
  })

  return (
    <section id="product-reviews" className="bg-surface-muted/45 py-12">
      <PageSectionContainer as="div">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="mb-2 text-3xl font-semibold text-text-primary">Product Reviews</h2>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <StarRating rating={averageRating} size="lg" className="text-yellow-400" />
                <span className="text-2xl font-bold text-brand">{averageRating.toFixed(1)}</span>
                <span className="text-text-secondary">out of 5</span>
              </div>
              <span className="text-text-secondary">Based on {reviewsData.totalElements} reviews</span>
            </div>
          </div>
          <WriteReviewButton productId={productId} />
        </div>

        {/* Rating Breakdown */}
        {reviews.length > 0 && (
          <SurfaceCard className="mb-8 w-full p-8 lg:w-1/2">
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
        {reviews.length > 0 ? (
          <div className="space-y-6">
            {reviews.map((review) => (
              <SurfaceCard key={review.id} className="p-8">
                <div className="flex items-start space-x-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand text-primary-foreground">
                    <span className="text-lg font-semibold">{review.username.charAt(0).toUpperCase()}</span>
                  </div>
                  <div className="flex-1">
                    <div className="mb-2 flex items-center justify-between">
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
                        <button
                          type="button"
                          onClick={() => setEditingReview(review)}
                          className="flex items-center space-x-1 transition-colors hover:text-brand"
                        >
                          <Edit2 className="w-4 h-4" />
                          <span>Edit</span>
                        </button>
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
            <p className="text-text-secondary">No reviews yet. Be the first to review this product!</p>
          </SurfaceCard>
        )}

        {!reviewsData.last && (
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
    </section>
  )
}
