"use client"

import { Download, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { ImportResult } from "@/lib/api/vendor-documents"
import { parseImportMessage } from "../lib/document-import"
import DocumentProductsPanel from "./DocumentProductsPanel"

interface ImportResultViewProps {
  result: ImportResult
  onUploadAnother: () => void
  onViewHistory: () => void
  onDownloadInvalid: () => void
  isDownloadingInvalid: boolean
}

export default function ImportResultView({
  result,
  onUploadAnother,
  onViewHistory,
  onDownloadInvalid,
  isDownloadingInvalid,
}: ImportResultViewProps) {
  const { summary, rowIssues } = parseImportMessage(result.message)

  return (
    <div className="space-y-5">
      <p className="text-sm text-text-secondary">{summary}</p>

      <DocumentProductsPanel documentId={result.documentId} rowIssues={rowIssues} />

      {result.invalidRecordsFilePath && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-warning/25 bg-warning/8 p-4">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-text-primary">Correction needed</p>
            <p className="text-xs text-text-muted">Fix the highlighted cells in the generated file and re-upload.</p>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={onDownloadInvalid} disabled={isDownloadingInvalid}>
            {isDownloadingInvalid ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Download className="h-3.5 w-3.5" />
            )}
            Download
          </Button>
        </div>
      )}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onUploadAnother}
          className="flex-1 rounded-lg border border-border-strong px-4 py-2.5 text-sm font-medium text-text-secondary transition-colors hover:bg-surface-muted"
        >
          Upload Another
        </button>
        <button
          type="button"
          onClick={onViewHistory}
          className="flex-1 rounded-lg bg-brand px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-strong"
        >
          View My Uploads
        </button>
      </div>
    </div>
  )
}
