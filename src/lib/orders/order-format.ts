import { formatPaddedDate, formatPaddedDateTime, formatTime, parseApiDate } from "@/lib/helpers/format"

/**
 * Moved from `app/buyer-dashboard/orders/lib/order-view-utils.ts` (Phase 4 design doc §7, step
 * O1) - these format/status helpers apply to an order regardless of which dashboard is showing
 * it. Buyer and vendor orders (tables, mobile lists, the expanded row) both import from here now.
 */

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

  // "en-US", not the viewer's locale: every other date in the app is pinned to it
  // (WelcomeSection, CompanyInfoCard, AccountSettingsShared, ProductDetailModal,
  // ImportDocumentsModal, vendor questions), and the UI itself is English-only. Left on the
  // runtime default, these two formatters were the sole outliers - on a tr-TR machine an order
  // rendered "22 May 2026" in the timeline and "May 22, 2026" everywhere else on the same screen.
  return formatPaddedDate(parsed)
}

export function formatTimeOnly(value?: string | null): string {
  if (!value) return "-"
  const parsed = parseApiDate(value)
  if (Number.isNaN(parsed.getTime())) return "-"

  // Pinned for the same reason as formatDateOnly above: the runtime default gave a 24-hour clock
  // on a tr-TR machine while the rest of the app showed 12-hour times.
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
