"use client"

import { User } from "lucide-react"
import { useSearchParams } from "next/navigation"
import PageSectionContainer from "@/components/layout/PageSectionContainer"
import SectionHeading from "@/components/layout/SectionHeading"
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
  const searchParams = useSearchParams()
  const vendorIdFromUrl = searchParams.get("vendorId")
  const selectedSupplierUserProductId = userProducts.some((userProduct) => userProduct.id === vendorIdFromUrl)
    ? vendorIdFromUrl || undefined
    : undefined

  // Extract questions from response
  const allQuestions: Question[] = initialQuestions?.content || []

  // Filter questions by selected supplier
  const questions = selectedSupplierUserProductId
    ? allQuestions.filter((q) => q.userProductId === selectedSupplierUserProductId)
    : allQuestions

  const totalQuestions = allQuestions.length
  const hasMoreQuestions = false // Since we're filtering client-side

  return (
    <PageSectionContainer as="section" className="bg-canvas py-12">
      <SectionHeading
        title="Questions & Answers"
        titleClassName="mb-2 md:text-3xl font-semibold text-text-primary"
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
              <div
                key={qa.id}
                className="rounded-[1.75rem] border border-border-soft bg-surface-elevated p-5 shadow-soft sm:p-8"
              >
                <div className="mb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="mb-2 font-semibold text-text-primary">{qa.question}</h3>
                      <div className="mb-3 text-sm text-text-secondary">
                        Asked by {qa.questionerName} • {formatRelativeDate(qa.createdDate)}
                      </div>
                    </div>
                  </div>
                </div>
                {qa.answers && qa.answers.length > 0 ? (
                  <div className="space-y-4">
                    {qa.answers.map((answer) => (
                      <div key={answer.id} className="rounded-[1.35rem] border border-border-soft bg-surface p-6">
                        <div className="flex items-start space-x-3">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand text-primary-foreground">
                            <User className="h-4 w-4 text-sm" />
                          </div>
                          <div className="flex-1">
                            <div className="mb-1 font-semibold text-text-primary">{answer.answererName}</div>
                            <p className="mb-3 text-text-secondary">{answer.answer}</p>
                            <div className="mt-2 text-sm text-text-muted">
                              Answered {formatRelativeDate(answer.createdDate)}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-[1.35rem] border border-border-soft bg-surface p-6">
                    <p className="italic text-text-secondary">No answer yet.</p>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      ) : (
        <div className="rounded-[1.75rem] border border-border-soft bg-surface-elevated p-5 text-center shadow-soft sm:p-8">
          <p className="text-text-secondary">
            {selectedSupplierUserProductId
              ? "No questions have been asked to this vendor yet."
              : "No questions yet. Be the first to ask a question!"}
          </p>
        </div>
      )}

      {hasMoreQuestions && (
        <div className="mt-8 text-center">
          <button
            type="button"
            className="rounded-full bg-brand px-8 py-3 font-medium text-primary-foreground transition-colors hover:bg-brand-strong"
          >
            View All {totalQuestions} Questions
          </button>
        </div>
      )}
    </PageSectionContainer>
  )
}
