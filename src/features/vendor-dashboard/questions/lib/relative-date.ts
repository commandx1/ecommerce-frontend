import { formatShortDate, parseApiDate } from "@/lib/helpers/format"

/** "Today" / "Yesterday" / "Nd ago" / "Nw ago", falling back to a short date past 30 days. */
export function formatRelativeDate(dateStr: string | null): string {
  if (!dateStr) return ""
  const date = parseApiDate(dateStr)
  const now = new Date()
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
  if (diffDays === 0) return "Today"
  if (diffDays === 1) return "Yesterday"
  if (diffDays < 7) return `${diffDays} days ago`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`
  return formatShortDate(date)
}
