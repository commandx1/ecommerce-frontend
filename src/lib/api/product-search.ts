import { apiRequest } from "./request"

export interface SearchProduct {
  productId: string
  productName: string
  barcode: string
  coverPhotoPath: string | null
  secureCode: string
  manufacturerCode: string
  reorderId: string | null
  referanceNumber: string | null
  userId: string
  price: number
  oldPrice: number
  discount: number
  stock: number
}

export interface SearchResponse {
  content: SearchProduct[]
  pageable: {
    pageNumber: number
    pageSize: number
    sort: {
      empty: boolean
      unsorted: boolean
      sorted: boolean
    }
    offset: number
    unpaged: boolean
    paged: boolean
  }
  last: boolean
  totalPages: number
  totalElements: number
  size: number
  number: number
  sort: {
    empty: boolean
    unsorted: boolean
    sorted: boolean
  }
  numberOfElements: number
  first: boolean
  empty: boolean
}

export async function searchPublicProducts(query: string, page = 0, size = 20): Promise<SearchProduct[]> {
  const q = query.trim()
  if (!q) return []

  try {
    const data = await apiRequest.requestJson<SearchResponse>({
      client: "app",
      method: "GET",
      url: "/api/products/public-search",
      params: {
        Search: q,
        page,
        size,
      },
      fallbackMessage: "Failed to fetch products",
    })
    return data.content || []
  } catch {
    return []
  }
}
