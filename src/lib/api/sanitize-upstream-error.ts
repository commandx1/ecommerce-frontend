/**
 * Sanitizes an upstream (backend) error body before it is forwarded to the browser.
 *
 * Backends occasionally answer failures with a raw stack trace instead of a clean JSON error
 * payload. Forwarding that verbatim leaks internal implementation detail (class names, file
 * paths, line numbers) to the client. This helper only trusts a `message` string field from a
 * JSON body, and only when that string does not itself look like a stack trace; everything else
 * collapses to a generic, status-coded message.
 *
 * Used by: `src/app/api/users/me/route.ts`, `src/app/api/product-questions/route.ts`,
 * `src/app/api/product-answers/route.ts`.
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
