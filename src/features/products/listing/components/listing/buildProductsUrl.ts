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
}

interface BuildUrlOverrides {
  page?: number
  size?: number
}

export const createProductsUrlBuilder = (base: BuildUrlBase) => {
  return ({ page, size }: BuildUrlOverrides = {}) => {
    const params = new URLSearchParams()
    params.set("page", String(page ?? base.currentPage))
    params.set("size", String(size ?? base.pageSize))
    if (base.sort && base.sort !== "best-match") params.set("sort", base.sort)

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
