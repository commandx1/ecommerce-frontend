"use client"

import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { showToast } from "@/components/ui/Toast"
import { extractFileName, type VendorDocument, vendorDocumentsAPI } from "@/lib/api/vendor-documents"
import { queryKeys } from "@/lib/query/keys"
import { useAuthStore } from "@/stores/authStore"

export interface DocumentHistory {
  documents: VendorDocument[]
  totalPages: number
  currentPage: number
  goToPage: (page: number) => void
  goToFirstPage: () => void
  isLoading: boolean
  isError: boolean
  deletingIds: Map<string, boolean>
  confirmDeleteId: string | null
  setConfirmDeleteId: (id: string | null) => void
  downloadingId: string | null
  expandedDocId: string | null
  setExpandedDocId: (id: string | null) => void
  handleDelete: (docId: string) => Promise<void>
  handleDownload: (doc: VendorDocument, fileType: "original" | "revised" | "invalid") => Promise<void>
  refresh: () => void
}

/**
 * Unlike an import result, this list moves: admins approve documents or ask for revisions, and
 * the vendor uploads and deletes. It is cached only long enough to survive tab switches, and
 * invalidated outright after an upload or delete.
 */
export function useDocumentHistory(isOpen: boolean): DocumentHistory {
  const { accessToken } = useAuthStore()
  const queryClient = useQueryClient()

  const [currentPage, setCurrentPage] = useState(0)
  const [deletingIds, setDeletingIds] = useState<Map<string, boolean>>(new Map())
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)
  const [expandedDocId, setExpandedDocId] = useState<string | null>(null)

  const {
    data: documentsPage,
    isPending: isLoadingDocs,
    isError: documentsFailed,
  } = useQuery({
    queryKey: queryKeys.vendor.documents.list(currentPage),
    queryFn: () =>
      vendorDocumentsAPI.getDocuments({ page: currentPage, size: 10, sort: "desc" }, accessToken as string),
    enabled: isOpen && Boolean(accessToken),
    staleTime: 15_000,
  })

  // Array.isArray, not `?? []` — a malformed 200 with a non-array `content` reaches .map()
  // downstream and blanks the upload history (infra note #26).
  const documents: VendorDocument[] = Array.isArray(documentsPage?.content) ? documentsPage.content : []
  const totalPages = documentsPage?.totalPages ?? 1

  const refreshDocuments = () => void queryClient.invalidateQueries({ queryKey: queryKeys.vendor.documents.all })

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
      // Session expiry is already surfaced by the axios interceptor's redirect.
      if ((err as { authHandled?: boolean } | null)?.authHandled) return
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
      refreshDocuments()
    } catch (err: unknown) {
      if ((err as { authHandled?: boolean } | null)?.authHandled) return
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

  return {
    documents,
    totalPages,
    currentPage,
    goToPage: setCurrentPage,
    goToFirstPage: () => setCurrentPage(0),
    isLoading: isLoadingDocs,
    isError: documentsFailed,
    deletingIds,
    confirmDeleteId,
    setConfirmDeleteId,
    downloadingId,
    expandedDocId,
    setExpandedDocId,
    handleDelete,
    handleDownload,
    refresh: refreshDocuments,
  }
}
