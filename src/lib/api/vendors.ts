import { apiRequest } from "@/lib/api/request"

export interface VendorListItem {
  id: string
  name: string
  slug: string
  averageRating: number
  reviewCount: number
  productCount: number
}

export interface VendorPageResponse {
  vendors: VendorListItem[]
  totalCount: number
  page: number
  size: number
  totalPages: number
}

export interface CompanyListItem {
  id: string
  name: string
  companyPhoto: string | null
  slug: string
  averageRating: number
  reviewCount: number
  productCount: number
}

export interface CompanyPageResponse {
  companies: CompanyListItem[]
  totalCount: number
  page: number
  size: number
  totalPages: number
}

export interface VendorListParams {
  page?: number
  size?: number
  sort?: "rating" | "reviewCount" | "name"
  minRating?: number
  search?: string
  signal?: AbortSignal
}

export async function getMyFavoriteVendorIds(): Promise<string[]> {
  return apiRequest.requestJson<string[]>({
    client: "backend",
    method: "GET",
    url: "/vendors/favorite-ids",
    fallbackMessage: "Failed to fetch favorite vendor IDs",
  })
}

export async function getMyFavoriteVendors(): Promise<VendorListItem[]> {
  return apiRequest.requestJson<VendorListItem[]>({
    client: "backend",
    method: "GET",
    url: "/vendors/favorites",
    fallbackMessage: "Failed to fetch favorite vendors",
  })
}

export async function addVendorFavorite(vendorId: string): Promise<void> {
  await apiRequest.requestJson<void>({
    client: "backend",
    method: "POST",
    url: `/vendors/${vendorId}/favorite`,
    fallbackMessage: "Failed to add vendor to favorites",
  })
}

export async function removeVendorFavorite(vendorId: string): Promise<void> {
  await apiRequest.requestJson<void>({
    client: "backend",
    method: "DELETE",
    url: `/vendors/${vendorId}/favorite`,
    fallbackMessage: "Failed to remove vendor from favorites",
  })
}

export async function getVendors(params: VendorListParams = {}): Promise<VendorPageResponse> {
  const query = new URLSearchParams()
  if (params.page !== undefined) query.set("page", String(params.page))
  if (params.size !== undefined) query.set("size", String(params.size))
  if (params.sort) query.set("sort", params.sort)
  if (params.minRating !== undefined) query.set("minRating", String(params.minRating))
  if (params.search) query.set("search", params.search)

  return apiRequest.requestJson<VendorPageResponse>({
    client: "backend",
    method: "GET",
    url: `/vendors?${query.toString()}`,
    signal: params.signal,
    fallbackMessage: "Failed to fetch vendors",
  })
}

export async function getCompanies(params: VendorListParams = {}): Promise<CompanyPageResponse> {
  const query = new URLSearchParams()
  if (params.page !== undefined) query.set("page", String(params.page))
  if (params.size !== undefined) query.set("size", String(params.size))
  if (params.sort) query.set("sort", params.sort)
  if (params.minRating !== undefined) query.set("minRating", String(params.minRating))
  if (params.search) query.set("search", params.search)

  return apiRequest.requestJson<CompanyPageResponse>({
    client: "backend",
    method: "GET",
    url: `/vendors/companies?${query.toString()}`,
    signal: params.signal,
    fallbackMessage: "Failed to fetch companies",
  })
}
