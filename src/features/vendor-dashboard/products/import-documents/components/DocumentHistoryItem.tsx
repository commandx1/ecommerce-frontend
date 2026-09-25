"use client"

import { Download, ListChecks, Loader2, Trash2 } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { extractFileName, type VendorDocument } from "@/lib/api/vendor-documents"
import { formatShortDate } from "@/lib/helpers/format"
import { cn } from "@/lib/utils"
import DocumentProductsPanel from "./DocumentProductsPanel"

const EXPANDABLE_TEXT_LIMIT = 180

function ExpandableText({ text, className }: { text: string; className?: string }) {
  const [expanded, setExpanded] = useState(false)
  const isTruncatable = text.length > EXPANDABLE_TEXT_LIMIT

  return (
    <p className={cn("whitespace-pre-line", className)}>
      {expanded || !isTruncatable ? text : `${text.slice(0, EXPANDABLE_TEXT_LIMIT).trimEnd()}...`}
      {isTruncatable && (
        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          className="ml-1.5 font-semibold underline underline-offset-2"
        >
          {expanded ? "Show less" : "Show more"}
        </button>
      )}
    </p>
  )
}

function StatusBadge({ doc }: { doc: VendorDocument }) {
  if (doc.systemRejected) {
    return (
      <span className="inline-flex items-center rounded-full bg-danger/10 px-2.5 py-0.5 text-xs font-semibold text-danger">
        System Rejected
      </span>
    )
  }
  if (doc.approved) {
    return (
      <span className="inline-flex items-center rounded-full bg-success/12 px-2.5 py-0.5 text-xs font-semibold text-success">
        Approved
      </span>
    )
  }
  if (doc.revisionRequested && doc.revisedFilePath && doc.revisionApproved === null) {
    return (
      <span className="inline-flex items-center rounded-full bg-brand/10 px-2.5 py-0.5 text-xs font-semibold text-brand">
        Revision Submitted
      </span>
    )
  }
  if (doc.revisionRequested && doc.revisionApproved === false) {
    return (
      <span className="inline-flex items-center rounded-full bg-danger/10 px-2.5 py-0.5 text-xs font-semibold text-danger">
        Action Required
      </span>
    )
  }
  if (doc.revisionRequested) {
    return (
      <span className="inline-flex items-center rounded-full bg-warning/12 px-2.5 py-0.5 text-xs font-semibold text-warning">
        Revision Requested
      </span>
    )
  }
  return (
    <span className="inline-flex items-center rounded-full bg-text-muted/12 px-2.5 py-0.5 text-xs font-semibold text-text-muted">
      Pending Review
    </span>
  )
}

interface DocumentHistoryItemProps {
  doc: VendorDocument
  isDeleting: boolean
  isDownloading: boolean
  isConfirmingDelete: boolean
  isExpanded: boolean
  onToggleExpanded: () => void
  onToggleConfirmDelete: () => void
  onCancelDelete: () => void
  onConfirmDelete: () => void
  onDownload: () => void
}

export default function DocumentHistoryItem({
  doc,
  isDeleting,
  isDownloading,
  isConfirmingDelete,
  isExpanded,
  onToggleExpanded,
  onToggleConfirmDelete,
  onCancelDelete,
  onConfirmDelete,
  onDownload,
}: DocumentHistoryItemProps) {
  return (
    <div className="rounded-xl border border-border-soft bg-surface p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-text-primary" title={extractFileName(doc.filePath)}>
            {extractFileName(doc.filePath)}
          </p>
          <p className="mt-0.5 text-xs text-text-muted">{formatShortDate(doc.createdDate)}</p>
          {doc.revisionRequested &&
            (doc.revisedFilePath && doc.revisionApproved === null ? (
              <p className="mt-2 rounded-lg bg-brand/8 px-3 py-2 text-xs text-brand">
                <span className="font-semibold">Revision submitted</span> — awaiting admin review
              </p>
            ) : doc.revisionApproved === false && doc.requestedEdits ? (
              <div className="mt-2 rounded-lg bg-danger/8 px-3 py-2 text-xs text-danger">
                <span className="font-semibold">Fix required: </span>
                <ExpandableText text={doc.requestedEdits} />
              </div>
            ) : !doc.revisedFilePath && doc.requestedEdits ? (
              <div className="mt-2 rounded-lg bg-warning/10 px-3 py-2 text-xs text-warning">
                <span className="font-semibold">Revision note: </span>
                <ExpandableText text={doc.requestedEdits} />
              </div>
            ) : null)}
        </div>
        <div className="shrink-0">
          <StatusBadge doc={doc} />
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {/* Download original */}
        <button
          type="button"
          disabled={isDownloading}
          onClick={onDownload}
          className="flex items-center gap-1.5 rounded-lg border border-border-soft px-3 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:bg-surface-muted disabled:opacity-50"
        >
          {isDownloading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
          File
        </button>

        {/* Toggle per-product import result for this document */}
        <button
          type="button"
          onClick={onToggleExpanded}
          className="flex items-center gap-1.5 rounded-lg border border-border-soft px-3 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:bg-surface-muted"
        >
          <ListChecks className="h-3.5 w-3.5" />
          {isExpanded ? "Hide details" : "Details"}
        </button>

        {/* Delete (only pending) */}
        {!doc.approved && !doc.deleted && (
          <div className="relative">
            <button
              type="button"
              onClick={onToggleConfirmDelete}
              className="flex items-center gap-1.5 rounded-lg border border-danger/30 px-3 py-1.5 text-xs font-medium text-danger transition-colors hover:bg-danger/10"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete
            </button>
            {isConfirmingDelete && (
              <div className="absolute bottom-full left-0 z-10 mb-2 w-60 rounded-xl border border-border-soft bg-surface-elevated p-4 shadow-panel">
                <p className="text-sm font-semibold text-text-primary">Delete document?</p>
                <p className="mt-1 text-xs text-text-secondary wrap-break-word">
                  <span className="break-all">{extractFileName(doc.filePath)}</span> will be permanently deleted.
                </p>
                <div className="mt-3 flex justify-end gap-2">
                  <Button type="button" variant="quiet" size="sm" disabled={isDeleting} onClick={onCancelDelete}>
                    Cancel
                  </Button>
                  <Button type="button" variant="destructive" size="sm" disabled={isDeleting} onClick={onConfirmDelete}>
                    {isDeleting && <Loader2 className="h-3 w-3 animate-spin" />}
                    Delete
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {isExpanded && (
        <div className="mt-3 border-t border-border-soft pt-3">
          <DocumentProductsPanel documentId={doc.id} />
        </div>
      )}
    </div>
  )
}
