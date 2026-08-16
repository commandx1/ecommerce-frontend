"use client"

import { X } from "lucide-react"
import { useState } from "react"
import ActionButton from "@/components/ui/ActionButton"
import Modal from "@/components/ui/Modal"
import { showToast } from "@/components/ui/Toast"
import { deleteReview } from "@/lib/api/product-reviews"
import { useAuthStore } from "@/stores/authStore"

interface DeleteReviewModalProps {
  review: { id: string; title: string }
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function DeleteReviewModal({ review, isOpen, onClose, onSuccess }: DeleteReviewModalProps) {
  const { accessToken } = useAuthStore()
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    setIsDeleting(true)

    try {
      await deleteReview({ accessToken, reviewId: review.id })

      showToast.success("Your review has been deleted.")
      onClose()
      onSuccess()
    } catch (error) {
      showToast.error((error as Error)?.message || "Failed to delete review. Please try again.")
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Delete Review" closeOnOverlayClick={false}>
      <div>
        <div className="flex items-center justify-between border-b border-border-soft p-6">
          <h3 className="text-xl font-semibold text-text-primary">Delete Review</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-text-muted transition-colors hover:text-text-primary"
            disabled={isDeleting}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4 p-6">
          <p className="text-text-secondary">
            Are you sure you want to delete your review{" "}
            <span className="font-semibold text-text-primary">“{review.title}”</span>? This cannot be undone.
          </p>

          <div className="flex items-center justify-end gap-3">
            <ActionButton type="button" onClick={onClose} intent="outline" disabled={isDeleting}>
              Cancel
            </ActionButton>
            <ActionButton type="button" onClick={handleDelete} intent="danger" disabled={isDeleting}>
              {isDeleting ? "Deleting..." : "Delete Review"}
            </ActionButton>
          </div>
        </div>
      </div>
    </Modal>
  )
}
