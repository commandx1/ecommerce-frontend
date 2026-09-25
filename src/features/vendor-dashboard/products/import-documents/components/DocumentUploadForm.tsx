"use client"

import { FileUp, Loader2, Upload } from "lucide-react"
import { type RefObject, useId } from "react"
import { cn } from "@/lib/utils"

interface DocumentUploadFormProps {
  selectedFile: File | null
  isUploading: boolean
  fileInputRef: RefObject<HTMLInputElement | null>
  onFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void
  onCancel: () => void
  onUpload: () => void
}

export default function DocumentUploadForm({
  selectedFile,
  isUploading,
  fileInputRef,
  onFileChange,
  onCancel,
  onUpload,
}: DocumentUploadFormProps) {
  const inputId = useId()

  return (
    <div className="space-y-5">
      {/* Drop zone */}
      <label
        htmlFor={inputId}
        className={cn(
          "mx-auto flex w-1/2 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 transition-colors",
          selectedFile
            ? "border-success/50 bg-success/5"
            : "border-border-strong hover:border-brand/50 hover:bg-surface-muted",
        )}
      >
        <input
          id={inputId}
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls"
          className="hidden"
          onChange={onFileChange}
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
            <p className="mt-1 text-sm text-text-muted">.xlsx or .xls, up to 1MB</p>
          </>
        )}
      </label>

      <div className="rounded-xl border border-brand/20 bg-brand/5 p-4 text-sm text-text-secondary">
        Use the official product import template. Make sure all required columns are filled before uploading.
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 rounded-lg border border-border-strong px-4 py-2.5 text-sm font-medium text-text-secondary transition-colors hover:bg-surface-muted"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onUpload}
          disabled={!selectedFile || isUploading}
          className="flex flex-2 items-center justify-center gap-2 rounded-lg bg-brand px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-strong disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          {isUploading ? "Uploading..." : "Upload Document"}
        </button>
      </div>
    </div>
  )
}
