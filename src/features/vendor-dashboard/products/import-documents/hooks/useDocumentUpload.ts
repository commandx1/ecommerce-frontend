"use client"

import { useQueryClient } from "@tanstack/react-query"
import { useRef, useState } from "react"
import { showToast } from "@/components/ui/Toast"
import { revalidateCategoryCounts } from "@/lib/actions/revalidate-category-counts"
import { extractFileName, type ImportResult, vendorDocumentsAPI } from "@/lib/api/vendor-documents"
import { queryKeys } from "@/lib/query/keys"
import { useAuthStore } from "@/stores/authStore"
import { validateSelectedFile } from "../lib/document-import"

export interface DocumentUpload {
  selectedFile: File | null
  isUploading: boolean
  importResult: ImportResult | null
  setImportResult: (result: ImportResult | null) => void
  isDownloadingInvalid: boolean
  fileInputRef: React.RefObject<HTMLInputElement | null>
  handleFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void
  handleUpload: () => Promise<void>
  handleDownloadInvalidRecords: () => Promise<void>
  reset: () => void
}

/**
 * Upload-tab state and commands. Uploading refreshes the document-history query (`onUploaded`)
 * rather than owning that list itself — `useDocumentHistory` is the single source of truth for it.
 */
export function useDocumentUpload(onUploaded: () => void): DocumentUpload {
  const { accessToken } = useAuthStore()
  const queryClient = useQueryClient()

  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const [isDownloadingInvalid, setIsDownloadingInvalid] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const validation = validateSelectedFile(file)
    if (!validation.ok) {
      if (validation.message) {
        showToast.error(validation.title, validation.message)
      } else {
        showToast.error(validation.title)
      }
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

      // Without this the vendor lands on a "My Uploads" tab that is missing the file they just
      // sent.
      onUploaded()
      void queryClient.invalidateQueries({ queryKey: queryKeys.vendor.documents.all })
      // Accepted rows become live listings immediately, so a bulk import can change category
      // counts the same as a single create; skip the call entirely when nothing was accepted.
      if (result.acceptedCount > 0) {
        void revalidateCategoryCounts()
      }

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
      // Session expiry (401, or a 403 whose JWT has actually expired) is handled centrally by
      // the axios interceptor, which logs out and redirects the vendor and marks the error
      // `authHandled`. Showing a second toast here would be a redundant error on top of the
      // redirect the vendor is already seeing.
      if ((err as { authHandled?: boolean } | null)?.authHandled) return
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
      // See handleUpload: session-expiry errors are already surfaced by the redirect.
      if ((err as { authHandled?: boolean } | null)?.authHandled) return
      const msg = err instanceof Error ? err.message : "Failed to download file"
      showToast.error(msg)
    } finally {
      setIsDownloadingInvalid(false)
    }
  }

  const reset = () => {
    setSelectedFile(null)
    setImportResult(null)
  }

  return {
    selectedFile,
    isUploading,
    importResult,
    setImportResult,
    isDownloadingInvalid,
    fileInputRef,
    handleFileChange,
    handleUpload,
    handleDownloadInvalidRecords,
    reset,
  }
}
