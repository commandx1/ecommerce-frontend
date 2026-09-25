import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import type { EditorMode } from "../lib/product-form"

const HEADINGS: Record<EditorMode, { title: string; subtitle: string }> = {
  create: { title: "Create New Product", subtitle: "Add a new product to your catalog" },
  edit: { title: "Edit Product", subtitle: "Update product information" },
  reviewEdit: { title: "Edit Rejected Product", subtitle: "Update your product and resubmit it for review" },
}

interface EditorHeaderProps {
  mode: EditorMode
  /** Only a fresh create, once past the search view, can go back to it. */
  showBackToSearch: boolean
  onBackToSearch: () => void
  onCancel: () => void
}

export default function EditorHeader({ mode, showBackToSearch, onBackToSearch, onCancel }: EditorHeaderProps) {
  const { title, subtitle } = HEADINGS[mode]

  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between mb-8">
      <div className="flex items-center space-x-4">
        <Link
          href="/vendor-dashboard/products"
          aria-label="Back to products"
          className="w-10 h-10 bg-surface-elevated rounded-lg shadow flex items-center justify-center hover:bg-surface-muted transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-text-secondary" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-brand">{title}</h1>
          <p className="text-text-secondary">{subtitle}</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-3">
        {showBackToSearch && (
          <button
            type="button"
            onClick={onBackToSearch}
            className="px-6 py-2 border border-border-soft rounded-lg text-text-primary hover:bg-surface-muted transition-colors font-medium flex items-center"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Search
          </button>
        )}
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-2 border border-border-soft rounded-lg text-text-primary hover:bg-surface-muted transition-colors font-medium"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}
