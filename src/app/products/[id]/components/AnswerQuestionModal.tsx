"use client"

import { useAuthStore } from "@/stores/authStore"
import { X } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

interface AnswerQuestionModalProps {
  questionId: string
  questionText: string
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function AnswerQuestionModal({
  questionId,
  questionText,
  isOpen,
  onClose,
  onSuccess,
}: AnswerQuestionModalProps) {
  const { accessToken } = useAuthStore()
  const [answer, setAnswer] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!answer.trim()) {
      toast.error("Please enter your answer")
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch("/api/product-answers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          productQuestionId: questionId,
          answer: answer.trim(),
        }),
      })

      if (!response.ok) {
        let errorData = await response.json()

        if (errorData.error.startsWith('{"')) {
          errorData = JSON.parse(errorData.error)
        }

        throw new Error(errorData.message || "Failed to submit answer")
      }

      toast.success("Your answer has been submitted successfully!")
      setAnswer("")
      onClose()
      onSuccess()
    } catch (error) {
      toast.error((error as Error)?.message || "Failed to submit answer. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-2xl font-bold text-steel-blue">Answer Question</h3>
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
          <div className="bg-light-mint-gray rounded-lg p-4">
            <p className="text-sm font-medium text-gray-700 mb-2">Question:</p>
            <p className="text-steel-blue font-semibold">{questionText}</p>
          </div>

          <div>
            <label htmlFor="answer" className="block text-sm font-medium text-gray-700 mb-2">
              Your Answer
            </label>
            <textarea
              id="answer"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              rows={5}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-steel-blue focus:border-transparent resize-none"
              placeholder="Type your answer here..."
              required
              disabled={isSubmitting}
            />
            <p className="text-sm text-gray-500 mt-2">{answer.length} characters</p>
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
              {isSubmitting ? "Submitting..." : "Submit Answer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

