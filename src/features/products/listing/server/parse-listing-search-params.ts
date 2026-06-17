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
}

const DEFAULT_PAGE = 1
const DEFAULT_PAGE_SIZE = 10
const MAX_PAGE_SIZE = 60

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
  }
}
