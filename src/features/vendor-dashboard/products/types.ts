import type { Product, UserProduct } from "@/lib/api/products"

/** A list row: the vendor's `UserProduct` plus the `Product` it was merged from (real for the
 * review queue, a synthetic fallback for the filter endpoint — see `lib/product-list-mappers`)
 * and a resolved image URL. */
export interface ProductWithDetails extends UserProduct {
  product?: Product
  image?: string
}

export type ProductStatusDraft = "active" | "inactive"
export type PeriodTab = "3 months" | "6 months" | "12 months"
export type ViewMode = "products" | "review"
export type ReviewApprovedFilter = "NULL" | "FALSE" | "ALL"

/** The inline-edit row draft. Every field is a string because it is bound to an `<input>` —
 * see `lib/inline-edit.ts` for parsing and validation. */
export interface EditingDraft {
  price: string
  discount: string
  stock: string
  active: ProductStatusDraft
  shipmentFee: string
  heavyShippingSurcharge: string
}
