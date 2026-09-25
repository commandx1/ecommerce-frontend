/**
 * Moved from `app/buyer-dashboard/orders/lib/order-view-utils.ts` (Phase 4 design doc §7, step
 * O1) - a generic axios-error-body reader, not an orders concept. Lives next to `auth-error.ts`
 * since both read shape out of an unknown caught error. Used by buyer orders, vendor orders,
 * notifications and auto-orders to turn a failed write into a user-facing toast description.
 */
export function extractApiErrorMessage(error: unknown): string | null {
  if (!error || typeof error !== "object") return null

  const maybeError = error as {
    message?: unknown
    response?: { data?: unknown }
  }

  const data = maybeError.response?.data
  if (typeof data === "string" && data.trim()) {
    return data
  }

  if (data && typeof data === "object") {
    const payload = data as { message?: unknown; error?: unknown }

    if (typeof payload.message === "string" && payload.message.trim()) {
      return payload.message
    }

    if (typeof payload.error === "string" && payload.error.trim()) {
      if (payload.error.startsWith("{")) {
        try {
          const nested = JSON.parse(payload.error) as { message?: unknown; error?: unknown }
          if (typeof nested.message === "string" && nested.message.trim()) {
            return nested.message
          }
          if (typeof nested.error === "string" && nested.error.trim()) {
            return nested.error
          }
        } catch {
          // ignore invalid nested JSON
        }
      }

      return payload.error
    }
  }

  if (typeof maybeError.message === "string" && maybeError.message.trim()) {
    return maybeError.message
  }

  return null
}
