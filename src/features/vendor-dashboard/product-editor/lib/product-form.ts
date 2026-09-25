import type { CategoryPath } from "@/lib/category-tree"

export interface ProductFormValues {
  // Product fields
  name: string
  detailedName: string
  barcode: string
  barcodeFormats: string
  active: boolean
  // Product Details fields
  description: string
  manufacturerCode: string
  manufacturer: string
  brand: string
  exampleVariationsProductId: string
  categoryPath: CategoryPath | null
  legacyCategory: string | null
  manufacturerSiteProductPage: string
  dentalLicenseRequired: string
  height: string
  length: string
  width: string
  weight: string
  // User Product fields
  skuCode: string
  price: string
  stock: string
  shipmentFee: string
  heavyShippingSurcharge: string
  exportPackaging: boolean
  fulfillmentPolicy: string
}

/** Field name -> message. Besides form fields it can carry `submit` (the backend's rejection). */
export type FieldErrors = Record<string, string>

export const INITIAL_VALUES: ProductFormValues = {
  name: "",
  detailedName: "",
  barcode: "",
  barcodeFormats: "EAN_13",
  active: true,
  description: "",
  manufacturerCode: "",
  manufacturer: "",
  brand: "",
  exampleVariationsProductId: "",
  categoryPath: null,
  legacyCategory: null,
  manufacturerSiteProductPage: "",
  dentalLicenseRequired: "No",
  height: "",
  length: "",
  width: "",
  weight: "",
  skuCode: "",
  price: "",
  stock: "",
  shipmentFee: "",
  heavyShippingSurcharge: "",
  exportPackaging: false,
  fulfillmentPolicy: "",
}

export const TAB_FIELDS = {
  basic: [
    "name",
    "detailedName",
    "barcode",
    "barcodeFormats",
    "skuCode",
    "price",
    "discount",
    "stock",
    "shipmentFee",
    "heavyShippingSurcharge",
    "exportPackaging",
    "fulfillmentPolicy",
  ],
  details: [
    "description",
    "manufacturerCode",
    "manufacturer",
    "brand",
    "exampleVariationsProductId",
    "category",
    "manufacturerSiteProductPage",
    "dentalLicenseRequired",
    "height",
    "length",
    "width",
    "weight",
  ],
  media: ["coverPhoto"],
} as const

const TAB_ORDER = ["basic", "details", "media"] as const
export type TabKey = (typeof TAB_ORDER)[number]

export const ALL_FIELDS: readonly string[] = [...TAB_FIELDS.basic, ...TAB_FIELDS.details, ...TAB_FIELDS.media]

export const BARCODE_FORMAT_OPTIONS = [
  { value: "EAN_13", label: "EAN-13" },
  { value: "EAN_8", label: "EAN-8" },
  { value: "UPC_A", label: "UPC-A" },
  { value: "UPC_E", label: "UPC-E" },
  { value: "CODE_128", label: "Code 128" },
  { value: "CODE_39", label: "Code 39" },
  { value: "QR_CODE", label: "QR Code" },
] as const

/** Unknown names (including `submit`) fall through to "media", as they always have. */
export function getTabForField(fieldName: string): TabKey {
  if ((TAB_FIELDS.basic as readonly string[]).includes(fieldName)) return "basic"
  if ((TAB_FIELDS.details as readonly string[]).includes(fieldName)) return "details"
  return "media"
}

export function countTabErrors(errors: FieldErrors, tab: TabKey): number {
  const fields = TAB_FIELDS[tab] as readonly string[]
  return Object.keys(errors).filter((key) => key !== "submit" && fields.includes(key)).length
}

/**
 * Fields a forward move from `from` to `to` has to validate: every tab from the current one up
 * to (not including) the target, so a header click that skips a tab still checks it. Backward
 * or same-tab moves validate nothing.
 */
export function fieldsBetweenTabs(from: TabKey, to: TabKey): readonly string[] {
  const fromIndex = TAB_ORDER.indexOf(from)
  const toIndex = TAB_ORDER.indexOf(to)
  if (toIndex <= fromIndex) return []
  return TAB_ORDER.slice(fromIndex, toIndex).flatMap((tab) => TAB_FIELDS[tab])
}

/** The tab the Previous / Next buttons lead to; null past either end. */
export function adjacentTab(tab: TabKey, step: -1 | 1): TabKey | null {
  return TAB_ORDER[TAB_ORDER.indexOf(tab) + step] ?? null
}

/** Returns `errors` itself when `name` has no error, so a state setter can bail out of a re-render. */
export function withoutError(errors: FieldErrors, name: string): FieldErrors {
  if (!errors[name]) return errors
  const next = { ...errors }
  delete next[name]
  return next
}

/**
 * "edit" updates price/stock/discount on an approved listing; "reviewEdit" resubmits a rejected
 * product with the full form. When both URL params are present review-edit wins everywhere
 * except the submit branch (see `selectSubmitBranch`).
 */
export type EditorMode = "create" | "edit" | "reviewEdit"

export function resolveEditorMode(flags: { isEditMode: boolean; isReviewEditMode: boolean }): EditorMode {
  if (flags.isReviewEditMode) return "reviewEdit"
  return flags.isEditMode ? "edit" : "create"
}
