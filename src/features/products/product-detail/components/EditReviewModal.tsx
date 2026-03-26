"use client"

import { Star, X } from "lucide-react"
import { useEffect, useId, useState } from "react"
import { TextAreaField } from "@/components/form/TextAreaField"
import { TextField } from "@/components/form/TextField"
import ActionButton from "@/components/ui/ActionButton"
import AsyncSubmitButton from "@/components/ui/AsyncSubmitButton"
import Modal from "@/components/ui/Modal"
import { showToast } from "@/components/ui/Toast"
import { updateReview } from "@/lib/api/product-reviews"
import { useAuthStore } from "@/stores/authStore"

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
  const id = useId()
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!isAuthenticated) {
      showToast.error("Please log in to edit your review")
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
      await updateReview({
        accessToken,
        reviewId: review.id,
        star: rating,
        title: title.trim(),
        comment: comment.trim(),
      })

      showToast.success("Your review has been updated successfully!")
      onClose()
      onSuccess()
    } catch (error) {
      showToast.error((error as Error)?.message || "Failed to update review. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Your Review"
      maxWidthClassName="max-w-2xl"
      closeOnOverlayClick={false}
    >
      <div>
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
            <p className="block text-sm font-medium text-gray-700 mb-2">Your Rating *</p>
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

          <TextField
            id={`${id}-title`}
            label="Review Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Summarize your experience"
            required
            disabled={isSubmitting}
          />

          <div className="space-y-2">
            <TextAreaField
              id={`${id}-comment`}
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
            <ActionButton type="button" onClick={onClose} intent="outline" disabled={isSubmitting}>
              Cancel
            </ActionButton>
            <AsyncSubmitButton
              idleText="Update Review"
              submittingText="Updating..."
              isSubmitting={isSubmitting}
              fullWidth={false}
            />
          </div>
        </form>
      </div>
    </Modal>
  )
}
