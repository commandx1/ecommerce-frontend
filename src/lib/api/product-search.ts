"use client"

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

  const response = await fetch(`/api/products/public-search?Search=${encodeURIComponent(q)}&page=${page}&size=${size}`)
  if (!response.ok) return []

  const data: SearchResponse = await response.json()
  return data.content || []
}

