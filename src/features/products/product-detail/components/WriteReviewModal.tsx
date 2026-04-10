"use client"

import { Star, X } from "lucide-react"
import Link from "next/link"
import { useId, useState } from "react"
import NoticeBanner from "@/components/feedback/NoticeBanner"
import { TextAreaField } from "@/components/form/TextAreaField"
import { TextField } from "@/components/form/TextField"
import ActionButton from "@/components/ui/ActionButton"
import AsyncSubmitButton from "@/components/ui/AsyncSubmitButton"
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
  const id = useId()
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
        <div className="flex items-center justify-between border-b border-border-soft p-6">
          <h3 className="text-2xl font-semibold text-text-primary">Write a Review</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-text-muted transition-colors hover:text-text-primary"
            disabled={isSubmitting}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {!isAuthenticated && (
            <NoticeBanner tone="warning" description="You need to log in to write a review." className="rounded-lg" />
          )}

          {isAuthenticated && (
            <>
              <div>
                <p className="mb-2 block text-sm font-medium text-text-primary">Your Rating *</p>
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
                            : "fill-none text-text-muted"
                        }`}
                      />
                    </button>
                  ))}
                  {rating > 0 && (
                    <span className="ml-2 font-medium text-text-secondary">
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
                <p className="text-sm text-text-muted">{comment.length} characters</p>
              </div>

              <div className="flex items-center justify-end space-x-4">
                <ActionButton type="button" onClick={onClose} intent="outline" disabled={isSubmitting}>
                  Cancel
                </ActionButton>
                <AsyncSubmitButton
                  idleText="Submit Review"
                  submittingText="Submitting..."
                  isSubmitting={isSubmitting}
                  fullWidth={false}
                />
              </div>
            </>
          )}

          {!isAuthenticated && (
            <div className="flex items-center justify-center">
              <ActionButton asChild>
                <Link href="/login">Log In to Write Review</Link>
              </ActionButton>
            </div>
          )}
        </form>
      </div>
    </Modal>
  )
}
