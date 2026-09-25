import { getFullImageUrl } from "@/lib/api/products"
import type { DocumentProductsResponse } from "@/lib/api/vendor-documents"
import formatCurrency from "@/lib/helpers/formatCurrency"

export type ImportRowStatus = "success" | "skip" | "wrong" | "unknown"

export interface ImportRow {
  id: string
  status: ImportRowStatus
  name: string
  sku: string
  price: number | null
  stock: number | null
  image: string | null
  reason: string | null
  raw: Record<string, string> | null
}

// Spreadsheet headers are machine-readable ("Heavy_Shipping_Surcharge"), so they are
// mapped to the wording a vendor sees elsewhere in the dashboard. Keys are matched
// case-insensitively; anything not listed falls back to humanizeColumn().
const COLUMN_LABELS: Record<string, string> = {
  active: "Active",
  brand: "Brand",
  category: "Category",
  export_packaging: "Export Packaging",
  fulfillment_policy: "Fulfillment Policy",
  heavy_shipping_surcharge: "Heavy Shipping Fee",
  image: "Image",
  manufacture: "Manufacturer",
  manufacturer_code: "Manufacturer Code",
  name: "Product Name",
  price: "Price",
  shipment_fee: "Shipping Fee",
  sku: "SKU",
  status: "Row Status",
  stock: "Stock",
  vendor_product_code: "Vendor SKU",
}

// The template is file-driven, so a vendor can ship columns we have never seen.
// Turn "Some_Extra_Column" into "Some Extra Column" rather than printing it raw.
export function humanizeColumn(key: string): string {
  const words = key
    .trim()
    .replace(/[_-]+/g, " ")
    // Split camelCase without touching runs of capitals like "SKU".
    .replace(/([a-z\d])([A-Z])/g, "$1 $2")
    .split(/\s+/)
    .filter(Boolean)

  if (words.length === 0) return key

  return words
    .map((word) => {
      if (word === word.toUpperCase()) return word
      // `words` came through `.filter(Boolean)` above, so `word` is never empty here.
      const firstLetter = word[0]
      return firstLetter === undefined ? word : firstLetter.toUpperCase() + word.slice(1)
    })
    .join(" ")
}

export function columnLabel(key: string): string {
  return COLUMN_LABELS[key.trim().toLowerCase()] ?? humanizeColumn(key)
}

// Mirrors the backend's NUMERIC_COLUMNS — the spreadsheet columns that hold money.
const MONEY_COLUMNS = new Set(["price", "shipment_fee", "heavy_shipping_surcharge"])

// Cells arrive as raw strings ("43.4"), so money columns are rendered as currency.
// A value that is not a number is shown untouched rather than coerced to $0.00.
export function columnValue(key: string, value: string): string {
  if (!MONEY_COLUMNS.has(key.trim().toLowerCase())) return value

  const amount = Number(value)
  return Number.isFinite(amount) ? formatCurrency(amount) : value
}

// Column names come from the uploaded spreadsheet, so match them case-insensitively
// and never assume a fixed header set.
export function pickCell(row: Record<string, string>, candidates: string[]): string {
  const entries = Object.entries(row)
  for (const candidate of candidates) {
    const hit = entries.find(([key]) => key.trim().toLowerCase() === candidate)
    if (hit?.[1]?.trim()) return hit[1].trim()
  }
  return ""
}

// Every spreadsheet cell arrives as a string ("43.4", "50"), so numeric columns are
// parsed here. Anything that is not a plain number is dropped rather than rendered
// as NaN — the raw text stays visible in the expanded row either way.
export function pickNumericCell(row: Record<string, string>, candidates: string[]): number | null {
  const raw = pickCell(row, candidates)
  if (!raw) return null

  const direct = Number(raw)
  if (Number.isFinite(direct)) return direct

  // Tolerate currency symbols and spaces ("$43.4", "43.4 USD") but not ambiguous
  // thousands separators, which would silently change the value.
  const stripped = raw.replace(/[^\d.-]/g, "")
  const parsed = Number(stripped)
  return stripped !== "" && Number.isFinite(parsed) ? parsed : null
}

// Backend row-issue lines look like "Row 2: <reason>". The endpoint itself carries no
// per-row reason, so issues are matched back by their row number when one is parseable.
export function buildReasonLookup(rowIssues: string[]): Map<number, string> {
  const lookup = new Map<number, string>()
  for (const issue of rowIssues) {
    const match = issue.match(/^row\s+(\d+)\s*:\s*(.*)$/i)
    if (match?.[1] && match[2]?.trim()) {
      lookup.set(Number(match[1]), match[2].trim())
    }
  }
  return lookup
}

export function toRows(data: DocumentProductsResponse, rowIssues: string[]): ImportRow[] {
  const reasons = buildReasonLookup(rowIssues)
  const unmatchedReasons = [...reasons.values()]

  const productRows = data.products.map((entry, index) => ({
    id: `product-${index}`,
    status: (entry.status ?? "unknown") as ImportRowStatus,
    name: entry.product?.productName?.trim() || "—",
    sku: entry.product?.skuCode?.trim() || "—",
    price: entry.product?.price ?? null,
    stock: entry.product?.stock ?? null,
    image: entry.product?.coverPhotoPath ? getFullImageUrl(entry.product.coverPhotoPath) : null,
    reason: null,
    raw: null,
  }))

  const wrongRows = data.wrongRows.map((raw, index) => {
    const rowNumber = Number(pickCell(raw, ["row", "row number", "satır"]))
    const reason =
      (Number.isFinite(rowNumber) ? reasons.get(rowNumber) : undefined) ??
      // Fall back to positional pairing only when both lists line up exactly.
      (unmatchedReasons.length === data.wrongRows.length ? unmatchedReasons[index] : undefined) ??
      null

    return {
      id: `wrong-${index}`,
      status: "wrong" as const,
      name: pickCell(raw, ["product_name", "product name", "name", "detailed_name"]) || "—",
      // The backend fills UserProduct.skuCode from Vendor_Product_Code, so failed rows
      // are labelled the same way; Manufacturer_Code is only a fallback.
      sku: pickCell(raw, ["vendor_product_code", "sku_code", "sku", "manufacturer_code"]) || "—",
      price: pickNumericCell(raw, ["price"]),
      stock: pickNumericCell(raw, ["stock"]),
      image: null,
      reason,
      raw,
    }
  })

  return [...productRows, ...wrongRows]
}
