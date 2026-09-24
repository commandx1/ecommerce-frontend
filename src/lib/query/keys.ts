import { notificationsKeys } from "@/features/notifications/lib/notifications-keys"

/**
 * Central query key factory. Cart keys in particular must be invalidated from products,
 * buyer-orders and checkout code, so a single file keeps the invalidation map auditable
 * (see the Phase 2 design doc, §4). Vendor keys still live in `src/lib/api/*.ts` and move
 * here in Phase 3; notifications keys are re-exported as-is (physical move in Phase 3).
 */
export const queryKeys = {
  cart: {
    all: ["cart"] as const,
    detail: () => ["cart", "detail"] as const,
    taxEstimate: (params: { addressId: string; shippingAmount: number; linesSignature: string }) =>
      ["cart", "tax-estimate", params] as const,
  },
  addresses: {
    all: ["addresses"] as const,
    list: () => ["addresses", "list"] as const,
  },
  paymentMethods: {
    all: ["payment-methods"] as const,
    // GET /orders/saved-cards
    checkoutSavedCards: () => ["payment-methods", "checkout-saved-cards"] as const,
  },
  orders: {
    all: ["orders"] as const, // populated in Phase 4
  },
  autoOrders: {
    all: ["auto-orders"] as const, // populated in Phase 4
  },
  notifications: notificationsKeys,
} as const

export const mutationKeys = {
  cart: {
    all: ["cart", "mutation"] as const,
  },
} as const
