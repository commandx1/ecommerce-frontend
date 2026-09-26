export const VALID_SORT_VALUES = ["price-asc", "price-desc", "rating", "newest", "name-asc"] as const
export type SortValue = (typeof VALID_SORT_VALUES)[number] | "best-match"

export interface ListingSearchParams {
  page?: string
  size?: string
  sort?: string
  brands?: string | string[]
  manufacturers?: string | string[]
  categories?: string | string[]
  vendors?: string | string[]
  minPrice?: string
  maxPrice?: string
  minRating?: string
  inStock?: string
  attributes?: string | string[]
  companyId?: string
  q?: string
}

export interface ParsedListingSearchParams {
  displayPage: number
  pageSize: number
  apiPage: number
  sort: SortValue
  brands: string[]
  manufacturers: string[]
  categories: string[]
  vendors: string[]
  minPrice: number | null
  maxPrice: number | null
  minRating: number | null
  inStock: boolean
  attributes: string[]
  companyId: string | null
  search: string | null
}

const DEFAULT_PAGE = 1
const DEFAULT_PAGE_SIZE = 10
// Must match backend ProductController.MAX_PUBLIC_PRODUCT_PAGE_SIZE (30); GET /api/products/public returns 400 above it.
export const MAX_PAGE_SIZE = 30
// Free-text search term (q): trimmed and capped so an unbounded query string can't be forwarded
// to the backend relevance search verbatim.
export const MAX_SEARCH_LENGTH = 100

function parseSearchQuery(value: string | undefined): string | null {
  if (!value) return null
  const trimmed = value.trim().slice(0, MAX_SEARCH_LENGTH)
  return trimmed || null
}

function parsePositiveInt(value: string | undefined, fallback: number) {
  const parsedValue = Number.parseInt(value ?? "", 10)
  if (!Number.isFinite(parsedValue) || parsedValue <= 0) {
    return fallback
  }
  return parsedValue
}

function parsePositiveFloat(value: string | undefined): number | null {
  if (!value) return null
  const parsed = Number.parseFloat(value)
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null
}

function parseStringArray(value: string | string[] | undefined): string[] {
  if (!value) return []
  return Array.isArray(value) ? value.filter(Boolean) : [value].filter(Boolean)
}

export function parseListingSearchParams(params: ListingSearchParams): ParsedListingSearchParams {
  const displayPage = parsePositiveInt(params.page, DEFAULT_PAGE)
  const requestedPageSize = parsePositiveInt(params.size, DEFAULT_PAGE_SIZE)
  const pageSize = Math.min(requestedPageSize, MAX_PAGE_SIZE)
  const sort: SortValue = VALID_SORT_VALUES.includes(params.sort as (typeof VALID_SORT_VALUES)[number])
    ? (params.sort as SortValue)
    : "best-match"
  const inStock = params.inStock !== "false"

  return {
    displayPage,
    pageSize,
    apiPage: Math.max(0, displayPage - 1),
    sort,
    brands: parseStringArray(params.brands),
    manufacturers: parseStringArray(params.manufacturers),
    categories: parseStringArray(params.categories),
    vendors: parseStringArray(params.vendors),
    minPrice: parsePositiveFloat(params.minPrice),
    maxPrice: parsePositiveFloat(params.maxPrice),
    minRating: parsePositiveFloat(params.minRating),
    inStock,
    attributes: parseStringArray(params.attributes),
    companyId: params.companyId ?? null,
    search: parseSearchQuery(params.q),
  }
}
