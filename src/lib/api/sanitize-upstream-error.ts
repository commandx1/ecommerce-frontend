/**
 * Sanitizes an upstream error body before it is forwarded to the browser: only a `message` string
 * that does not look like a stack trace is trusted; everything else collapses to a generic,
 * status-coded message, so internal details never leak.
 */

const STACK_TRACE_PATTERN = /\n|\tat |Exception|com\./

function isSuspiciousMessage(message: string): boolean {
  return STACK_TRACE_PATTERN.test(message)
}

function genericMessage(status: number): string {
  return `Request failed with status ${status}`
}

/**
 * `rawBody` is the raw text of the upstream error response. Returns a message safe to forward
 * to the browser.
 */
export function sanitizeUpstreamErrorMessage(rawBody: string, status: number): string {
  let parsed: unknown
  try {
    parsed = JSON.parse(rawBody)
  } catch {
    return genericMessage(status)
  }

  if (parsed && typeof parsed === "object" && "message" in parsed) {
    const message = (parsed as { message?: unknown }).message
    if (typeof message === "string" && !isSuspiciousMessage(message)) {
      return message
    }
  }

  return genericMessage(status)
}
