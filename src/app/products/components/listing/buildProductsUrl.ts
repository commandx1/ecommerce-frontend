interface BuildUrlBase {
  currentPage: number
  pageSize: number
  viewType: "grid" | "list"
}

interface BuildUrlOverrides {
  page?: number
  size?: number
  view?: "grid" | "list"
}

export const createProductsUrlBuilder = ({ currentPage, pageSize, viewType }: BuildUrlBase) => {
  return ({ page, size, view }: BuildUrlOverrides = {}) => {
    const params = new URLSearchParams()
    params.set("page", String(page ?? currentPage))
    params.set("size", String(size ?? pageSize))
    params.set("view", view ?? viewType)
    return `/products?${params.toString()}`
  }
}
