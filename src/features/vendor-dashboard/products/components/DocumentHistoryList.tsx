"use client"

import { FileUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import type { DocumentHistory } from "../hooks/useDocumentHistory"
import DocumentHistoryItem from "./DocumentHistoryItem"

interface DocumentHistoryListProps {
  history: DocumentHistory
  onUploadNow: () => void
}

export default function DocumentHistoryList({ history, onUploadNow }: DocumentHistoryListProps) {
  if (history.isLoading) {
    return (
      <div aria-busy="true" className="space-y-3">
        <span className="sr-only">Loading upload history...</span>
        {[0, 1, 2].map((i) => (
          <div key={i} className="rounded-xl border border-border-soft bg-surface p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1 space-y-2">
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="h-8 w-20 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (history.isError) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-xl border border-danger/25 bg-danger/8 p-4">
        <p className="text-sm font-semibold text-text-primary">Failed to load upload history</p>
        <Button type="button" variant="outline" size="sm" onClick={history.refresh}>
          Try again
        </Button>
      </div>
    )
  }

  if (history.documents.length === 0) {
    return (
      <div className="py-12 text-center">
        <FileUp className="mx-auto mb-3 h-10 w-10 text-text-muted" />
        <p className="font-medium text-text-secondary">No uploads yet</p>
        <p className="mt-1 text-sm text-text-muted">Upload your first product file to get started</p>
        <button
          type="button"
          onClick={onUploadNow}
          className="mt-4 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-strong"
        >
          Upload Now
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {history.documents.map((doc) => (
        <DocumentHistoryItem
          key={doc.id}
          doc={doc}
          isDeleting={history.deletingIds.has(doc.id)}
          isDownloading={history.downloadingId === `${doc.id}-original`}
          isConfirmingDelete={history.confirmDeleteId === doc.id}
          isExpanded={history.expandedDocId === doc.id}
          onToggleExpanded={() => history.setExpandedDocId(history.expandedDocId === doc.id ? null : doc.id)}
          onToggleConfirmDelete={() => history.setConfirmDeleteId(history.confirmDeleteId === doc.id ? null : doc.id)}
          onCancelDelete={() => history.setConfirmDeleteId(null)}
          onConfirmDelete={() => void history.handleDelete(doc.id)}
          onDownload={() => void history.handleDownload(doc, "original")}
        />
      ))}

      {/* Pagination */}
      {history.totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-border-soft pt-4">
          <button
            type="button"
            disabled={history.currentPage === 0}
            onClick={() => history.goToPage(Math.max(0, history.currentPage - 1))}
            className="rounded-lg border border-border-soft px-3 py-1.5 text-sm disabled:opacity-40"
          >
            Previous
          </button>
          <span className="text-sm text-text-muted">
            Page {history.currentPage + 1} of {history.totalPages}
          </span>
          <button
            type="button"
            disabled={history.currentPage >= history.totalPages - 1}
            onClick={() => history.goToPage(history.currentPage + 1)}
            className="rounded-lg border border-border-soft px-3 py-1.5 text-sm disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}
