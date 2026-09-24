import { Skeleton } from "@/components/ui/skeleton"
import type { QuestionFilter, SellerQuestionCounts } from "@/lib/api/vendor-questions"
import { cn } from "@/lib/utils"

const FILTER_TABS: { key: QuestionFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "unanswered", label: "Unanswered" },
  { key: "answered", label: "Answered" },
]

interface QuestionFilterTabsProps {
  activeFilter: QuestionFilter
  counts: SellerQuestionCounts | null
  onFilterChange: (filter: QuestionFilter) => void
}

export default function QuestionFilterTabs({ activeFilter, counts, onFilterChange }: QuestionFilterTabsProps) {
  return (
    <div className="flex max-w-full flex-wrap items-center gap-1.5 rounded-sm border border-border-soft bg-surface p-1.5 shadow-soft">
      {FILTER_TABS.map(({ key, label }) => {
        const count = counts
          ? key === "all"
            ? counts.total
            : key === "answered"
              ? counts.answered
              : counts.unanswered
          : null
        return (
          <button
            key={key}
            type="button"
            onClick={() => onFilterChange(key)}
            className={cn(
              "flex items-center gap-2 rounded-sm px-4 py-2 text-sm font-medium transition-colors",
              activeFilter === key
                ? "bg-brand text-muted shadow-soft"
                : "text-text-secondary hover:bg-surface-muted hover:text-text-primary",
            )}
            aria-pressed={activeFilter === key}
          >
            {label}
            {/* The count pill is reserved, not omitted: without it each tab was narrower until
                the counts landed, and on mobile the row re-wrapped when they did. */}
            {count === null && <Skeleton className="h-4 w-5 rounded-full" />}
            {count !== null && (
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.5 text-[11px] font-bold",
                  activeFilter === key
                    ? "bg-white/20 text-white"
                    : key === "unanswered" && count > 0
                      ? "bg-warning/20 text-warning"
                      : "bg-surface-muted text-text-muted",
                )}
              >
                {count}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
