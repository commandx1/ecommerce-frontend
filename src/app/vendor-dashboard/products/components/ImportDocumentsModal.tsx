"use client"

import { useQuery, useQueryClient } from "@tanstack/react-query"
import { Download, FileUp, ListChecks, Loader2, Trash2, Upload, X } from "lucide-react"
import { useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import Modal from "@/components/ui/Modal"
import { showToast } from "@/components/ui/Toast"
import {
  extractFileName,
  type ImportResult,
  type VendorDocument,
  vendorDocumentsAPI,
  vendorDocumentsQueryKey,
} from "@/lib/api/vendor-documents"
import { cn } from "@/lib/utils"
import { useAuthStore } from "@/stores/authStore"
import DocumentProductsPanel from "./DocumentProductsPanel"

type Tab = "upload" | "history"

interface ImportDocumentsModalProps {
  isOpen: boolean
  onClose: () => void
}

function statusBadge(doc: VendorDocument) {
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

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

// Backend message format: "<summary>\n\nDetails:\n- Row 2: ...\n- Row 3: ..."
function parseImportMessage(message: string): { summary: string; rowIssues: string[] } {
  const [summary, detailsBlock] = message.split("\n\nDetails:\n")
  const rowIssues =
    detailsBlock
      ?.split("\n")
      .map((line) => line.trim())
      .filter((line) => line.startsWith("-"))
      .map((line) => line.replace(/^-\s*/, "")) ?? []
  return { summary: (summary ?? message).trim(), rowIssues }
}

function ImportResultView({
  result,
  onUploadAnother,
  onViewHistory,
  onDownloadInvalid,
  isDownloadingInvalid,
}: {
  result: ImportResult
  onUploadAnother: () => void
  onViewHistory: () => void
  onDownloadInvalid: () => void
  isDownloadingInvalid: boolean
}) {
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

export default function ImportDocumentsModal({ isOpen, onClose }: ImportDocumentsModalProps) {
  const { accessToken } = useAuthStore()
  const [activeTab, setActiveTab] = useState<Tab>("upload")

  // Upload tab state
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const [isDownloadingInvalid, setIsDownloadingInvalid] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // History tab state
  const [currentPage, setCurrentPage] = useState(0)
  const [deletingIds, setDeletingIds] = useState<Map<string, boolean>>(new Map())
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)
  const [expandedDocId, setExpandedDocId] = useState<string | null>(null)

  const queryClient = useQueryClient()

  // Unlike an import result, this list moves: admins approve documents or ask for
  // revisions, and the vendor uploads and deletes. It is cached only long enough
  // to survive tab switches, and invalidated outright after an upload or delete.
  const {
    data: documentsPage,
    isPending: isLoadingDocs,
    isError: documentsFailed,
  } = useQuery({
    queryKey: vendorDocumentsQueryKey(currentPage),
    queryFn: () =>
      vendorDocumentsAPI.getDocuments({ page: currentPage, size: 10, sort: "desc" }, accessToken as string),
    enabled: isOpen && Boolean(accessToken),
    staleTime: 15_000,
  })

  const documents: VendorDocument[] = documentsPage?.content ?? []
  const totalPages = documentsPage?.totalPages ?? 1

  const refreshDocuments = () => queryClient.invalidateQueries({ queryKey: vendorDocumentsQueryKey() })

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.name.endsWith(".xlsx") && !file.name.endsWith(".xls")) {
      showToast.error("Please select an Excel file (.xlsx or .xls)")
      return
    }
    setSelectedFile(file)
  }

  const handleUpload = async () => {
    if (!selectedFile || !accessToken) return
    setIsUploading(true)
    try {
      const result = await vendorDocumentsAPI.uploadDocument(selectedFile, accessToken)
      setImportResult(result)
      setSelectedFile(null)
      if (fileInputRef.current) fileInputRef.current.value = ""

      // Without this the vendor lands on a "My Uploads" tab that is missing the
      // file they just sent.
      setCurrentPage(0)
      void refreshDocuments()

      if (result.acceptedCount > 0 && result.skippedCount === 0 && result.wrongCount === 0) {
        showToast.success("Import complete", `${result.acceptedCount} product(s) imported successfully.`)
      } else if (result.acceptedCount > 0) {
        showToast.warning(
          "Import completed with issues",
          `${result.acceptedCount} accepted, ${result.skippedCount} skipped, ${result.wrongCount} failed.`,
        )
      } else {
        showToast.error(
          "Import failed",
          `${result.skippedCount} skipped, ${result.wrongCount} failed. See details below.`,
        )
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Upload failed"
      showToast.error(msg)
    } finally {
      setIsUploading(false)
    }
  }

  const handleDownloadInvalidRecords = async () => {
    if (!importResult || !accessToken) return
    setIsDownloadingInvalid(true)
    try {
      const blob = await vendorDocumentsAPI.downloadDocument(importResult.documentId, "invalid", accessToken)
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = importResult.invalidRecordsFilePath
        ? extractFileName(importResult.invalidRecordsFilePath)
        : "invalid_records.xlsx"
      a.click()
      URL.revokeObjectURL(url)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to download file"
      showToast.error(msg)
    } finally {
      setIsDownloadingInvalid(false)
    }
  }

  const handleDownload = async (doc: VendorDocument, fileType: "original" | "revised" | "invalid") => {
    if (!accessToken) return
    setDownloadingId(`${doc.id}-${fileType}`)
    try {
      const blob = await vendorDocumentsAPI.downloadDocument(doc.id, fileType, accessToken)
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      const sourcePath =
        fileType === "revised" && doc.revisedFilePath
          ? doc.revisedFilePath
          : fileType === "invalid" && doc.invalidRecordsFilePath
            ? doc.invalidRecordsFilePath
            : doc.filePath
      a.download = extractFileName(sourcePath)
      a.click()
      URL.revokeObjectURL(url)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to download file"
      showToast.error(msg)
    } finally {
      setDownloadingId(null)
    }
  }

  const handleDelete = async (docId: string) => {
    if (!accessToken) return
    setDeletingIds((prev) => new Map(prev).set(docId, true))
    try {
      await vendorDocumentsAPI.deleteDocument(docId, accessToken)
      showToast.success("Document deleted")
      setConfirmDeleteId(null)
      setExpandedDocId((prev) => (prev === docId ? null : prev))
      void refreshDocuments()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to delete document"
      showToast.error(msg)
    } finally {
      setDeletingIds((prev) => {
        const next = new Map(prev)
        next.delete(docId)
        return next
      })
    }
  }

  const handleClose = () => {
    setSelectedFile(null)
    setImportResult(null)
    setExpandedDocId(null)
    setCurrentPage(0)
    setActiveTab("upload")
    onClose()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Import Products"
      maxWidthClassName="w-5xl"
      overlayClassName="bg-brand-strong/40 backdrop-blur-[2px]"
      contentClassName="rounded-2xl border border-border-soft bg-surface-elevated p-0"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border-soft px-6 py-4">
        <div>
          <h2 className="text-lg font-semibold text-text-primary">Import Products</h2>
          <p className="text-sm text-text-muted">Upload an Excel file to bulk-import products for review</p>
        </div>
        <button
          type="button"
          onClick={handleClose}
          className="rounded-lg p-1.5 text-text-muted transition-colors hover:bg-surface-muted hover:text-text-primary"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border-soft">
        <button
          type="button"
          onClick={() => setActiveTab("upload")}
          className={cn(
            "flex-1 px-6 py-3 text-sm font-medium transition-colors",
            activeTab === "upload" ? "border-b-2 border-brand text-brand" : "text-text-muted hover:text-text-primary",
          )}
        >
          Upload
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("history")}
          className={cn(
            "flex-1 px-6 py-3 text-sm font-medium transition-colors",
            activeTab === "history" ? "border-b-2 border-brand text-brand" : "text-text-muted hover:text-text-primary",
          )}
        >
          My Uploads
        </button>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {activeTab === "upload" ? (
          importResult ? (
            <ImportResultView
              result={importResult}
              onUploadAnother={() => setImportResult(null)}
              onViewHistory={() => {
                setImportResult(null)
                setActiveTab("history")
              }}
              onDownloadInvalid={handleDownloadInvalidRecords}
              isDownloadingInvalid={isDownloadingInvalid}
            />
          ) : (
            <div className="space-y-5">
              {/* Drop zone */}
              <label
                htmlFor="vendor-doc-upload"
                className={cn(
                  "mx-auto flex w-1/2 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 transition-colors",
                  selectedFile
                    ? "border-success/50 bg-success/5"
                    : "border-border-strong hover:border-brand/50 hover:bg-surface-muted",
                )}
              >
                <input
                  id="vendor-doc-upload"
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  className="hidden"
                  onChange={handleFileChange}
                />
                {selectedFile ? (
                  <>
                    <FileUp className="mb-3 h-10 w-10 text-success" />
                    <p className="font-semibold text-text-primary">{selectedFile.name}</p>
                    <p className="mt-1 text-sm text-text-muted">Click to change file</p>
                  </>
                ) : (
                  <>
                    <Upload className="mb-3 h-10 w-10 text-text-muted" />
                    <p className="font-semibold text-text-primary">Click to select your Excel file</p>
                    <p className="mt-1 text-sm text-text-muted">Supports .xlsx and .xls formats</p>
                  </>
                )}
              </label>

              <div className="rounded-xl border border-brand/20 bg-brand/5 p-4 text-sm text-text-secondary">
                Use the official product import template. Make sure all required columns are filled before uploading.
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex-1 rounded-lg border border-border-strong px-4 py-2.5 text-sm font-medium text-text-secondary transition-colors hover:bg-surface-muted"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleUpload}
                  disabled={!selectedFile || isUploading}
                  className="flex flex-2 items-center justify-center gap-2 rounded-lg bg-brand px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-strong disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                  {isUploading ? "Uploading..." : "Upload Document"}
                </button>
              </div>
            </div>
          )
        ) : (
          <div>
            {isLoadingDocs ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-brand" />
              </div>
            ) : documentsFailed ? (
              <div className="flex items-center justify-between gap-3 rounded-xl border border-danger/25 bg-danger/8 p-4">
                <p className="text-sm font-semibold text-text-primary">Failed to load upload history</p>
                <Button type="button" variant="outline" size="sm" onClick={() => void refreshDocuments()}>
                  Try again
                </Button>
              </div>
            ) : documents.length === 0 ? (
              <div className="py-12 text-center">
                <FileUp className="mx-auto mb-3 h-10 w-10 text-text-muted" />
                <p className="font-medium text-text-secondary">No uploads yet</p>
                <p className="mt-1 text-sm text-text-muted">Upload your first product file to get started</p>
                <button
                  type="button"
                  onClick={() => setActiveTab("upload")}
                  className="mt-4 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-strong"
                >
                  Upload Now
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {documents.map((doc) => (
                  <div key={doc.id} className="rounded-xl border border-border-soft bg-surface p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <p
                          className="truncate text-sm font-medium text-text-primary"
                          title={extractFileName(doc.filePath)}
                        >
                          {extractFileName(doc.filePath)}
                        </p>
                        <p className="mt-0.5 text-xs text-text-muted">{formatDate(doc.createdDate)}</p>
                        {doc.revisionRequested && (
                          <>
                            {doc.revisedFilePath && doc.revisionApproved === null ? (
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
                            ) : null}
                          </>
                        )}
                      </div>
                      <div className="shrink-0">{statusBadge(doc)}</div>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {/* Download original */}
                      <button
                        type="button"
                        disabled={downloadingId === `${doc.id}-original`}
                        onClick={() => handleDownload(doc, "original")}
                        className="flex items-center gap-1.5 rounded-lg border border-border-soft px-3 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:bg-surface-muted disabled:opacity-50"
                      >
                        {downloadingId === `${doc.id}-original` ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Download className="h-3.5 w-3.5" />
                        )}
                        File
                      </button>

                      {/* Toggle per-product import result for this document */}
                      <button
                        type="button"
                        onClick={() => setExpandedDocId(expandedDocId === doc.id ? null : doc.id)}
                        className="flex items-center gap-1.5 rounded-lg border border-border-soft px-3 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:bg-surface-muted"
                      >
                        <ListChecks className="h-3.5 w-3.5" />
                        {expandedDocId === doc.id ? "Hide details" : "Details"}
                      </button>

                      {/* Delete (only pending) */}
                      {!doc.approved && !doc.deleted && (
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(confirmDeleteId === doc.id ? null : doc.id)}
                            className="flex items-center gap-1.5 rounded-lg border border-danger/30 px-3 py-1.5 text-xs font-medium text-danger transition-colors hover:bg-danger/10"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Delete
                          </button>
                          {confirmDeleteId === doc.id && (
                            <div className="absolute bottom-full left-0 z-10 mb-2 w-60 rounded-xl border border-border-soft bg-surface-elevated p-4 shadow-panel">
                              <p className="text-sm font-semibold text-text-primary">Delete document?</p>
                              <p className="mt-1 text-xs text-text-secondary wrap-break-word">
                                <span className="break-all">{extractFileName(doc.filePath)}</span> will be permanently
                                deleted.
                              </p>
                              <div className="mt-3 flex justify-end gap-2">
                                <Button
                                  type="button"
                                  variant="quiet"
                                  size="sm"
                                  disabled={deletingIds.has(doc.id)}
                                  onClick={() => setConfirmDeleteId(null)}
                                >
                                  Cancel
                                </Button>
                                <Button
                                  type="button"
                                  variant="destructive"
                                  size="sm"
                                  disabled={deletingIds.has(doc.id)}
                                  onClick={() => {
                                    void handleDelete(doc.id)
                                  }}
                                >
                                  {deletingIds.has(doc.id) && <Loader2 className="h-3 w-3 animate-spin" />}
                                  Delete
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {expandedDocId === doc.id && (
                      <div className="mt-3 border-t border-border-soft pt-3">
                        <DocumentProductsPanel documentId={doc.id} />
                      </div>
                    )}
                  </div>
                ))}

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between border-t border-border-soft pt-4">
                    <button
                      type="button"
                      disabled={currentPage === 0}
                      onClick={() => setCurrentPage((page) => Math.max(0, page - 1))}
                      className="rounded-lg border border-border-soft px-3 py-1.5 text-sm disabled:opacity-40"
                    >
                      Previous
                    </button>
                    <span className="text-sm text-text-muted">
                      Page {currentPage + 1} of {totalPages}
                    </span>
                    <button
                      type="button"
                      disabled={currentPage >= totalPages - 1}
                      onClick={() => setCurrentPage((page) => page + 1)}
                      className="rounded-lg border border-border-soft px-3 py-1.5 text-sm disabled:opacity-40"
                    >
                      Next
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  )
}
