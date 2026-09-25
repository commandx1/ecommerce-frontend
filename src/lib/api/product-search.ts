import { apiRequest } from "./request"

export interface SearchProduct {
  productId: string
  productName: string
  barcode: string
  coverPhotoPath: string | null
  secureCode: string
  manufacturerCode: string
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
        search: q,
        page,
        size,
      },
      fallbackMessage: "Failed to fetch products",
    })
    // Array.isArray, not `|| []`: a wrong-typed body would reach `.map()` in the search dropdown,
    // which renders on every page.
    return Array.isArray(data.content) ? data.content : []
  } catch {
    return []
  }
}
