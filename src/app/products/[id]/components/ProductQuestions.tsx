"use client"

import { User } from "lucide-react"
import { useSelectedSupplierStore } from "@/stores/selectedSupplierStore"
import AskQuestionButton from "./AskQuestionButton"
import AnswerQuestionButton from "./AnswerQuestionButton"

interface Answer {
  id: string
  productQuestionId: string
  answererUserId: string
  answererName: string
  answer: string
  createdDate: string
}

interface Question {
  id: string
  productId: string
  userId: string
  questionerName: string
  userProductId: string
  sellerName: string
  question: string
  createdDate: string
  answers: Answer[]
}

interface QuestionsResponse {
  content: Question[]
  pageable: {
    pageNumber: number
    pageSize: number
    sort: {
      empty: boolean
      sorted: boolean
      unsorted: boolean
    }
    offset: number
    paged: boolean
    unpaged: boolean
  }
  last: boolean
  totalPages: number
  totalElements: number
  size: number
  number: number
  sort: {
    empty: boolean
    sorted: boolean
    unsorted: boolean
  }
  numberOfElements: number
  first: boolean
  empty: boolean
}

interface UserProduct {
  id: string
  vendor: string
}

interface ProductQuestionsProps {
  productId: string
  initialQuestions?: QuestionsResponse | null
  userProducts: UserProduct[]
}

function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMs = now.getTime() - date.getTime()
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))

    if (diffInDays === 0) return "Today"
    if (diffInDays === 1) return "1 day ago"
    if (diffInDays < 7) return `${diffInDays} days ago`
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`
    if (diffInDays < 365) return `${Math.floor(diffInDays / 30)} months ago`
    return `${Math.floor(diffInDays / 365)} years ago`
  } catch {
    return dateString
  }
}

export default function ProductQuestions({ productId, initialQuestions, userProducts }: ProductQuestionsProps) {
  // Get selected supplier from Zustand store
  const selectedSupplier = useSelectedSupplierStore((state) => state.selectedSupplier)
  const selectedSupplierUserProductId = selectedSupplier?.userProductId

  // Extract questions from response
  const allQuestions: Question[] = initialQuestions?.content || []

  // Filter questions by selected supplier
  const questions = selectedSupplierUserProductId
    ? allQuestions.filter((q) => q.userProductId === selectedSupplierUserProductId)
    : allQuestions

  const totalQuestions = questions.length
  const hasMoreQuestions = false // Since we're filtering client-side

  // Get user product IDs for vendor check
  const userProductIds = userProducts.map((up) => up.id)

  // Check if current user can answer a specific question
  const canAnswerQuestion = (question: Question) => {
    return userProductIds.includes(question.userProductId)
  }

  return (
    <section id="questions-answers" className="bg-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-steel-blue">Questions & Answers</h2>
            {totalQuestions > 0 && (
              <p className="text-gray-600 mt-2">
                Showing {questions.length} of {totalQuestions} questions
              </p>
            )}
          </div>
          <AskQuestionButton
            productId={productId}
            userProducts={userProducts}
            preSelectedUserProductId={selectedSupplierUserProductId}
          />
        </div>

        {questions.length > 0 ? (
          <div className="space-y-6">
            {questions.map((qa) => {
              const isVendor = canAnswerQuestion(qa)
              return (
                <div key={qa.id} className="bg-light-mint-gray rounded-2xl p-8">
                  <div className="mb-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-steel-blue mb-2">{qa.question}</h3>
                        <div className="text-sm text-gray-600 mb-3">
                          Asked by {qa.questionerName} • {formatDate(qa.createdDate)}
                        </div>
                      </div>
                      {isVendor && qa.answers.length === 0 && (
                        <AnswerQuestionButton questionId={qa.id} questionText={qa.question} />
                      )}
                    </div>
                  </div>
                  {qa.answers && qa.answers.length > 0 ? (
                    <div className="space-y-4">
                      {qa.answers.map((answer) => (
                        <div key={answer.id} className="bg-white rounded-xl p-6">
                          <div className="flex items-start space-x-3">
                            <div className="w-8 h-8 bg-steel-blue rounded-full flex items-center justify-center shrink-0">
                              <User className="text-white text-sm w-4 h-4" />
                            </div>
                            <div className="flex-1">
                              <div className="font-semibold text-steel-blue mb-1">{answer.answererName}</div>
                              <p className="text-gray-700 mb-3">{answer.answer}</p>
                              <div className="text-sm text-gray-500 mt-2">
                                Answered {formatDate(answer.createdDate)}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-white rounded-xl p-6">
                      <p className="text-gray-600 italic">No answer yet.</p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        ) : (
          <div className="bg-light-mint-gray rounded-2xl p-8 text-center">
            <p className="text-gray-600">
              {selectedSupplierUserProductId
                ? "No questions have been asked to this vendor yet."
                : "No questions yet. Be the first to ask a question!"}
            </p>
          </div>
        )}

        {hasMoreQuestions && (
          <div className="text-center mt-8">
            <button
              type="button"
              className="bg-steel-blue text-white px-8 py-3 rounded-lg hover:bg-opacity-90 font-medium transition-colors"
            >
              View All {totalQuestions} Questions
            </button>
          </div>
        )}
      </div>
    </section>
  )
}
