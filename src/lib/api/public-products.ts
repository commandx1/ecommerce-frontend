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

export async function getPublicProducts<TProduct = unknown>(
  page = 0,
  size = 10,
): Promise<PublicProductsResponse<TProduct>> {
  const baseUrl = requireBackendUrl()
  return apiRequest.requestJson<PublicProductsResponse<TProduct>>({
    client: "app",
    method: "GET",
    url: `${baseUrl}/api/products/public`,
    params: { page, size },
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
