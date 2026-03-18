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
  const res = await fetch(`${baseUrl}/api/products/public?page=${page}&size=${size}`, {
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
    },
  })

  if (!res.ok) {
    throw new Error("Failed to fetch products")
  }

  return res.json()
}

export async function getProductBrands(): Promise<string[]> {
  const baseUrl = requireBackendUrl()
  const res = await fetch(`${baseUrl}/api/products/brands`, {
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
    },
  })
  return res.ok ? res.json() : []
}

export async function getProductManufacturers(): Promise<string[]> {
  const baseUrl = requireBackendUrl()
  const res = await fetch(`${baseUrl}/api/products/manufacturers`, {
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
    },
  })
  return res.ok ? res.json() : []
}
