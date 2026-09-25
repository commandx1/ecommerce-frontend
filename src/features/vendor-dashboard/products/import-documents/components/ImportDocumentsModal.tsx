"use client"

import { X } from "lucide-react"
import Modal from "@/components/ui/Modal"
import { cn } from "@/lib/utils"
import { useImportDocumentsModal } from "../hooks/useImportDocumentsModal"
import DocumentHistoryList from "./DocumentHistoryList"
import DocumentUploadForm from "./DocumentUploadForm"
import ImportResultView from "./ImportResultView"

interface ImportDocumentsModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function ImportDocumentsModal({ isOpen, onClose }: ImportDocumentsModalProps) {
  const modal = useImportDocumentsModal(isOpen, onClose)
  const { upload, history } = modal

  return (
    <Modal
      isOpen={isOpen}
      onClose={modal.handleClose}
      title="Import Products"
      maxWidthClassName="max-w-5xl"
      overlayClassName="bg-brand-strong/40 backdrop-blur-[2px]"
      contentClassName="glass-panel p-0"
    >
      <div className="flex items-center justify-between border-b border-border-soft px-6 py-4">
        <div>
          <h2 className="text-lg font-semibold text-text-primary">Import Products</h2>
          <p className="text-sm text-text-muted">Upload an Excel file to bulk-import products for review</p>
        </div>
        <button
          type="button"
          onClick={modal.handleClose}
          className="rounded-lg p-1.5 text-text-muted transition-colors hover:bg-surface-muted hover:text-text-primary"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border-soft">
        <button
          type="button"
          onClick={() => modal.setActiveTab("upload")}
          className={cn(
            "flex-1 px-6 py-3 text-sm font-medium transition-colors",
            modal.activeTab === "upload"
              ? "border-b-2 border-brand text-brand"
              : "text-text-muted hover:text-text-primary",
          )}
        >
          Upload
        </button>
        <button
          type="button"
          onClick={() => modal.setActiveTab("history")}
          className={cn(
            "flex-1 px-6 py-3 text-sm font-medium transition-colors",
            modal.activeTab === "history"
              ? "border-b-2 border-brand text-brand"
              : "text-text-muted hover:text-text-primary",
          )}
        >
          My Uploads
        </button>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {modal.activeTab === "upload" ? (
          upload.importResult ? (
            <ImportResultView
              result={upload.importResult}
              onUploadAnother={() => upload.setImportResult(null)}
              onViewHistory={modal.handleViewHistory}
              onDownloadInvalid={() => void upload.handleDownloadInvalidRecords()}
              isDownloadingInvalid={upload.isDownloadingInvalid}
            />
          ) : (
            <DocumentUploadForm
              selectedFile={upload.selectedFile}
              isUploading={upload.isUploading}
              fileInputRef={upload.fileInputRef}
              onFileChange={upload.handleFileChange}
              onCancel={modal.handleClose}
              onUpload={() => void upload.handleUpload()}
            />
          )
        ) : (
          <DocumentHistoryList history={history} onUploadNow={() => modal.setActiveTab("upload")} />
        )}
      </div>
    </Modal>
  )
}
