"use client"

import { Reply, ThumbsUp } from "lucide-react"
import Image from "next/image"

interface Reviews {
  overall: {
    rating: number
    reviewCount: number
  }
  ratingBreakdown: Array<{ stars: number; count: number; percentage: number }>
  categoryRatings: Array<{ category: string; rating: number; starCount: number }>
  reviews: Array<{
    id: number
    author: string
    avatar: string
    location: string
    rating: number
    starCount: number
    title: string
    text: string
    helpfulCount: number
    date: string
  }>
}

interface CustomerReviewsProps {
  reviews: Reviews
}

const CustomerReviews = ({ reviews: reviewsData }: CustomerReviewsProps) => {
  const renderStars = (starCount: number, reviewId: number) => {
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

  const renderOverallStars = () => {
    return Array.from({ length: 5 }, (_, i) => {
      const starId = `overall-star-${i + 1}`
      return (
        <svg key={starId} className="w-5 h-5 fill-yellow-400 text-yellow-400" viewBox="0 0 24 24" stroke="currentColor">
          <title>Filled star</title>
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

  const renderCategoryStars = (starCount: number, categoryName: string) => {
    return Array.from({ length: 5 }, (_, i) => {
      const starId = `${categoryName}-star-${i + 1}`
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

  return (
    <section id="customer-reviews" className="bg-light-mint-gray py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-steel-blue mb-2">Customer Reviews</h2>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="flex text-yellow-400 text-lg">{renderOverallStars()}</div>
                <span className="text-2xl font-bold text-steel-blue">{reviewsData.overall.rating}</span>
                <span className="text-gray-600">out of 5</span>
              </div>
              <span className="text-gray-600">Based on {reviewsData.overall.reviewCount} reviews</span>
            </div>
          </div>
          <button
            type="button"
            className="bg-steel-blue text-white px-6 py-3 rounded-lg hover:bg-opacity-90 font-medium transition-colors"
          >
            Write a Review
          </button>
        </div>

        {/* Rating Breakdown */}
        <div className="bg-white rounded-2xl p-8 mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <h3 className="text-xl font-semibold text-steel-blue mb-6">Rating Breakdown</h3>
              <div className="space-y-4">
                {reviewsData.ratingBreakdown.map((breakdown) => (
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
            <div>
              <h3 className="text-xl font-semibold text-steel-blue mb-6">Review Categories</h3>
              <div className="space-y-4">
                {reviewsData.categoryRatings.map((category) => (
                  <div key={category.category} className="flex justify-between items-center">
                    <span className="text-gray-700">{category.category}</span>
                    <div className="flex items-center space-x-2">
                      <div className="flex text-yellow-400 text-sm">
                        {renderCategoryStars(category.starCount, category.category)}
                      </div>
                      <span className="text-sm font-semibold">{category.rating}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Individual Reviews */}
        <div className="space-y-6">
          {reviewsData.reviews.map((review) => (
            <div key={review.id} className="bg-white rounded-2xl p-8">
              <div className="flex items-start space-x-4">
                <Image
                  src={review.avatar}
                  alt={review.author}
                  className="w-12 h-12 rounded-full"
                  width={48}
                  height={48}
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <div className="font-semibold text-steel-blue">{review.author}</div>
                      <div className="text-sm text-gray-600">{review.location}</div>
                    </div>
                    <div className="text-right">
                      <div className="flex text-yellow-400 text-sm mb-1">
                        {renderStars(review.starCount, review.id)}
                      </div>
                      <div className="text-sm text-gray-500">{review.date}</div>
                    </div>
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-3">{review.title}</h4>
                  <p className="text-gray-700 leading-relaxed mb-4">{review.text}</p>
                  <div className="flex items-center space-x-6 text-sm text-gray-600">
                    <button
                      type="button"
                      className="flex items-center space-x-1 hover:text-steel-blue transition-colors"
                    >
                      <ThumbsUp className="w-4 h-4" />
                      <span>Helpful ({review.helpfulCount})</span>
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

        <div className="text-center mt-8">
          <button
            type="button"
            className="bg-steel-blue text-white px-8 py-3 rounded-lg hover:bg-opacity-90 font-medium transition-colors"
          >
            Load More Reviews
          </button>
        </div>
      </div>
    </section>
  )
}

export default CustomerReviews
