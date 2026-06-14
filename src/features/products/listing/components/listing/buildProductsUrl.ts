interface BuildUrlBase {
  currentPage: number
  pageSize: number
  viewType: "grid" | "list"
  sort: string
  brands: string[]
  manufacturers: string[]
  minPrice: number | null
  maxPrice: number | null
  minRating: number | null
  inStock: boolean
}

interface BuildUrlOverrides {
  page?: number
  size?: number
  view?: "grid" | "list"
}

export const createProductsUrlBuilder = (base: BuildUrlBase) => {
  return ({ page, size, view }: BuildUrlOverrides = {}) => {
    const params = new URLSearchParams()
    params.set("page", String(page ?? base.currentPage))
    params.set("size", String(size ?? base.pageSize))
    params.set("view", view ?? base.viewType)
    if (base.sort && base.sort !== "best-match") params.set("sort", base.sort)

    for (const brand of base.brands) {
      params.append("brands", brand)
    }
    for (const manufacturer of base.manufacturers) {
      params.append("manufacturers", manufacturer)
    }
    if (base.minPrice != null) params.set("minPrice", String(base.minPrice))
    if (base.maxPrice != null) params.set("maxPrice", String(base.maxPrice))
    if (base.minRating != null) params.set("minRating", String(base.minRating))
    if (!base.inStock) params.set("inStock", "false")

    return `/products?${params.toString()}`
  }
}
