import { AlertCircle, FileText, Image as ImageIcon, type LucideIcon, Package } from "lucide-react"
import type { TabKey } from "../lib/product-form"

const TABS: ReadonlyArray<{ key: TabKey; label: string; icon: LucideIcon }> = [
  { key: "basic", label: "Basic Information", icon: Package },
  { key: "details", label: "Product Details", icon: FileText },
  { key: "media", label: "Media", icon: ImageIcon },
]

interface EditorTabsProps {
  activeTab: TabKey
  errorCounts: Record<TabKey, number>
  onSelect: (tab: TabKey) => void
}

/** Tab headers; a tab with errors turns red and gets an "N error(s)" icon label (part of its accessible name). */
export default function EditorTabs({ activeTab, errorCounts, onSelect }: EditorTabsProps) {
  return (
    <div className="bg-surface-elevated rounded-t-2xl shadow-sm border-b border-border-soft">
      <div className="no-scrollbar flex gap-4 overflow-x-auto px-4 sm:gap-8 sm:px-8">
        {TABS.map(({ key, label, icon: Icon }) => {
          const errorCount = errorCounts[key]
          const errorLabel = `${errorCount} error${errorCount === 1 ? "" : "s"}`
          return (
            <button
              key={key}
              type="button"
              onClick={() => onSelect(key)}
              className={`shrink-0 whitespace-nowrap py-4 px-2 font-medium border-b-2 transition-colors ${
                activeTab === key
                  ? "text-brand border-brand"
                  : errorCount > 0
                    ? "text-destructive border-transparent hover:text-brand"
                    : "text-text-secondary border-transparent hover:text-brand"
              }`}
            >
              <Icon className="w-4 h-4 inline mr-2" />
              {label}
              {errorCount > 0 && (
                <span className="inline-flex" title={errorLabel}>
                  <AlertCircle className="w-4 h-4 inline ml-2 text-destructive" aria-label={errorLabel} />
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
