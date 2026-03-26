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
    <section className="bg-light-mint-gray py-12">
      <PageSectionContainer as="div">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-steel-blue mb-2">Customer Reviews</h2>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <StarRating rating={averageRating} size="lg" className="text-yellow-400" />
                <span className="text-2xl font-bold text-steel-blue">{averageRating.toFixed(1)}</span>
                <span className="text-gray-600">out of 5</span>
              </div>
              <span className="text-gray-600">Based on {reviewsData.totalElements} reviews</span>
            </div>
          </div>
          <WriteReviewButton productId={productId} />
        </div>

        {/* Rating Breakdown */}
        {reviews.length > 0 && (
          <SurfaceCard className="p-8 mb-8">
            <div>
              <h3 className="text-xl font-semibold text-steel-blue mb-6">Rating Breakdown</h3>
              <div className="space-y-4">
                {ratingBreakdown.map((breakdown) => (
                  <div key={breakdown.stars} className="flex items-center space-x-4">
                    <span className="text-sm font-medium w-8">{breakdown.stars}★</span>
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div className="bg-yellow-400 h-2 rounded-full" style={{ width: `${breakdown.percentage}%` }} />
                    </div>
                    <span className="text-sm text-gray-600 w-12">{breakdown.count}</span>
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
                  <div className="w-12 h-12 bg-steel-blue rounded-full flex items-center justify-center shrink-0">
                    <span className="text-white font-semibold text-lg">{review.username.charAt(0).toUpperCase()}</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <div className="font-semibold text-steel-blue">{review.username}</div>
                      </div>
                      <div className="text-right">
                        <StarRating rating={review.star} size="sm" className="text-yellow-400 mb-1" />
                        <div className="text-sm text-gray-500">{formatRelativeDate(review.createdDate)}</div>
                      </div>
                    </div>
                    <h4 className="font-semibold text-gray-900 mb-3">{review.title}</h4>
                    <p className="text-gray-700 leading-relaxed mb-4">{review.comment}</p>
                    <div className="flex items-center space-x-6 text-sm text-gray-600">
                      {user?.id === review.userId && (
                        <button
                          type="button"
                          onClick={() => setEditingReview(review)}
                          className="flex items-center space-x-1 hover:text-steel-blue transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                          <span>Edit</span>
                        </button>
                      )}
                      <button
                        type="button"
                        className="flex items-center space-x-1 hover:text-steel-blue transition-colors"
                      >
                        <ThumbsUp className="w-4 h-4" />
                        <span>Helpful ({review.peopleFoundHelpful})</span>
                      </button>
                      <button
                        type="button"
                        className="flex items-center space-x-1 hover:text-steel-blue transition-colors"
                      >
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
            <p className="text-gray-600">No reviews yet. Be the first to review this product!</p>
          </SurfaceCard>
        )}

        {!reviewsData.last && (
          <div className="text-center mt-8">
            <button
              type="button"
              className="bg-steel-blue text-white px-8 py-3 rounded-lg hover:bg-opacity-90 font-medium transition-colors"
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
