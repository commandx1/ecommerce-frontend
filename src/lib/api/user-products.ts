import type {
  CreateUserProductPayload,
  UserProduct,
  UserProductDetailResponse,
  UserProductSortBy,
  UserProductsFilterResponse,
} from "./product-types"
import { apiRequest, bearerAuthHeaders } from "./request"

export async function createUserProduct(payload: CreateUserProductPayload, token: string): Promise<UserProduct> {
  return apiRequest.requestJson<UserProduct, CreateUserProductPayload>({
    client: "app",
    method: "POST",
    url: "/api/user-products",
    headers: bearerAuthHeaders(token),
    withCredentials: true,
    data: payload,
    fallbackMessage: "Failed to create user product",
  })
}

export async function getUserProducts(token: string): Promise<UserProduct[]> {
  return apiRequest.requestJson<UserProduct[]>({
    client: "app",
    method: "GET",
    url: "/api/user-products",
    headers: bearerAuthHeaders(token),
    withCredentials: true,
    fallbackMessage: "Failed to fetch user products",
  })
}

export async function getUserProductById(id: string, token: string): Promise<UserProductDetailResponse> {
  return apiRequest.requestJson<UserProductDetailResponse>({
    client: "app",
    method: "GET",
    url: `/api/user-products/${id}`,
    headers: bearerAuthHeaders(token),
    withCredentials: true,
    fallbackMessage: "Failed to fetch user product",
  })
}

/** Applies the same discount percentage to several of the vendor's products. */
export async function bulkDiscount(
  token: string,
  payload: { userProductIds: string[]; discount: number },
  signal?: AbortSignal,
): Promise<UserProduct[]> {
  return apiRequest.requestJson<UserProduct[]>({
    client: "app",
    method: "POST",
    url: "/api/user-products/bulk-discount",
    headers: bearerAuthHeaders(token),
    withCredentials: true,
    data: payload,
    signal,
    fallbackMessage: "Failed to apply bulk discount",
  })
}

/** Distinct brands of the authenticated vendor's own products. */
export async function getUserProductBrands(token: string, signal?: AbortSignal): Promise<string[]> {
  return apiRequest.requestJson<string[]>({
    client: "app",
    method: "GET",
    url: "/api/user-products/brands",
    headers: bearerAuthHeaders(token),
    withCredentials: true,
    signal,
    fallbackMessage: "Failed to fetch vendor brands",
  })
}

export async function filterUserProducts(
  token: string,
  type: "ACTIVE" | "INACTIVE" | "OUT_OF_STOCK" | "LOW_STOCK" | "TOTAL",
  page: number = 0,
  size: number = 10,
  sortBy?: UserProductSortBy,
  sortDir?: "asc" | "desc",
  search?: string,
  howManySoldDay?: number,
  userProductId?: string,
  brand?: string,
  signal?: AbortSignal,
): Promise<UserProductsFilterResponse> {
  const response = await apiRequest.requestResponse<unknown>({
    client: "app",
    method: "GET",
    url: "/api/user-products/filter",
    headers: bearerAuthHeaders(token),
    withCredentials: true,
    params: {
      type,
      page,
      size,
      ...(sortBy !== undefined ? { sortBy } : {}),
      ...(sortDir !== undefined ? { sortDir } : {}),
      ...(search !== undefined ? { search: search || "" } : {}),
      ...(howManySoldDay !== undefined ? { howManySoldDay } : {}),
      ...(userProductId !== undefined ? { userProductId } : {}),
      ...(brand ? { brand } : {}),
    },
    signal,
    validateStatus: () => true,
    fallbackMessage: "Failed to filter user products",
  })

  if (response.status < 200 || response.status >= 300) {
    let error: { message?: string; status: number } = {
      message: `Request failed with status ${response.status}`,
      status: response.status,
    }

    const errorData = response.data
    if (errorData && typeof errorData === "object") {
      error = { ...errorData, status: response.status }
    }

    throw error
  }

  const data = response.data
  const toNumber = (value: unknown): number | null => {
    if (typeof value === "number" && Number.isFinite(value)) {
      return value
    }

    if (typeof value === "string" && value.trim() !== "") {
      const parsed = Number(value)
      if (Number.isFinite(parsed)) {
        return parsed
      }
    }

    return null
  }

  const parseFromRecord = (record: Record<string, unknown>): UserProductsFilterResponse | null => {
    const pageable =
      record.pageable && typeof record.pageable === "object" && !Array.isArray(record.pageable)
        ? (record.pageable as Record<string, unknown>)
        : null

    const content =
      Array.isArray(record.content) && record.content
        ? record.content
        : Array.isArray(record.userProducts) && record.userProducts
          ? record.userProducts
          : Array.isArray(record.items) && record.items
            ? record.items
            : null

    if (!content) {
      return null
    }

    const totalElements = toNumber(record.totalElements) ?? toNumber(record.total) ?? content.length
    const resolvedSize = toNumber(record.size) ?? toNumber(record.pageSize) ?? toNumber(pageable?.pageSize) ?? size
    const totalPages = toNumber(record.totalPages) ?? Math.ceil(totalElements / Math.max(1, resolvedSize))
    const resolvedPage =
      toNumber(record.page) ??
      toNumber(record.number) ??
      toNumber(record.currentPage) ??
      toNumber(pageable?.pageNumber) ??
      page

    return {
      content: content as UserProduct[],
      totalElements,
      totalPages,
      page: resolvedPage,
      size: resolvedSize,
    }
  }

  if (Array.isArray(data)) {
    return {
      content: data,
      totalElements: data.length,
      totalPages: Math.ceil(data.length / size),
      page: page,
      size: size,
    }
  }

  if (data && typeof data === "object" && !Array.isArray(data)) {
    const directParsed = parseFromRecord(data as Record<string, unknown>)
    if (directParsed) {
      return directParsed
    }

    const nested = (data as Record<string, unknown>).data
    if (nested && typeof nested === "object" && !Array.isArray(nested)) {
      const nestedParsed = parseFromRecord(nested as Record<string, unknown>)
      if (nestedParsed) {
        return nestedParsed
      }
    }
  }

  throw new Error("Invalid user product filter response")
}

export async function updateUserProduct(
  id: string,
  payload: {
    price: number
    discount: number
    stock: number
    active: boolean
    skuCode?: string
    shipmentFee?: number
    heavyShippingSurcharge?: number
  },
  token: string,
): Promise<UserProduct> {
  return apiRequest.requestJson<
    UserProduct,
    {
      price: number
      discount: number
      stock: number
      active: boolean
      skuCode?: string
      shipmentFee?: number
      heavyShippingSurcharge?: number
    }
  >({
    client: "app",
    method: "PUT",
    url: `/api/user-products/${id}`,
    headers: bearerAuthHeaders(token),
    withCredentials: true,
    data: payload,
    fallbackMessage: "Failed to update user product",
  })
}

export async function deleteUserProduct(id: string, token: string): Promise<void> {
  await apiRequest.requestJson<void>({
    client: "app",
    method: "DELETE",
    url: `/api/user-products/${id}`,
    headers: bearerAuthHeaders(token),
    withCredentials: true,
    fallbackMessage: "Failed to delete user product",
  })
}
