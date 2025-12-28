"use client"

import { useAuthStore } from "@/stores/authStore"
import { Star, X } from "lucide-react"
import { useState, useEffect } from "react"
import { toast } from "sonner"

interface Review {
  id: string
  star: number
  title: string
  comment: string
}

interface EditReviewModalProps {
  review: Review
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function EditReviewModal({ review, isOpen, onClose, onSuccess }: EditReviewModalProps) {
  const { accessToken, isAuthenticated } = useAuthStore()
  const [rating, setRating] = useState(review.star)
  const [hoveredRating, setHoveredRating] = useState(0)
  const [title, setTitle] = useState(review.title)
  const [comment, setComment] = useState(review.comment)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Update state when review changes
  useEffect(() => {
    setRating(review.star)
    setTitle(review.title)
    setComment(review.comment)
  }, [review])

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!isAuthenticated) {
      toast.error("Please log in to edit your review")
      return
    }

    if (rating === 0) {
      toast.error("Please select a rating")
      return
    }

    if (!title.trim()) {
      toast.error("Please enter a review title")
      return
    }

    if (!comment.trim()) {
      toast.error("Please enter your review")
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch(`/api/reviews/${review.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          star: rating,
          title: title.trim(),
          comment: comment.trim(),
        }),
      })

      if (!response.ok) {
        let errorData = await response.json()

        if (errorData.error?.startsWith("{")) {
          errorData = JSON.parse(errorData.error)
        }

        throw new Error(errorData.message || "Failed to update review")
      }

      toast.success("Your review has been updated successfully!")
      onClose()
      onSuccess()
    } catch (error) {
      toast.error((error as Error)?.message || "Failed to update review. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-2xl font-bold text-steel-blue">Edit Your Review</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={isSubmitting}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Your Rating *</label>
            <div className="flex items-center space-x-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="transition-transform hover:scale-110"
                  disabled={isSubmitting}
                >
                  <Star
                    className={`w-8 h-8 ${
                      star <= (hoveredRating || rating) ? "fill-yellow-400 text-yellow-400" : "fill-none text-gray-300"
                    }`}
                  />
                </button>
              ))}
              {rating > 0 && (
                <span className="ml-2 text-gray-600 font-medium">
                  {rating === 1 && "Poor"}
                  {rating === 2 && "Fair"}
                  {rating === 3 && "Good"}
                  {rating === 4 && "Very Good"}
                  {rating === 5 && "Excellent"}
                </span>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
              Review Title *
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-steel-blue focus:border-transparent"
              placeholder="Summarize your experience"
              required
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-2">
              Your Review *
            </label>
            <textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={6}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-steel-blue focus:border-transparent resize-none"
              placeholder="Share your experience with this product..."
              required
              disabled={isSubmitting}
            />
            <p className="text-sm text-gray-500 mt-2">{comment.length} characters</p>
          </div>

          <div className="flex items-center justify-end space-x-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-3 bg-steel-blue text-white rounded-lg hover:bg-opacity-90 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Updating..." : "Update Review"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
