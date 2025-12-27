"use client"

import { useAuthStore } from "@/stores/authStore"
import { X } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

interface UserProduct {
  id: string
  vendor: string
}

interface AskQuestionModalProps {
  productId: string
  userProducts: UserProduct[]
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function AskQuestionModal({
  productId,
  userProducts,
  isOpen,
  onClose,
  onSuccess,
}: AskQuestionModalProps) {
  const { accessToken, isAuthenticated } = useAuthStore()
  const [question, setQuestion] = useState("")
  const [selectedUserProductId, setSelectedUserProductId] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!isAuthenticated) {
      toast.error("Please log in to ask a question")
      return
    }

    if (!question.trim()) {
      toast.error("Please enter your question")
      return
    }

    if (!selectedUserProductId) {
      toast.error("Please select a vendor")
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch("/api/product-questions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          productId,
          userProductId: selectedUserProductId,
          question: question.trim(),
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to submit question")
      }

      toast.success("Your question has been submitted successfully!")
      setQuestion("")
      setSelectedUserProductId("")
      onClose()
      onSuccess()
    } catch (error) {
      toast.error("Failed to submit question. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
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

          {isAuthenticated && userProducts.length === 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-blue-800 text-sm">No vendors available for this product.</p>
            </div>
          )}

          {isAuthenticated && userProducts.length > 0 && (
            <>
              <div>
                <label htmlFor="vendor" className="block text-sm font-medium text-gray-700 mb-2">
                  Select Vendor
                </label>
                <select
                  id="vendor"
                  value={selectedUserProductId}
                  onChange={(e) => setSelectedUserProductId(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-steel-blue focus:border-transparent"
                  required
                  disabled={isSubmitting}
                >
                  <option value="">Choose a vendor...</option>
                  {userProducts.map((up) => (
                    <option key={up.id} value={up.id}>
                      {up.vendor}
                    </option>
                  ))}
                </select>
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





