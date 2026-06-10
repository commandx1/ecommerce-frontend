"use client"

import { ChevronLeft, ChevronRight, Loader2, MessageSquare, Pencil, Send, Trash2, X } from "lucide-react"
import { useCallback, useEffect, useId, useState } from "react"
import { showToast } from "@/components/ui/Toast"
import { cn } from "@/lib/utils"
import {
  type ProductAnswerResponse,
  type ProductQuestionResponse,
  vendorQuestionsAPI,
} from "@/lib/api/vendor-questions"
import { useAuthStore } from "@/stores/authStore"

const FILTER_TABS = ["All", "Unanswered", "Answered"] as const
type FilterTab = (typeof FILTER_TABS)[number]

const PAGE_SIZE = 10

function formatRelativeDate(dateStr: string | null): string {
  if (!dateStr) return ""
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  if (diffDays === 0) return "Today"
  if (diffDays === 1) return "Yesterday"
  if (diffDays < 7) return `${diffDays} days ago`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) > 1 ? "s" : ""} ago`
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

interface QuestionCardProps {
  question: ProductQuestionResponse
  currentUserId: string | null
  onAnswerCreated: (questionId: string, answer: ProductAnswerResponse) => void
  onAnswerUpdated: (questionId: string, answer: ProductAnswerResponse) => void
  onAnswerDeleted: (questionId: string, answerId: string) => void
}

function QuestionCard({ question, currentUserId, onAnswerCreated, onAnswerUpdated, onAnswerDeleted }: QuestionCardProps) {
  const cardId = useId()
  const existingAnswer = question.answers[0] ?? null
  const isMyAnswer = existingAnswer?.answererUserId === currentUserId

  const [mode, setMode] = useState<"view" | "composing" | "editing">("view")
  const [draftText, setDraftText] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const startCompose = () => {
    setDraftText("")
    setMode("composing")
  }

  const startEdit = () => {
    setDraftText(existingAnswer?.answer ?? "")
    setMode("editing")
  }

  const cancelEdit = () => {
    setDraftText("")
    setMode("view")
  }

  const handleSubmit = async () => {
    const trimmed = draftText.trim()
    if (!trimmed) return

    setIsSubmitting(true)
    try {
      if (mode === "composing") {
        const created = await vendorQuestionsAPI.createAnswer({
          productQuestionId: question.id,
          answer: trimmed,
        })
        onAnswerCreated(question.id, created)
      } else {
        if (!existingAnswer) return
        const updated = await vendorQuestionsAPI.updateAnswer(existingAnswer.id, { answer: trimmed })
        onAnswerUpdated(question.id, updated)
      }
      setMode("view")
      setDraftText("")
    } catch {
      showToast.error("Failed to save answer", "Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!existingAnswer) return
    setIsDeleting(true)
    try {
      await vendorQuestionsAPI.deleteAnswer(existingAnswer.id)
      onAnswerDeleted(question.id, existingAnswer.id)
      setMode("view")
    } catch {
      showToast.error("Failed to delete answer", "Please try again.")
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border-soft bg-surface-elevated shadow-soft transition-shadow hover:shadow-md">
      {/* Product label */}
      <div className="flex items-center gap-2 border-b border-border-soft bg-surface px-5 py-3">
        <div className="flex h-6 w-6 items-center justify-center rounded-md bg-brand/10">
          <MessageSquare className="h-3.5 w-3.5 text-brand" />
        </div>
        <span className="text-xs font-semibold text-brand">
          {question.productName ?? "Product"}
        </span>
        <span className="ml-auto text-xs text-text-muted">{formatRelativeDate(question.createdDate)}</span>
      </div>

      <div className="px-5 py-4 space-y-4">
        {/* Question */}
        <div className="space-y-1.5">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">Question</p>
          <p className="text-sm text-text-primary leading-relaxed">{question.question}</p>
          <p className="text-xs text-text-muted">
            Asked by <span className="font-medium text-text-secondary">{question.questionerName}</span>
          </p>
        </div>

        {/* Answer section */}
        <div className="border-t border-border-soft pt-4">
          {mode === "view" && existingAnswer ? (
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-3">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-success">Answer</p>
                {isMyAnswer && (
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={startEdit}
                      className="rounded-lg p-1.5 text-text-muted transition-colors hover:bg-surface-muted hover:text-text-secondary"
                      title="Edit answer"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleDelete()}
                      disabled={isDeleting}
                      className="rounded-lg p-1.5 text-text-muted transition-colors hover:bg-danger/10 hover:text-danger disabled:opacity-50"
                      title="Delete answer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </div>
              <p className="text-sm text-text-primary leading-relaxed">{existingAnswer.answer}</p>
              <p className="text-xs text-text-muted">
                By <span className="font-medium text-text-secondary">{existingAnswer.answererName}</span>
                {existingAnswer.createdDate && (
                  <> · {formatRelativeDate(existingAnswer.createdDate)}</>
                )}
              </p>
            </div>
          ) : mode === "view" && !existingAnswer ? (
            <button
              id={`${cardId}-answer-btn`}
              type="button"
              onClick={startCompose}
              className="flex items-center gap-2 rounded-xl border border-dashed border-border-strong px-4 py-2.5 text-sm font-medium text-text-muted transition-colors hover:border-brand/50 hover:bg-brand/5 hover:text-brand"
            >
              <Send className="h-3.5 w-3.5" />
              Write an answer
            </button>
          ) : (
            <div className="space-y-3">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                {mode === "editing" ? "Edit answer" : "Your answer"}
              </p>
              <textarea
                rows={3}
                value={draftText}
                onChange={(e) => setDraftText(e.target.value)}
                placeholder="Type your answer here..."
                className="w-full resize-none rounded-xl border border-border-strong bg-surface px-3.5 py-2.5 text-sm text-text-primary outline-none placeholder:text-text-muted focus:border-brand/50 focus:ring-2 focus:ring-brand/20"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={cancelEdit}
                  disabled={isSubmitting}
                  className="flex items-center gap-1.5 rounded-xl border border-border-strong px-3.5 py-2 text-sm font-medium text-text-secondary transition-colors hover:bg-surface-muted disabled:opacity-50"
                >
                  <X className="h-3.5 w-3.5" />
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => void handleSubmit()}
                  disabled={isSubmitting || !draftText.trim()}
                  className="flex items-center gap-1.5 rounded-xl bg-brand px-3.5 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand/90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Send className="h-3.5 w-3.5" />
                  )}
                  {isSubmitting ? "Saving…" : mode === "editing" ? "Save changes" : "Submit answer"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function VendorQuestionsPage() {
  const { isAuthenticated, user } = useAuthStore()
  const [questions, setQuestions] = useState<ProductQuestionResponse[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [totalElements, setTotalElements] = useState(0)
  const [activeTab, setActiveTab] = useState<FilterTab>("All")

  const fetchQuestions = useCallback(async (page: number) => {
    if (!isAuthenticated) return
    setIsLoading(true)
    try {
      const response = await vendorQuestionsAPI.getSellerQuestions(page, PAGE_SIZE)
      setQuestions(response.content)
      setTotalPages(response.totalPages)
      setTotalElements(response.totalElements)
    } catch {
      showToast.error("Failed to load questions", "Please refresh the page.")
      setQuestions([])
    } finally {
      setIsLoading(false)
    }
  }, [isAuthenticated])

  useEffect(() => {
    void fetchQuestions(currentPage)
  }, [fetchQuestions, currentPage])

  const handleAnswerCreated = useCallback((questionId: string, answer: ProductAnswerResponse) => {
    setQuestions((prev) =>
      prev.map((q) => (q.id === questionId ? { ...q, answers: [answer, ...q.answers] } : q)),
    )
  }, [])

  const handleAnswerUpdated = useCallback((questionId: string, answer: ProductAnswerResponse) => {
    setQuestions((prev) =>
      prev.map((q) =>
        q.id === questionId
          ? { ...q, answers: q.answers.map((a) => (a.id === answer.id ? answer : a)) }
          : q,
      ),
    )
  }, [])

  const handleAnswerDeleted = useCallback((questionId: string, answerId: string) => {
    setQuestions((prev) =>
      prev.map((q) =>
        q.id === questionId ? { ...q, answers: q.answers.filter((a) => a.id !== answerId) } : q,
      ),
    )
  }, [])

  const filteredQuestions = questions.filter((q) => {
    if (activeTab === "Answered") return q.answers.length > 0
    if (activeTab === "Unanswered") return q.answers.length === 0
    return true
  })

  const unansweredCount = questions.filter((q) => q.answers.length === 0).length

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-text-secondary">Please log in to view questions.</p>
      </div>
    )
  }

  return (
    <>
      {/* Header */}
      <section className="mb-8">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-text-primary">Product Questions</h1>
            <p className="mt-1 text-text-secondary">
              Answer customer questions about your products
            </p>
          </div>
          {unansweredCount > 0 && !isLoading && (
            <div className="flex items-center gap-2 rounded-2xl border border-warning/30 bg-warning/10 px-4 py-2.5">
              <MessageSquare className="h-4 w-4 text-warning" />
              <span className="text-sm font-semibold text-warning">
                {unansweredCount} unanswered
              </span>
            </div>
          )}
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-border-soft bg-surface-elevated shadow-soft">
        {/* Tabs + stats */}
        <div className="flex flex-col gap-3 border-b border-border-soft px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="inline-flex items-center gap-1.5 rounded-sm border border-border-soft bg-surface p-1.5 shadow-soft">
            {FILTER_TABS.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "rounded-sm px-4 py-2 text-sm font-medium transition-colors",
                  activeTab === tab
                    ? "bg-brand text-muted shadow-soft"
                    : "text-text-secondary hover:bg-surface-muted hover:text-text-primary",
                )}
                aria-pressed={activeTab === tab}
              >
                {tab}
                {tab === "Unanswered" && unansweredCount > 0 && !isLoading && (
                  <span className="ml-2 rounded-full bg-warning/20 px-1.5 py-0.5 text-[11px] font-bold text-warning">
                    {unansweredCount}
                  </span>
                )}
              </button>
            ))}
          </div>
          {!isLoading && (
            <p className="text-sm text-text-muted">
              {totalElements} total question{totalElements !== 1 ? "s" : ""}
            </p>
          )}
        </div>

        {/* Content */}
        <div className="p-6">
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }, (_, i) => (
                <div key={i} className="animate-pulse overflow-hidden rounded-2xl border border-border-soft">
                  <div className="h-11 bg-surface" />
                  <div className="space-y-3 p-5">
                    <div className="h-3 w-16 rounded bg-surface-muted" />
                    <div className="h-4 w-3/4 rounded bg-surface-muted" />
                    <div className="h-3 w-32 rounded bg-surface-muted" />
                    <div className="h-px bg-border-soft" />
                    <div className="h-9 w-36 rounded-xl bg-surface-muted" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredQuestions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-surface-muted">
                <MessageSquare className="h-8 w-8 text-text-muted" />
              </div>
              <p className="text-base font-semibold text-text-primary">
                {activeTab === "Unanswered" ? "No unanswered questions" : activeTab === "Answered" ? "No answered questions yet" : "No questions yet"}
              </p>
              <p className="mt-1 text-sm text-text-muted">
                {activeTab === "All" ? "Customer questions about your products will appear here." : "Switch to a different filter to see other questions."}
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2">
              {filteredQuestions.map((question) => (
                <QuestionCard
                  key={question.id}
                  question={question}
                  currentUserId={user?.id ?? null}
                  onAnswerCreated={handleAnswerCreated}
                  onAnswerUpdated={handleAnswerUpdated}
                  onAnswerDeleted={handleAnswerDeleted}
                />
              ))}
            </div>
          )}
        </div>

        {/* Pagination */}
        {!isLoading && totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-border-soft px-6 py-4">
            <p className="text-sm text-text-muted">
              Page {currentPage + 1} of {totalPages}
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                disabled={currentPage === 0}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-border-strong text-text-secondary transition-colors hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                const page = totalPages <= 5 ? i : Math.max(0, Math.min(currentPage - 2, totalPages - 5)) + i
                return (
                  <button
                    key={page}
                    type="button"
                    onClick={() => setCurrentPage(page)}
                    className={cn(
                      "flex h-9 w-9 items-center justify-center rounded-xl text-sm font-medium transition-colors",
                      page === currentPage
                        ? "bg-brand text-white shadow-soft"
                        : "border border-border-strong text-text-secondary hover:bg-surface-muted",
                    )}
                  >
                    {page + 1}
                  </button>
                )
              })}
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={currentPage >= totalPages - 1}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-border-strong text-text-secondary transition-colors hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </section>
    </>
  )
}
