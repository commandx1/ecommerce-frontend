import { apiRequest } from "./request"

const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:8081"

export type PublicProductsResponse<TProduct = unknown> = {
  content?: TProduct[]
  totalElements?: number
  totalPages?: number
}

export type FilterOption = { name: string; count: number }
export type VendorOption = { id: string; name: string; count: number }
export type CompanyOption = { id: string; name: string; count: number }
export type AttributeValueOption = { value: string; count: number }
export type AttributeGroup = { attributeName: string; values: AttributeValueOption[] }

function requireBackendUrl() {
  if (!BACKEND_URL) {
    throw new Error("BACKEND_URL is not set")
  }
  return BACKEND_URL
}

export interface PublicProductsFilterParams {
  brands?: string[]
  manufacturers?: string[]
  categories?: string[]
  vendorIds?: string[]
  companyId?: string | null
  minPrice?: number | null
  maxPrice?: number | null
  minRating?: number | null
  inStock?: boolean
  sort?: string
  attributes?: string[]
}

export async function getPublicProducts<TProduct = unknown>(
  page = 0,
  size = 10,
  filters: PublicProductsFilterParams = {},
): Promise<PublicProductsResponse<TProduct>> {
  const baseUrl = requireBackendUrl()

  const qs = new URLSearchParams()
  qs.set("page", String(page))
  qs.set("size", String(size))

  for (const brand of filters.brands ?? []) qs.append("brands", brand)
  for (const mfr of filters.manufacturers ?? []) qs.append("manufacturers", mfr)
  for (const cat of filters.categories ?? []) qs.append("categories", cat)
  for (const v of filters.vendorIds ?? []) qs.append("vendorIds", v)
  if (filters.companyId) qs.set("companyId", filters.companyId)
  if (filters.minPrice != null) qs.set("minPrice", String(filters.minPrice))
  if (filters.maxPrice != null) qs.set("maxPrice", String(filters.maxPrice))
  if (filters.minRating != null) qs.set("minRating", String(filters.minRating))
  if (filters.inStock === false) qs.set("inStock", "false")
  if (filters.sort && filters.sort !== "best-match") qs.set("sort", filters.sort)
  for (const attr of filters.attributes ?? []) qs.append("attributes", attr)

  return apiRequest.requestJson<PublicProductsResponse<TProduct>>({
    client: "app",
    method: "GET",
    url: `${baseUrl}/api/products/public?${qs.toString()}`,
    fallbackMessage: "Failed to fetch products",
  })
}

export async function getProductBrandOptions(): Promise<FilterOption[]> {
  const baseUrl = requireBackendUrl()
  try {
    return await apiRequest.requestJson<FilterOption[]>({
      client: "app",
      method: "GET",
      url: `${baseUrl}/api/products/brands`,
      fallbackMessage: "Failed to fetch product brands",
    })
  } catch {
    return []
  }
}

export async function getProductManufacturerOptions(): Promise<FilterOption[]> {
  const baseUrl = requireBackendUrl()
  try {
    return await apiRequest.requestJson<FilterOption[]>({
      client: "app",
      method: "GET",
      url: `${baseUrl}/api/products/manufacturers`,
      fallbackMessage: "Failed to fetch product manufacturers",
    })
  } catch {
    return []
  }
}

export async function getProductVendorOptions(): Promise<VendorOption[]> {
  const baseUrl = requireBackendUrl()
  try {
    return await apiRequest.requestJson<VendorOption[]>({
      client: "app",
      method: "GET",
      url: `${baseUrl}/api/products/vendors`,
      fallbackMessage: "Failed to fetch product vendors",
    })
  } catch {
    return []
  }
}

export async function getProductCompanyOptions(): Promise<CompanyOption[]> {
  const baseUrl = requireBackendUrl()
  try {
    return await apiRequest.requestJson<CompanyOption[]>({
      client: "app",
      method: "GET",
      url: `${baseUrl}/api/products/companies`,
      fallbackMessage: "Failed to fetch product companies",
    })
  } catch {
    return []
  }
}

export async function getProductCategoryOptions(): Promise<FilterOption[]> {
  const baseUrl = requireBackendUrl()
  try {
    return await apiRequest.requestJson<FilterOption[]>({
      client: "app",
      method: "GET",
      url: `${baseUrl}/api/products/categories`,
      fallbackMessage: "Failed to fetch product categories",
    })
  } catch {
    return []
  }
}

export async function getProductAttributeOptions(): Promise<AttributeGroup[]> {
  const baseUrl = requireBackendUrl()
  try {
    return await apiRequest.requestJson<AttributeGroup[]>({
      client: "app",
      method: "GET",
      url: `${baseUrl}/api/products/attributes`,
      fallbackMessage: "Failed to fetch product attributes",
    })
  } catch {
    return []
  }
}
