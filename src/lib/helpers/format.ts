// Single source of truth for currency/number/date formatting across the storefront. The whole
// UI is English-only, so every formatter below is pinned to LOCALE ("en-US") rather than the
// viewer's runtime locale - see order-view-utils.ts for the bug class this avoids (a tr-TR
// machine rendering the same date differently across the app).
export const LOCALE = "en-US"
export const CURRENCY = "USD"

const currencyFormatter = new Intl.NumberFormat(LOCALE, {
  style: "currency",
  currency: CURRENCY,
})

const numberFormatter = new Intl.NumberFormat(LOCALE)

// { year: "numeric", month: "short", day: "numeric" } -> "May 20, 2026"
const shortDateFormatter = new Intl.DateTimeFormat(LOCALE, {
  year: "numeric",
  month: "short",
  day: "numeric",
})

// { year: "numeric", month: "long", day: "numeric" } -> "May 20, 2026"
const longDateFormatter = new Intl.DateTimeFormat(LOCALE, {
  year: "numeric",
  month: "long",
  day: "numeric",
})

// { year: "numeric", month: "short", day: "2-digit" } -> "May 20, 2026" (zero-padded day)
const paddedDateFormatter = new Intl.DateTimeFormat(LOCALE, {
  year: "numeric",
  month: "short",
  day: "2-digit",
})

// { year: "numeric", month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit" }
const paddedDateTimeFormatter = new Intl.DateTimeFormat(LOCALE, {
  year: "numeric",
  month: "short",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
})

// No explicit options -> locale default numeric date, e.g. "5/20/2026"
const numericDateFormatter = new Intl.DateTimeFormat(LOCALE)

// { hour: "2-digit", minute: "2-digit" } -> "10:30 AM"
const timeFormatter = new Intl.DateTimeFormat(LOCALE, {
  hour: "2-digit",
  minute: "2-digit",
})

const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/
const HAS_TIMEZONE_INFO_PATTERN = /[zZ]|[+-]\d{2}:?\d{2}$/

/**
 * UTC contract: the backend (ecommerce-api) serializes `createdDate`/timestamp fields from a Java
 * `LocalDateTime` on a UTC JVM, so a wire string with no zone suffix (e.g. "2026-05-20T02:00:00"
 * or "2026-05-20 02:00:00.123456") always means UTC, never the viewer's local time. This parses
 * every shape the frontend actually receives - `Date`/`number` pass through, a bare "YYYY-MM-DD"
 * calendar date is read as a LOCAL date (so a calendar day like an invoice due date never shifts
 * by a day), a string with an explicit "Z"/±hh:mm offset is honored as-is, and any other
 * (zoneless) datetime string is normalized to UTC before parsing.
 */
export function parseApiDate(value: Date | string | number): Date {
  if (value instanceof Date) return value
  if (typeof value === "number") return new Date(value)
  // Untyped API payloads can still hand us null/undefined - yield an Invalid Date, never throw.
  if (typeof value !== "string") return new Date(Number.NaN)

  if (DATE_ONLY_PATTERN.test(value)) {
    const [year, month, day] = value.split("-").map(Number)
    return new Date(year, month - 1, day)
  }

  if (HAS_TIMEZONE_INFO_PATTERN.test(value)) {
    return new Date(value)
  }

  return new Date(`${value.replace(" ", "T")}Z`)
}

// `Date.prototype.toLocaleDateString`/`toLocaleString` return the literal string "Invalid Date"
// for an unparseable date instead of throwing. A bare `Intl.DateTimeFormat.format()` call throws
// a RangeError for the same input, so every date formatter below replicates the non-throwing
// legacy behavior explicitly.
function formatWith(formatter: Intl.DateTimeFormat, value: Date | string | number): string {
  const date = parseApiDate(value)
  return Number.isNaN(date.getTime()) ? "Invalid Date" : formatter.format(date)
}

/**
 * USD currency amount, e.g. `$1,234.56`. Non-finite and falsy amounts (NaN, Infinity, 0, null,
 * undefined) all collapse to `$0.00`.
 */
export function formatCurrency(amount: number): string {
  return currencyFormatter.format(Number.isFinite(amount) ? amount || 0 : 0)
}

/**
 * Upload-size label in binary megabytes: whole for an exact boundary ("1MB"), else one decimal
 * ("1.5MB"). Used in the "file too large" messages that quote the server's multipart limits.
 */
export function formatMb(bytes: number): string {
  return `${(bytes / (1024 * 1024)).toFixed(bytes % (1024 * 1024) === 0 ? 0 : 1)}MB`
}

/** Plain grouped number, e.g. `1,234`. */
export function formatNumber(value: number): string {
  return numberFormatter.format(value)
}

/** e.g. "May 20, 2026" (day not zero-padded). */
export function formatShortDate(value: Date | string | number): string {
  return formatWith(shortDateFormatter, value)
}

/** e.g. "May 20, 2026" (long month name). */
export function formatLongDate(value: Date | string | number): string {
  return formatWith(longDateFormatter, value)
}

/** e.g. "May 20, 2026" (day zero-padded). */
export function formatPaddedDate(value: Date | string | number): string {
  return formatWith(paddedDateFormatter, value)
}

/** e.g. "May 20, 2026, 10:30 AM". */
export function formatPaddedDateTime(value: Date | string | number): string {
  return formatWith(paddedDateTimeFormatter, value)
}

/** Locale-default numeric date, e.g. "5/20/2026". */
export function formatNumericDate(value: Date | string | number): string {
  return formatWith(numericDateFormatter, value)
}

/** e.g. "10:30 AM". */
export function formatTime(value: Date | string | number): string {
  return formatWith(timeFormatter, value)
}

export default formatCurrency
