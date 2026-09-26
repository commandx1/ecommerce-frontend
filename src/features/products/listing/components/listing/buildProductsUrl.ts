interface BuildUrlBase {
  currentPage: number
  pageSize: number
  sort: string
  brands: string[]
  manufacturers: string[]
  categories: string[]
  vendors: string[]
  minPrice: number | null
  maxPrice: number | null
  minRating: number | null
  inStock: boolean
  attributes: string[]
  companyId: string | null
  search: string | null
}

interface BuildUrlOverrides {
  page?: number
  size?: number
  /** Pass `null` to explicitly drop the free-text search term; omit to keep the base value. */
  search?: string | null
}

export const createProductsUrlBuilder = (base: BuildUrlBase) => {
  return (overrides: BuildUrlOverrides = {}) => {
    const { page, size } = overrides
    const params = new URLSearchParams()
    params.set("page", String(page ?? base.currentPage))
    params.set("size", String(size ?? base.pageSize))
    if (base.sort && base.sort !== "best-match") params.set("sort", base.sort)

    const search = "search" in overrides ? overrides.search : base.search
    if (search) params.set("q", search)

    for (const brand of base.brands) params.append("brands", brand)
    for (const manufacturer of base.manufacturers) params.append("manufacturers", manufacturer)
    for (const category of base.categories) params.append("categories", category)
    for (const vendor of base.vendors) params.append("vendors", vendor)
    if (base.minPrice != null) params.set("minPrice", String(base.minPrice))
    if (base.maxPrice != null) params.set("maxPrice", String(base.maxPrice))
    if (base.minRating != null) params.set("minRating", String(base.minRating))
    if (!base.inStock) params.set("inStock", "false")
    for (const attr of base.attributes) params.append("attributes", attr)
    if (base.companyId) params.set("companyId", base.companyId)

    return `/products?${params.toString()}`
  }
}
