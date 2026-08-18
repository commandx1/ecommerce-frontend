/**
 * "in 12 days" / "today" / "due now" next to the absolute next-order date.
 *
 * The backend serialises `nextOrderDate` as a naive LocalDateTime, so it is
 * normalised the same way the buyer orders table does it.
 */
export function describeNextOrderDate(value: string | null | undefined): string | null {
  if (!value) return null

  const hasTimeZoneInfo = /[zZ]|[+-]\d{2}:\d{2}$/.test(value)
  const parsed = new Date(hasTimeZoneInfo ? value : `${value.replace(" ", "T")}Z`)
  if (Number.isNaN(parsed.getTime())) return null

  const dayInMs = 24 * 60 * 60 * 1000
  const days = Math.round((parsed.getTime() - Date.now()) / dayInMs)

  if (days < 0) return "due now"
  if (days === 0) return "today"
  if (days === 1) return "tomorrow"
  return `in ${days} days`
}
