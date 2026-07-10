"use client"

import { Download, FileUp, Loader2, RefreshCw, Trash2, Upload, X } from "lucide-react"
import { useCallback, useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import Modal from "@/components/ui/Modal"
import { showToast } from "@/components/ui/Toast"
import { extractFileName, type VendorDocument, vendorDocumentsAPI } from "@/lib/api/vendor-documents"
import { cn } from "@/lib/utils"
import { useAuthStore } from "@/stores/authStore"

type Tab = "upload" | "history"

interface ImportDocumentsModalProps {
  isOpen: boolean
  onClose: () => void
}

function statusBadge(doc: VendorDocument) {
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

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

export default function ImportDocumentsModal({ isOpen, onClose }: ImportDocumentsModalProps) {
  const { accessToken } = useAuthStore()
  const [activeTab, setActiveTab] = useState<Tab>("upload")

  // Upload tab state
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const revisionFileInputRefs = useRef<Record<string, HTMLInputElement | null>>({})

  // History tab state
  const [documents, setDocuments] = useState<VendorDocument[]>([])
  const [isLoadingDocs, setIsLoadingDocs] = useState(false)
  const [currentPage, setCurrentPage] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [revisionCount, setRevisionCount] = useState(0)
  const [revisingId, setRevisingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)

  const fetchDocuments = useCallback(
    async (page = 0) => {
      if (!accessToken) return
      setIsLoadingDocs(true)
      try {
        const res = await vendorDocumentsAPI.getDocuments({ page, size: 10, sort: "desc" }, accessToken)
        setDocuments(res.content)
        setTotalPages(res.totalPages)
        setCurrentPage(page)
        if (page === 0) {
          setRevisionCount(
            res.content.filter((d) => d.revisionRequested && !d.approved && !d.deleted && d.revisedFilePath === null).length,
          )
        }
      } catch {
        showToast.error("Failed to load upload history")
      } finally {
        setIsLoadingDocs(false)
      }
    },
    [accessToken],
  )

  useEffect(() => {
    if (isOpen) {
      void fetchDocuments(0)
    }
  }, [isOpen, fetchDocuments])

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
      await vendorDocumentsAPI.uploadDocument(selectedFile, accessToken)
      showToast.success("Document uploaded", "Your file has been submitted for review.")
      setSelectedFile(null)
      if (fileInputRef.current) fileInputRef.current.value = ""
      void fetchDocuments(0)
      setActiveTab("history")
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Upload failed"
      showToast.error(msg)
    } finally {
      setIsUploading(false)
    }
  }

  const handleRevisionFileChange = async (docId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !accessToken) return
    if (!file.name.endsWith(".xlsx") && !file.name.endsWith(".xls")) {
      showToast.error("Please select an Excel file (.xlsx or .xls)")
      return
    }
    setRevisingId(docId)
    try {
      await vendorDocumentsAPI.reviseDocument(docId, file, accessToken)
      showToast.success("Revision submitted", "Your revised document has been uploaded.")
      void fetchDocuments(currentPage)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to submit revision"
      showToast.error(msg)
    } finally {
      setRevisingId(null)
      const input = revisionFileInputRefs.current[docId]
      if (input) input.value = ""
    }
  }

  const handleDownload = async (doc: VendorDocument, fileType: "original" | "revised") => {
    if (!accessToken) return
    setDownloadingId(`${doc.id}-${fileType}`)
    try {
      const blob = await vendorDocumentsAPI.downloadDocument(doc.id, fileType, accessToken)
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = extractFileName(fileType === "revised" && doc.revisedFilePath ? doc.revisedFilePath : doc.filePath)
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      showToast.error("Failed to download file")
    } finally {
      setDownloadingId(null)
    }
  }

  const handleDelete = async (docId: string) => {
    if (!accessToken) return
    setDeletingId(docId)
    try {
      await vendorDocumentsAPI.deleteDocument(docId, accessToken)
      showToast.success("Document deleted")
      setConfirmDeleteId(null)
      void fetchDocuments(currentPage)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to delete document"
      showToast.error(msg)
    } finally {
      setDeletingId(null)
    }
  }

  const handleClose = () => {
    setSelectedFile(null)
    setActiveTab("upload")
    onClose()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Import Products"
      maxWidthClassName="min-w-4xl"
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
            "relative flex flex-1 items-center justify-center gap-2 px-6 py-3 text-sm font-medium transition-colors",
            activeTab === "history" ? "border-b-2 border-brand text-brand" : "text-text-muted hover:text-text-primary",
          )}
        >
          My Uploads
          {revisionCount > 0 && (
            <span className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-warning px-1 text-[10px] font-bold text-white">
              {revisionCount}
            </span>
          )}
        </button>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {activeTab === "upload" ? (
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
        ) : (
          <div>
            {isLoadingDocs ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-brand" />
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
                              <p className="mt-2 whitespace-pre-line rounded-lg bg-danger/8 px-3 py-2 text-xs text-danger">
                                <span className="font-semibold">Fix required: </span>
                                {doc.requestedEdits}
                              </p>
                            ) : !doc.revisedFilePath && doc.requestedEdits ? (
                              <p className="mt-2 whitespace-pre-line rounded-lg bg-warning/10 px-3 py-2 text-xs text-warning">
                                <span className="font-semibold">Revision note: </span>
                                {doc.requestedEdits}
                              </p>
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
                        Original
                      </button>

                      {/* Download revised */}
                      {doc.revisedFilePath && (
                        <button
                          type="button"
                          disabled={downloadingId === `${doc.id}-revised`}
                          onClick={() => handleDownload(doc, "revised")}
                          className="flex items-center gap-1.5 rounded-lg border border-brand/30 bg-brand/8 px-3 py-1.5 text-xs font-medium text-brand transition-colors hover:bg-brand/15 disabled:opacity-50"
                        >
                          {downloadingId === `${doc.id}-revised` ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Download className="h-3.5 w-3.5" />
                          )}
                          Revised
                        </button>
                      )}

                      {/* Upload revision — hide when auto-failed (admin must re-request first) */}
                      {doc.revisionRequested && !doc.approved && doc.revisionApproved !== false && (
                        <>
                          <input
                            ref={(el) => {
                              revisionFileInputRefs.current[doc.id] = el
                            }}
                            type="file"
                            accept=".xlsx,.xls"
                            className="hidden"
                            onChange={(e) => handleRevisionFileChange(doc.id, e)}
                          />
                          <button
                            type="button"
                            disabled={revisingId === doc.id}
                            onClick={() => revisionFileInputRefs.current[doc.id]?.click()}
                            className={cn(
                              "flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-50",
                              doc.revisedFilePath
                                ? "border-border-soft text-text-muted hover:bg-surface-muted"
                                : "border-warning/50 bg-warning/10 text-warning hover:bg-warning/20",
                            )}
                          >
                            {revisingId === doc.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <RefreshCw className="h-3.5 w-3.5" />
                            )}
                            {doc.revisedFilePath ? "Re-upload" : "Upload Revision"}
                          </button>
                        </>
                      )}

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
                                <span className="break-all">{extractFileName(doc.filePath)}</span> will be permanently deleted.
                              </p>
                              <div className="mt-3 flex justify-end gap-2">
                                <Button
                                  type="button"
                                  variant="quiet"
                                  size="sm"
                                  disabled={deletingId === doc.id}
                                  onClick={() => setConfirmDeleteId(null)}
                                >
                                  Cancel
                                </Button>
                                <Button
                                  type="button"
                                  variant="destructive"
                                  size="sm"
                                  disabled={deletingId === doc.id}
                                  onClick={() => { void handleDelete(doc.id) }}
                                >
                                  {deletingId === doc.id && <Loader2 className="h-3 w-3 animate-spin" />}
                                  Delete
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between border-t border-border-soft pt-4">
                    <button
                      type="button"
                      disabled={currentPage === 0}
                      onClick={() => fetchDocuments(currentPage - 1)}
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
                      onClick={() => fetchDocuments(currentPage + 1)}
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
