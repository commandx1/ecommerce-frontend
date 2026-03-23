"use client"

import { X } from "lucide-react"
import { useState } from "react"
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
  const [question, setQuestion] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Get vendor name for display
  const selectedVendor = userProducts.find((up) => up.id === preSelectedUserProductId)

  if (!isOpen) return null

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
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-2xl font-bold text-steel-blue">Ask a Question</h3>
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
              <p className="text-yellow-800 text-sm">You need to log in to ask a question.</p>
            </div>
          )}

          {isAuthenticated && !preSelectedUserProductId && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-yellow-800 text-sm">Please select a vendor from the supplier table first.</p>
            </div>
          )}

          {isAuthenticated && preSelectedUserProductId && (
            <>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm font-medium text-blue-900">
                  Question will be sent to:{" "}
                  <span className="font-bold">{selectedVendor?.vendor || "Selected Vendor"}</span>
                </p>
              </div>

              <div>
                <label htmlFor="question" className="block text-sm font-medium text-gray-700 mb-2">
                  Your Question
                </label>
                <textarea
                  id="question"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  rows={5}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-steel-blue focus:border-transparent resize-none"
                  placeholder="Type your question here..."
                  required
                  disabled={isSubmitting}
                />
                <p className="text-sm text-gray-500 mt-2">{question.length} characters</p>
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
                  {isSubmitting ? "Submitting..." : "Submit Question"}
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
                Log In to Ask Question
              </a>
            </div>
          )}
        </form>
      </div>
    </div>
  )
}
