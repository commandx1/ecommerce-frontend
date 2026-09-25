import { formatPaddedDate, formatPaddedDateTime, formatTime, parseApiDate } from "@/lib/helpers/format"

/** Order format/status helpers shared by buyer and vendor orders. */

export function formatDateTime(value?: string | null): string {
  if (!value) return "-"
  const parsed = parseApiDate(value)
  if (Number.isNaN(parsed.getTime())) return "-"

  return formatPaddedDateTime(parsed)
}

export function formatDateOnly(value?: string | null): string {
  if (!value) return "-"
  const parsed = parseApiDate(value)
  if (Number.isNaN(parsed.getTime())) return "-"

  // "en-US", not the viewer's locale: every other date in the app is pinned to it and the UI is
  // English-only (a tr-TR runtime default rendered mixed formats on one screen).
  return formatPaddedDate(parsed)
}

export function formatTimeOnly(value?: string | null): string {
  if (!value) return "-"
  const parsed = parseApiDate(value)
  if (Number.isNaN(parsed.getTime())) return "-"

  // Pinned for the same reason as formatDateOnly (the runtime default can be a 24-hour clock).
  return formatTime(parsed)
}

export function getSellerFirstTwoLetters(value: string): string {
  if (typeof value !== "string") return "SE"
  const words = value
    .split(/\s+/)
    .map((word) => word.trim())
    .filter(Boolean)

  if (words.length === 0) return "SE"
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase()

  return `${words[0][0] ?? ""}${words[1][0] ?? ""}`.toUpperCase()
}

export function getOrderStatusClasses(orderStatus: string): string {
  return orderStatus === "PAYMENT_SUCCESS"
    ? "border border-success/20 bg-success/14 text-success"
    : "border border-border-soft bg-surface-muted text-text-primary"
}

export function getOrderItemStatusTagClass(status: string): string {
  const normalizedStatus = typeof status === "string" ? status.toUpperCase() : ""

  if (normalizedStatus.includes("CANCEL")) {
    return "border border-danger/40 bg-danger/15 text-danger"
  }
  if (normalizedStatus.includes("DELIVER")) {
    return "border border-success/40 bg-success/15 text-success"
  }
  // Excludes "WAITING" so a not-yet-shipped item (real backend value WAITING_FOR_SHIPMENT,
  // which itself contains the substring "SHIP") isn't tagged with the same "already shipped"
  // brand color as an item that has actually shipped (e.g. SHIPMENT_ERROR).
  if (normalizedStatus.includes("SHIP") && !normalizedStatus.includes("WAITING")) {
    return "border border-brand/40 bg-brand/15 text-brand"
  }
  if (normalizedStatus.includes("REFUND") || normalizedStatus.includes("RETURN")) {
    return "border border-brand/40 bg-brand/15 text-brand"
  }

  return "border border-warning/40 bg-warning/15 text-warning"
}

export function formatOrderItemStatus(status: string): string {
  if (typeof status !== "string") return ""
  return status
    .toLowerCase()
    .split("_")
    .map((part) => (part ? `${part[0].toUpperCase()}${part.slice(1)}` : ""))
    .join(" ")
}

export function formatRefundStatus(refundStatus: string): string {
  const normalizedStatus = typeof refundStatus === "string" ? refundStatus.toUpperCase() : ""
  if (normalizedStatus === "APPROVED") return "Return Approved"
  if (normalizedStatus === "CANCELLED") return "Return Cancelled"
  if (normalizedStatus === "PENDING") return "Return Pending"
  return `Return ${formatOrderItemStatus(refundStatus)}`
}
