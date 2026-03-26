"use client"

import { User } from "lucide-react"
import PageSectionContainer from "@/components/layout/PageSectionContainer"
import SectionHeading from "@/components/layout/SectionHeading"
import { useSelectedSupplierStore } from "@/stores/selectedSupplierStore"
import type { Question, QuestionsResponse } from "../types"
import { formatRelativeDate } from "../utils/relativeDate"
import AskQuestionButton from "./AskQuestionButton"

interface UserProduct {
  id: string
  vendor: string
}

interface ProductQuestionsProps {
  productId: string
  initialQuestions?: QuestionsResponse | null
  userProducts: UserProduct[]
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

  const totalQuestions = allQuestions.length
  const hasMoreQuestions = false // Since we're filtering client-side

  return (
    <PageSectionContainer as="section" className="bg-white py-12">
      <SectionHeading
        title="Questions & Answers"
        description={totalQuestions > 0 ? `Showing ${questions.length} of ${totalQuestions} questions` : undefined}
        className="mb-8"
        actions={
          <AskQuestionButton
            productId={productId}
            userProducts={userProducts}
            preSelectedUserProductId={selectedSupplierUserProductId}
          />
        }
      />

      {questions.length > 0 ? (
        <div className="space-y-6">
          {questions.map((qa) => {
            return (
              <div key={qa.id} className="bg-light-mint-gray rounded-2xl p-8">
                <div className="mb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-steel-blue mb-2">{qa.question}</h3>
                      <div className="text-sm text-gray-600 mb-3">
                        Asked by {qa.questionerName} • {formatRelativeDate(qa.createdDate)}
                      </div>
                    </div>
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
                              Answered {formatRelativeDate(answer.createdDate)}
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
    </PageSectionContainer>
  )
}
