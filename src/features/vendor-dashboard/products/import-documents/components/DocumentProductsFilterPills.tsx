"use client"

import type { LucideIcon } from "lucide-react"
import { CircleAlert, CircleCheck, CircleX, Layers } from "lucide-react"
import { cn } from "@/lib/utils"
import type { DocumentProductsTab } from "../hooks/useDocumentProductsPanel"

type FilterTone = "neutral" | "success" | "warning" | "danger"

interface FilterOption {
  value: DocumentProductsTab
  label: string
  count: number
  tone: FilterTone
  Icon: LucideIcon
}

const FILTER_TONE_CLASSES: Record<FilterTone, string> = {
  neutral: "border-border-strong bg-surface text-text-secondary",
  success: "border-success/25 bg-success/8 text-success",
  warning: "border-warning/25 bg-warning/10 text-warning",
  danger: "border-danger/25 bg-danger/8 text-danger",
}

interface DocumentProductsFilterPillsProps {
  activeTab: DocumentProductsTab
  onTabChange: (tab: DocumentProductsTab) => void
  totalCount: number
  counts: { success: number; skip: number; wrong: number }
}

/**
 * The summary pills double as the filter control: each one selects its own rows. Every filter
 * stays on screen even at zero — "0 Skipped" is itself the answer to "was anything skipped?", and
 * a group whose buttons come and go is hard to read.
 */
export default function DocumentProductsFilterPills({
  activeTab,
  onTabChange,
  totalCount,
  counts,
}: DocumentProductsFilterPillsProps) {
  const filters: FilterOption[] = [
    { value: "all", label: "All", count: totalCount, tone: "neutral", Icon: Layers },
    { value: "success", label: "Imported", count: counts.success, tone: "success", Icon: CircleCheck },
    { value: "skip", label: "Skipped", count: counts.skip, tone: "warning", Icon: CircleAlert },
    { value: "wrong", label: "Failed", count: counts.wrong, tone: "danger", Icon: CircleX },
  ]

  return (
    <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${filters.length}, minmax(0, 1fr))` }}>
      {filters.map(({ value, label, count, tone, Icon }) => {
        const isActive = activeTab === value
        // An empty group has nothing to show, so it reports its count without being selectable.
        const isEmpty = count === 0
        return (
          <button
            key={value}
            type="button"
            aria-pressed={isActive}
            disabled={isEmpty}
            onClick={() => onTabChange(value)}
            className={cn(
              "flex flex-col items-center gap-1 rounded-xl border px-4 py-3 transition-all",
              FILTER_TONE_CLASSES[tone],
              isEmpty && "cursor-not-allowed opacity-40",
              !isEmpty &&
                (isActive ? "ring-2 ring-current ring-offset-1 ring-offset-surface" : "opacity-55 hover:opacity-100"),
            )}
          >
            <Icon className="h-5 w-5" />
            <span className="text-xl font-semibold">{count}</span>
            <span className="text-xs font-medium">{label}</span>
          </button>
        )
      })}
    </div>
  )
}
