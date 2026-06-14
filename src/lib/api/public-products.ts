import { apiRequest } from "./request"

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL

export type PublicProductsResponse<TProduct = unknown> = {
  content?: TProduct[]
  totalElements?: number
  totalPages?: number
}

function requireBackendUrl() {
  if (!BACKEND_URL) {
    throw new Error("NEXT_PUBLIC_BACKEND_URL is not set")
  }
  return BACKEND_URL
}

export interface PublicProductsFilterParams {
  brands?: string[]
  manufacturers?: string[]
  minPrice?: number | null
  maxPrice?: number | null
  minRating?: number | null
  inStock?: boolean
  sort?: string
}

export async function getPublicProducts<TProduct = unknown>(
  page = 0,
  size = 10,
  filters: PublicProductsFilterParams = {},
): Promise<PublicProductsResponse<TProduct>> {
  const baseUrl = requireBackendUrl()

  // Build query string manually to ensure arrays serialize as repeated keys
  // (e.g. brands=3M&brands=Dentsply) which Spring Boot @RequestParam List<String> expects
  const qs = new URLSearchParams()
  qs.set("page", String(page))
  qs.set("size", String(size))

  for (const brand of filters.brands ?? []) qs.append("brands", brand)
  for (const mfr of filters.manufacturers ?? []) qs.append("manufacturers", mfr)
  if (filters.minPrice != null) qs.set("minPrice", String(filters.minPrice))
  if (filters.maxPrice != null) qs.set("maxPrice", String(filters.maxPrice))
  if (filters.minRating != null) qs.set("minRating", String(filters.minRating))
  if (filters.inStock === false) qs.set("inStock", "false")
  if (filters.sort && filters.sort !== "best-match") qs.set("sort", filters.sort)

  return apiRequest.requestJson<PublicProductsResponse<TProduct>>({
    client: "app",
    method: "GET",
    url: `${baseUrl}/api/products/public?${qs.toString()}`,
    fallbackMessage: "Failed to fetch products",
  })
}

export async function getProductBrands(): Promise<string[]> {
  const baseUrl = requireBackendUrl()
  try {
    return await apiRequest.requestJson<string[]>({
      client: "app",
      method: "GET",
      url: `${baseUrl}/api/products/brands`,
      fallbackMessage: "Failed to fetch product brands",
    })
  } catch {
    return []
  }
}

export async function getProductManufacturers(): Promise<string[]> {
  const baseUrl = requireBackendUrl()
  try {
    return await apiRequest.requestJson<string[]>({
      client: "app",
      method: "GET",
      url: `${baseUrl}/api/products/manufacturers`,
      fallbackMessage: "Failed to fetch product manufacturers",
    })
  } catch {
    return []
  }
}
