import { parseApiDate } from "@/lib/helpers/format"

export const formatRelativeDate = (dateString: string): string => {
  try {
    const date = parseApiDate(dateString)
    // `new Date(...)` never throws — a malformed/missing createdDate (hostile 200 body, or a
    // legacy row with no timestamp) silently produces an Invalid Date, and the arithmetic below
    // used to render "NaN years ago" to the user instead of catching it here.
    if (Number.isNaN(date.getTime())) return "Recently"

    const now = new Date()
    const diffInMs = now.getTime() - date.getTime()
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))

    if (diffInDays === 0) return "Today"
    if (diffInDays === 1) return "1 day ago"
    if (diffInDays < 7) return `${diffInDays} days ago`
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`
    if (diffInDays < 365) return `${Math.floor(diffInDays / 30)} months ago`
    return `${Math.floor(diffInDays / 365)} years ago`
  } catch {
    return dateString
  }
}
