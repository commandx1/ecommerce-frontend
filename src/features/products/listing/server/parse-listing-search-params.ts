export interface ListingSearchParams {
  page?: string
  size?: string
  view?: string
}

export interface ParsedListingSearchParams {
  displayPage: number
  pageSize: number
  apiPage: number
  viewType: "grid" | "list"
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

export function parseListingSearchParams(params: ListingSearchParams): ParsedListingSearchParams {
  const displayPage = parsePositiveInt(params.page, DEFAULT_PAGE)
  const requestedPageSize = parsePositiveInt(params.size, DEFAULT_PAGE_SIZE)
  const pageSize = Math.min(requestedPageSize, MAX_PAGE_SIZE)
  const viewType = params.view === "list" ? "list" : "grid"

  return {
    displayPage,
    pageSize,
    apiPage: Math.max(0, displayPage - 1),
    viewType,
  }
}
