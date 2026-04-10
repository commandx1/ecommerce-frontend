"use client"

import { X } from "lucide-react"
import Link from "next/link"
import { useId, useState } from "react"
import NoticeBanner from "@/components/feedback/NoticeBanner"
import { TextAreaField } from "@/components/form/TextAreaField"
import ActionButton from "@/components/ui/ActionButton"
import AsyncSubmitButton from "@/components/ui/AsyncSubmitButton"
import Modal from "@/components/ui/Modal"
import { showToast } from "@/components/ui/Toast"
import { submitProductQuestion } from "@/lib/api/product-qa"
import { useAuthStore } from "@/stores/authStore"

interface UserProduct {
  id: string
  vendor: string
}

interface AskQuestionModalProps {
  productId: string
  userProducts: UserProduct[]
  preSelectedUserProductId?: string
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function AskQuestionModal({
  productId,
  userProducts,
  preSelectedUserProductId,
  isOpen,
  onClose,
  onSuccess,
}: AskQuestionModalProps) {
  const { accessToken, isAuthenticated } = useAuthStore()
  const id = useId()
  const [question, setQuestion] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Get vendor name for display
  const selectedVendor = userProducts.find((up) => up.id === preSelectedUserProductId)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!isAuthenticated) {
      showToast.error("Please log in to ask a question")
      return
    }

    if (!question.trim()) {
      showToast.error("Please enter your question")
      return
    }

    if (!preSelectedUserProductId) {
      showToast.error("Please select a vendor from the supplier table first")
      return
    }

    setIsSubmitting(true)

    try {
      await submitProductQuestion({
        accessToken,
        productId,
        userProductId: preSelectedUserProductId,
        question: question.trim(),
      })

      showToast.success("Your question has been submitted successfully!")
      setQuestion("")
      onClose()
      onSuccess()
    } catch (error) {
      showToast.error((error as Error)?.message || "Failed to submit question. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Ask a Question"
      maxWidthClassName="max-w-2xl"
      closeOnOverlayClick={false}
    >
      <div>
        <div className="flex items-center justify-between border-b border-border-soft p-6">
          <h3 className="text-2xl font-semibold text-text-primary">Ask a Question</h3>
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
            <NoticeBanner tone="warning" description="You need to log in to ask a question." className="rounded-lg" />
          )}

          {isAuthenticated && !preSelectedUserProductId && (
            <NoticeBanner
              tone="warning"
              description="Please select a vendor from the supplier table first."
              className="rounded-lg"
            />
          )}

          {isAuthenticated && preSelectedUserProductId && (
            <>
              <NoticeBanner tone="info" className="rounded-lg" title="Question destination">
                <p className="text-sm font-medium text-text-primary">
                  Question will be sent to:{" "}
                  <span className="font-bold">{selectedVendor?.vendor || "Selected Vendor"}</span>
                </p>
              </NoticeBanner>

              <div className="space-y-2">
                <TextAreaField
                  id={`${id}-question`}
                  label="Your Question"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  rows={5}
                  placeholder="Type your question here..."
                  required
                  disabled={isSubmitting}
                />
                <p className="text-sm text-text-muted">{question.length} characters</p>
              </div>

              <div className="flex items-center justify-end space-x-4">
                <ActionButton type="button" onClick={onClose} intent="outline" disabled={isSubmitting}>
                  Cancel
                </ActionButton>
                <AsyncSubmitButton
                  idleText="Submit Question"
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
                <Link href="/login">Log In to Ask Question</Link>
              </ActionButton>
            </div>
          )}
        </form>
      </div>
    </Modal>
  )
}
