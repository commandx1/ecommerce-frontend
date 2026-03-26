"use client"

import { Star, X } from "lucide-react"
import { useState } from "react"
import { TextAreaField } from "@/components/form/TextAreaField"
import { TextField } from "@/components/form/TextField"
import Modal from "@/components/ui/Modal"
import { showToast } from "@/components/ui/Toast"
import { createReview } from "@/lib/api/product-reviews"
import { useAuthStore } from "@/stores/authStore"

interface WriteReviewModalProps {
  productId: string
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function WriteReviewModal({ productId, isOpen, onClose, onSuccess }: WriteReviewModalProps) {
  const { accessToken, isAuthenticated } = useAuthStore()
  const [rating, setRating] = useState(0)
  const [hoveredRating, setHoveredRating] = useState(0)
  const [title, setTitle] = useState("")
  const [comment, setComment] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!isAuthenticated) {
      showToast.error("Please log in to write a review")
      return
    }

    if (rating === 0) {
      showToast.error("Please select a rating")
      return
    }

    if (!title.trim()) {
      showToast.error("Please enter a review title")
      return
    }

    if (!comment.trim()) {
      showToast.error("Please enter your review")
      return
    }

    setIsSubmitting(true)

    try {
      await createReview({
        accessToken,
        productId,
        star: rating,
        title: title.trim(),
        comment: comment.trim(),
      })

      showToast.success("Your review has been submitted successfully!")
      setRating(0)
      setTitle("")
      setComment("")
      onClose()
      onSuccess()
    } catch (error) {
      showToast.error((error as Error)?.message || "Failed to submit review. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Write a Review"
      maxWidthClassName="max-w-2xl"
      closeOnOverlayClick={false}
    >
      <div>
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-2xl font-bold text-steel-blue">Write a Review</h3>
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
          {!isAuthenticated && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-yellow-800 text-sm">You need to log in to write a review.</p>
            </div>
          )}

          {isAuthenticated && (
            <>
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
                          star <= (hoveredRating || rating)
                            ? "fill-yellow-400 text-yellow-400"
                            : "fill-none text-gray-300"
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

              <TextField
                id="review-title"
                label="Review Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Summarize your experience"
                required
                disabled={isSubmitting}
              />

              <div className="space-y-2">
                <TextAreaField
                  id="review-comment"
                  label="Your Review"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={6}
                  placeholder="Share your experience with this product..."
                  required
                  disabled={isSubmitting}
                />
                <p className="text-sm text-gray-500">{comment.length} characters</p>
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
                  {isSubmitting ? "Submitting..." : "Submit Review"}
                </button>
              </div>
            </>
          )}

          {!isAuthenticated && (
            <div className="flex items-center justify-center">
              <a
                href="/login"
                className="px-6 py-3 bg-steel-blue text-white rounded-lg hover:bg-opacity-90 transition-colors font-medium"
              >
                Log In to Write Review
              </a>
            </div>
          )}
        </form>
      </div>
    </Modal>
  )
}
