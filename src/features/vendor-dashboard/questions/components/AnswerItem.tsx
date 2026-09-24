import { Pencil, Trash2 } from "lucide-react"
import type { ProductAnswerResponse } from "@/lib/api/vendor-questions"
import { formatRelativeDate } from "../lib/relative-date"

interface AnswerItemProps {
  answer: ProductAnswerResponse
  isMine: boolean
  onEdit: () => void
  onRequestDelete: () => void
}

export default function AnswerItem({ answer, isMine, onEdit, onRequestDelete }: AnswerItemProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-success">Answer</p>
        {isMine && (
          <div className="flex items-center gap-1">
            {/* Icon-only controls need an accessible name of their own - the icon carries no
                text, so without this a screen-reader user hears only "button" (same class as
                F91/F112). Several answers can sit on one question, so the name says WHICH answer
                it acts on. */}
            <button
              type="button"
              aria-label="Edit your answer"
              onClick={onEdit}
              className="rounded-lg p-1.5 text-text-muted transition-colors hover:bg-surface-muted hover:text-text-secondary"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              aria-label="Delete your answer"
              onClick={onRequestDelete}
              className="rounded-lg p-1.5 text-text-muted transition-colors hover:bg-danger/10 hover:text-danger"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>
      <p className="text-sm leading-relaxed text-text-primary">{answer.answer}</p>
      <p className="text-xs text-text-muted">
        By <span className="font-medium text-text-secondary capitalize">{answer.answererName}</span>
        {answer.createdDate && <> · {formatRelativeDate(answer.createdDate)}</>}
      </p>
    </div>
  )
}
