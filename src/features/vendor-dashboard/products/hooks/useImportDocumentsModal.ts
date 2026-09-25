"use client"

import { useState } from "react"
import type { DocumentHistory } from "./useDocumentHistory"
import { useDocumentHistory } from "./useDocumentHistory"
import type { DocumentUpload } from "./useDocumentUpload"
import { useDocumentUpload } from "./useDocumentUpload"

export type ImportDocumentsTab = "upload" | "history"

export interface ImportDocumentsModalViewModel {
  activeTab: ImportDocumentsTab
  setActiveTab: (tab: ImportDocumentsTab) => void
  upload: DocumentUpload
  history: DocumentHistory
  handleClose: () => void
  handleViewHistory: () => void
}

/** Composes the upload and history hooks and the tab that switches between them, plus the
 * "clear everything" behaviour the modal's own close button and backdrop share. */
export function useImportDocumentsModal(isOpen: boolean, onClose: () => void): ImportDocumentsModalViewModel {
  const [activeTab, setActiveTab] = useState<ImportDocumentsTab>("upload")
  const history = useDocumentHistory(isOpen)
  const upload = useDocumentUpload(() => history.goToFirstPage())

  const handleClose = () => {
    upload.reset()
    history.setExpandedDocId(null)
    history.goToFirstPage()
    setActiveTab("upload")
    onClose()
  }

  const handleViewHistory = () => {
    upload.setImportResult(null)
    setActiveTab("history")
  }

  return { activeTab, setActiveTab, upload, history, handleClose, handleViewHistory }
}
