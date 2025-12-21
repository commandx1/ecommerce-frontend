import { Reply, ThumbsUp } from "lucide-react"
import Image from "next/image"
import { getFullImageUrl } from "@/lib/api/products"
import WriteReviewButton from "./WriteReviewButton"

interface Review {
  id: string
  productId: string
  star: number
  userId: string
  username: string
  title: string
  comment: string
  createdDate: string
  peopleFoundHelpful: number
  helpfulTrue?: boolean
}

interface ReviewsResponse {
  content: Review[]
  pageable: {
    pageNumber: number
    pageSize: number
    sort: {
      empty: boolean
      sorted: boolean
      unsorted: boolean
    }
    offset: number
    paged: boolean
    unpaged: boolean
  }
  last: boolean
  totalPages: number
  totalElements: number
  size: number
  number: number
  sort: {
    empty: boolean
    sorted: boolean
    unsorted: boolean
  }
  numberOfElements: number
  first: boolean
  empty: boolean
}

interface ProductReviewsProps {
  productId: string
  initialReviews?: ReviewsResponse
}

function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMs = now.getTime() - date.getTime()
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))

    if (diffInDays === 0) return "Today"
    if (diffInDays === 1) return "1 day ago"
    if (diffInDays < 7) return `${diffInDays} days ago`
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`
    if (diffInDays < 365) return `${Math.floor(diffInDays / 30)} months ago`
    return `${Math.floor(diffInDays / 365)} years ago`
  } catch {
    return dateString
  }
}

function renderStars(starCount: number, reviewId: string) {
  return Array.from({ length: 5 }, (_, i) => {
    const starId = `review-${reviewId}-star-${i + 1}`
    return (
      <svg
        key={starId}
        className={`w-4 h-4 ${i < starCount ? "fill-yellow-400 text-yellow-400" : "fill-none text-gray-300"}`}
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <title>{i < starCount ? "Filled star" : "Empty star"}</title>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
        />
      </svg>
    )
  })
}

function renderOverallStars(rating: number) {
  return Array.from({ length: 5 }, (_, i) => {
    const starId = `overall-star-${i + 1}`
    const filled = i < Math.floor(rating)
    const halfFilled = i === Math.floor(rating) && rating % 1 >= 0.5
    return (
      <svg key={starId} className="w-5 h-5 fill-yellow-400 text-yellow-400" viewBox="0 0 24 24" stroke="currentColor">
        <title>{filled ? "Filled star" : halfFilled ? "Half-filled star" : "Empty star"}</title>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
        />
      </svg>
    )
  })
}

export default function ProductReviews({ productId, initialReviews }: ProductReviewsProps) {
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
    <section id="customer-reviews" className="bg-light-mint-gray py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-steel-blue mb-2">Customer Reviews</h2>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="flex text-yellow-400 text-lg">{renderOverallStars(averageRating)}</div>
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
          <div className="bg-white rounded-2xl p-8 mb-8">
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
          </div>
        )}

        {/* Individual Reviews */}
        {reviews.length > 0 ? (
          <div className="space-y-6">
            {reviews.map((review) => (
              <div key={review.id} className="bg-white rounded-2xl p-8">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-steel-blue rounded-full flex items-center justify-center shrink-0">
                    <span className="text-white font-semibold text-lg">{review.username.charAt(0).toUpperCase()}</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <div className="font-semibold text-steel-blue">{review.username}</div>
                        <div className="text-sm text-gray-600">Verified Purchaser</div>
                      </div>
                      <div className="text-right">
                        <div className="flex text-yellow-400 text-sm mb-1">
                          {renderStars(Math.floor(review.star), review.id)}
                        </div>
                        <div className="text-sm text-gray-500">{formatDate(review.createdDate)}</div>
                      </div>
                    </div>
                    <h4 className="font-semibold text-gray-900 mb-3">{review.title}</h4>
                    <p className="text-gray-700 leading-relaxed mb-4">{review.comment}</p>
                    <div className="flex items-center space-x-6 text-sm text-gray-600">
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
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-8 text-center">
            <p className="text-gray-600">No reviews yet. Be the first to review this product!</p>
          </div>
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
      </div>
    </section>
  )
}
