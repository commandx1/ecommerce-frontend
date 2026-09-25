import { notificationsKeys } from "@/features/notifications/lib/notifications-keys"
import type { BuyerOrderFilterType } from "@/lib/api/buyer-orders"
import type { VendorOrderFilterType } from "@/lib/api/vendor-orders"
import type { QuestionFilter } from "@/lib/api/vendor-questions"

/** Normalizes optional widget params so an omitted field and an explicit `undefined` produce the same key. */
function normalizePeriodicRevenueParams(params: { months?: number; year?: number }): {
  months: number | null
  year: number | null
} {
  return { months: params.months ?? null, year: params.year ?? null }
}

function normalizeGeoParams(params: { daysFromNow?: number }): { daysFromNow: number | null } {
  return { daysFromNow: params.daysFromNow ?? null }
}

/** View-model params for the vendor products list query (S9). Every field is required (use
 * `null`, never omit) so two callers can never drift into two different-looking keys for the
 * same request. */
export type VendorProductListParams =
  | {
      view: "review"
      approved: "TRUE" | "FALSE" | "NULL" | "ALL"
      sortBy: "createdDate" | "updatedDate"
      sortDir: "asc" | "desc"
      page: number
      size: number
    }
  | {
      view: "active"
      type: "ACTIVE" | "INACTIVE" | "OUT_OF_STOCK" | "LOW_STOCK" | "TOTAL"
      page: number
      size: number
      sortBy: string | null
      sortDir: "asc" | "desc" | null
      search: string
      howManySoldDay: number | null
      userProductId: string | null
      brand: string | null
    }

export interface VendorOrderListParams {
  page: number
  size: number
  sortBy: string | null
  sortDir: "asc" | "desc" | null
  type: VendorOrderFilterType
  orderId: string | null
}

export interface VendorQuestionListParams {
  page: number
  size: number
  filter: QuestionFilter
}

/** Params for the buyer's own orders list (Phase 4 §2.1). Every field is required (`null` when
 * unset), same convention as `VendorOrderListParams`. */
export interface BuyerOrderListParams {
  page: number
  size: number
  sortBy: "createdDate" | "totalPrice"
  sortDir: "asc" | "desc"
  type: BuyerOrderFilterType
  orderId: string | null
}

/** Params for the public vendor directory (`getVendors`, Phase 4 §2.1, wired up in step D1).
 * Mirrors `VendorListParams` (`lib/api/vendors.ts`) with every field required. */
export interface VendorDirectoryParams {
  page: number
  size: number
  sort: "rating" | "reviewCount" | "name" | null
  minRating: number | null
  search: string
}

/**
 * Central query key factory. Cart keys in particular must be invalidated from products,
 * buyer-orders and checkout code, so a single file keeps the invalidation map auditable
 * (see the Phase 2 design doc, §4). Vendor keys live here (Phase 3 §3.1); the old
 * `vendorProductStatsQueryKey` / `userProductBrandsQueryKey` / `vendorDocumentsQueryKey` /
 * `documentProductsQueryKey` exports in `src/lib/api/*.ts` are gone - this is their only home
 * now. Notifications keys are re-exported as-is (physical move in Phase 3).
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
    // GET /cards (Phase 4 §2.1) - the buyer's saved wallet, read by the payment-methods page
    // and by auto-orders readiness.
    cards: () => ["payment-methods", "cards"] as const,
  },
  orders: {
    all: ["orders"] as const,
    lists: () => ["orders", "list"] as const,
    list: (params: BuyerOrderListParams) => ["orders", "list", params] as const,
  },
  autoOrders: {
    all: ["auto-orders"] as const,
    list: () => ["auto-orders", "list"] as const,
  },
  // Role-neutral account resources read by more than one surface (checkout, buyer settings,
  // vendor settings, the vendor header) - see Phase 4 design doc §2.1 for why these are not
  // namespaced under `buyer`/`vendor`.
  company: {
    all: ["company"] as const,
    me: () => ["company", "me"] as const,
  },
  licenses: {
    all: ["licenses"] as const,
    list: () => ["licenses", "list"] as const,
  },
  vendors: {
    all: ["vendors"] as const,
    directory: (params: VendorDirectoryParams) => ["vendors", "directory", params] as const,
    favorites: {
      all: ["vendors", "favorites"] as const,
      ids: () => ["vendors", "favorites", "ids"] as const,
      list: () => ["vendors", "favorites", "list"] as const,
    },
  },
  favoriteProducts: {
    all: ["favorite-products"] as const,
    list: () => ["favorite-products", "list"] as const,
  },
  notifications: notificationsKeys,
  vendor: {
    all: ["vendor"] as const,
    overview: {
      all: ["vendor", "overview"] as const,
      revenueSummary: (daysFromNow: number) => ["vendor", "overview", "revenue-summary", daysFromNow] as const,
      reviewSummary: () => ["vendor", "overview", "review-summary"] as const,
      periodicRevenue: (params: { months?: number; year?: number }) =>
        ["vendor", "overview", "periodic-revenue", normalizePeriodicRevenueParams(params)] as const,
      topSelling: (params: { page: number; size: number; daysFromNow: number; sortDir: "asc" | "desc" }) =>
        ["vendor", "overview", "top-selling", params] as const,
      stockSummary: (params: { page: number; size: number }) =>
        ["vendor", "overview", "stock-summary", params] as const,
      geo: (params: { daysFromNow?: number }) => ["vendor", "overview", "geo", normalizeGeoParams(params)] as const,
    },
    products: {
      all: ["vendor", "products"] as const,
      lists: () => ["vendor", "products", "list"] as const,
      list: (params: VendorProductListParams) => ["vendor", "products", "list", params] as const,
      stats: () => ["vendor", "products", "stats"] as const,
      brands: () => ["vendor", "products", "brands"] as const,
      detail: (userProductId: string) => ["vendor", "products", "detail", userProductId] as const,
    },
    documents: {
      all: ["vendor", "documents"] as const,
      list: (page: number) => ["vendor", "documents", "list", page] as const,
      products: (documentId: string) => ["vendor", "documents", "products", documentId] as const,
    },
    orders: {
      all: ["vendor", "orders"] as const,
      list: (params: VendorOrderListParams) => ["vendor", "orders", "list", params] as const,
    },
    questions: {
      all: ["vendor", "questions"] as const,
      list: (params: VendorQuestionListParams) => ["vendor", "questions", "list", params] as const,
      counts: () => ["vendor", "questions", "counts"] as const,
    },
    reviews: {
      all: ["vendor", "reviews"] as const,
      dashboard: () => ["vendor", "reviews", "dashboard"] as const,
    },
  },
} as const

export const mutationKeys = {
  cart: {
    all: ["cart", "mutation"] as const,
  },
} as const
