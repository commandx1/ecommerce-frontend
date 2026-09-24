"use client"

import { MessageSquare, Send } from "lucide-react"
import { useId, useState } from "react"
import ConfirmationModal from "@/components/feedback/ConfirmationModal"
import SurfaceCard from "@/components/ui/SurfaceCard"
import type { ProductAnswerResponse, ProductQuestionResponse } from "@/lib/api/vendor-questions"
import type { AnswerMutations } from "../hooks/useAnswerMutations"
import { formatRelativeDate } from "../lib/relative-date"
import AnswerComposer from "./AnswerComposer"
import AnswerItem from "./AnswerItem"

interface QuestionCardProps {
  question: ProductQuestionResponse
  currentUserId: string | null
  mutations: AnswerMutations
}

export default function QuestionCard({ question, currentUserId, mutations }: QuestionCardProps) {
  const cardId = useId()
  // A vendor writes at most one answer per question; find theirs (if any) among however many
  // other vendors/answerers have also weighed in, instead of assuming it is always first.
  const myAnswer = question.answers.find((answer) => answer.answererUserId === currentUserId) ?? null

  const [mode, setMode] = useState<"view" | "composing" | "editing">("view")
  const [editingAnswerId, setEditingAnswerId] = useState<string | null>(null)
  const [draftText, setDraftText] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deletingAnswerId, setDeletingAnswerId] = useState<string | null>(null)

  const startCompose = () => {
    setDraftText("")
    setMode("composing")
  }
  const startEdit = (answer: ProductAnswerResponse) => {
    setEditingAnswerId(answer.id)
    setDraftText(answer.answer)
    setMode("editing")
  }
  const cancelEdit = () => {
    setDraftText("")
    setEditingAnswerId(null)
    setMode("view")
  }

  const handleSubmit = async () => {
    const trimmed = draftText.trim()
    if (!trimmed) return
    setIsSubmitting(true)
    try {
      if (mode === "composing") {
        await mutations.createAnswer.mutateAsync({ productQuestionId: question.id, answer: trimmed })
      } else {
        if (!editingAnswerId) return
        await mutations.updateAnswer.mutateAsync({ answerId: editingAnswerId, answer: trimmed })
      }
      setMode("view")
      setDraftText("")
      setEditingAnswerId(null)
    } catch {
      // The mutation's own onError already toasted; the draft stays on screen so nothing is lost.
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteConfirmed = async () => {
    if (!deletingAnswerId) return
    setIsDeleting(true)
    try {
      await mutations.deleteAnswer.mutateAsync({ questionId: question.id, answerId: deletingAnswerId })
      if (editingAnswerId === deletingAnswerId) {
        setMode("view")
        setEditingAnswerId(null)
      }
      setDeletingAnswerId(null)
    } catch {
      // The mutation's own onError already toasted.
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <SurfaceCard
      variant="glass"
      data-testid="question-card"
      className="overflow-hidden transition-shadow hover:shadow-panel"
    >
      <div className="flex items-center gap-2 border-b border-border-soft bg-surface px-5 py-3">
        <div className="flex h-6 w-6 items-center justify-center rounded-md bg-brand/10">
          <MessageSquare className="h-3.5 w-3.5 text-brand" />
        </div>
        <span className="text-xs font-semibold text-brand">{question.productName ?? "Product"}</span>
        <span className="ml-auto text-xs text-text-muted">{formatRelativeDate(question.createdDate)}</span>
      </div>

      <div className="space-y-4 px-5 py-4">
        <div className="space-y-1.5">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">Question</p>
          <p className="text-sm leading-relaxed text-text-primary">{question.question}</p>
          <p className="text-xs text-text-muted">
            Asked by <span className="font-medium text-text-secondary capitalize">{question.questionerName}</span>
          </p>
        </div>

        <div className="border-t border-border-soft pt-4 space-y-4">
          {question.answers.map((answer) => {
            const isMine = answer.answererUserId === currentUserId
            const isEditingThisAnswer = mode === "editing" && editingAnswerId === answer.id

            if (isEditingThisAnswer) {
              return (
                <AnswerComposer
                  key={answer.id}
                  mode="editing"
                  value={draftText}
                  onChange={setDraftText}
                  onSubmit={() => void handleSubmit()}
                  onCancel={cancelEdit}
                  isSubmitting={isSubmitting}
                />
              )
            }

            return (
              <AnswerItem
                key={answer.id}
                answer={answer}
                isMine={isMine}
                onEdit={() => startEdit(answer)}
                onRequestDelete={() => setDeletingAnswerId(answer.id)}
              />
            )
          })}

          {mode === "composing" ? (
            <AnswerComposer
              mode="composing"
              value={draftText}
              onChange={setDraftText}
              onSubmit={() => void handleSubmit()}
              onCancel={cancelEdit}
              isSubmitting={isSubmitting}
            />
          ) : mode === "view" && !myAnswer ? (
            <button
              id={`${cardId}-answer-btn`}
              type="button"
              onClick={startCompose}
              className="flex items-center gap-2 rounded-xl border border-dashed border-border-strong px-4 py-2.5 text-sm font-medium text-text-muted transition-colors hover:border-brand/50 hover:bg-brand/5 hover:text-brand"
            >
              <Send className="h-3.5 w-3.5" />
              Write an answer
            </button>
          ) : null}
        </div>
      </div>
      <ConfirmationModal
        isOpen={deletingAnswerId !== null}
        onClose={() => setDeletingAnswerId(null)}
        onConfirm={() => void handleDeleteConfirmed()}
        title="Delete answer"
        description="Are you sure you want to delete this answer? This action cannot be undone."
        confirmText="Delete"
        cancelText="Keep it"
        isDanger
        isLoading={isDeleting}
      />
    </SurfaceCard>
  )
}
