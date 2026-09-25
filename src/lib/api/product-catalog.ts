import { getFullImageUrl } from "./product-image-url"
import type {
  ActiveProductSearchItem,
  BarcodeLookupProduct,
  BarcodeProduct,
  CreateProductForReviewPayload,
  MyProductsPageResponse,
  NormalizedSearchProduct,
  PageResponse,
  Product,
} from "./product-types"
import { apiRequest } from "./request"

const BASE_URL = "" // Use Next.js API routes at /api/...

function getAuthHeaders(token?: string): Record<string, string> {
  if (!token) {
    return {}
  }

  return { Authorization: `Bearer ${token}` }
}

// ==================== Product CRUD ====================

/**
 * Create a new product and submit it for review (vendor flow)
 * POST /api/products/review
 * Content-Type: multipart/form-data
 * Fields: data (JSON string of ProductVendorRequestData), coverPhoto (file), photos (file[])
 */
export async function createProductForReview(payload: CreateProductForReviewPayload, token: string): Promise<Product> {
  const formData = new FormData()

  // Add JSON data as string
  formData.append("data", JSON.stringify(payload.data))

  // Add cover photo if provided
  if (payload.coverPhoto) {
    formData.append("coverPhoto", payload.coverPhoto)
  }

  // Add additional photos if provided
  if (payload.photos && payload.photos.length > 0) {
    for (const photo of payload.photos) {
      formData.append("photos", photo)
    }
  }

  return apiRequest.requestJson<Product>({
    client: "app",
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    url: `${BASE_URL}/api/products/review`,
    withCredentials: true,
    data: formData,
    fallbackMessage: "Failed to submit product for review",
  })
}

/**
 * Update a rejected product and resubmit it for review (vendor flow)
 * PUT /api/products/review/:id
 * Content-Type: multipart/form-data
 * Fields: data (JSON string of ProductVendorRequestData), coverPhoto (file), photos (file[])
 * Backend only allows this when the product's review status is REJECTED.
 */
export async function updateProductForReview(
  id: string,
  payload: CreateProductForReviewPayload,
  token: string,
): Promise<Product> {
  const formData = new FormData()

  formData.append("data", JSON.stringify(payload.data))

  if (payload.coverPhoto) {
    formData.append("coverPhoto", payload.coverPhoto)
  }

  if (payload.photos && payload.photos.length > 0) {
    for (const photo of payload.photos) {
      formData.append("photos", photo)
    }
  }

  return apiRequest.requestJson<Product>({
    client: "app",
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    url: `${BASE_URL}/api/products/review/${id}`,
    withCredentials: true,
    data: formData,
    fallbackMessage: "Failed to update product for review",
  })
}

/**
 * Get the vendor's own products together with their review status
 * GET /api/products/my-products
 */
export async function getMyProducts(
  token: string,
  params: {
    approved?: "TRUE" | "FALSE" | "NULL" | "ALL"
    sortBy?: "createdDate" | "updatedDate"
    sortDir?: "asc" | "desc"
    page?: number
    size?: number
  } = {},
  signal?: AbortSignal,
): Promise<MyProductsPageResponse> {
  return apiRequest.requestJson<MyProductsPageResponse>({
    client: "app",
    method: "GET",
    url: `${BASE_URL}/api/products/my-products`,
    headers: getAuthHeaders(token),
    withCredentials: true,
    params: {
      approved: params.approved ?? "ALL",
      sortBy: params.sortBy ?? "createdDate",
      sortDir: params.sortDir ?? "desc",
      page: params.page ?? 0,
      // Backend caps this: ProductController.validatePageSize(size, MAX_PAGE_SIZE = 100) rejects
      // anything larger with a 400. A default of 1000 could never have been served.
      size: params.size ?? 100,
    },
    signal,
    fallbackMessage: "Failed to fetch review status for products",
  })
}

/**
 * Get product by ID
 * GET /api/products/:id
 */
export async function getProductById(id: string, token?: string): Promise<Product> {
  return apiRequest.requestJson<Product>({
    client: "app",
    method: "GET",
    url: `${BASE_URL}/api/products/${id}`,
    headers: getAuthHeaders(token),
    withCredentials: true,
    fallbackMessage: "Failed to fetch product",
  })
}

/**
 * Get product by ID regardless of active status (owner or admin only).
 * Needed for rejected/pending products, which are not active yet.
 * GET /api/products/:id/owner
 */
export async function getProductByIdForOwner(id: string, token?: string): Promise<Product> {
  return apiRequest.requestJson<Product>({
    client: "app",
    method: "GET",
    url: `${BASE_URL}/api/products/${id}/owner`,
    headers: getAuthHeaders(token),
    withCredentials: true,
    fallbackMessage: "Failed to fetch product",
  })
}

// ==================== Product Search (active products + brand filter) ====================

/**
 * Search brand names for the brand filter dropdown (paginated, typeahead)
 * GET /api/products/brands/search?search=...&page=...&size=...
 */
export async function searchBrands(
  params: { search: string; page?: number; size?: number },
  token: string,
  signal?: AbortSignal,
): Promise<PageResponse<string>> {
  return apiRequest.requestJson<PageResponse<string>>({
    client: "app",
    method: "GET",
    headers: getAuthHeaders(token),
    url: `${BASE_URL}/api/products/brands/search`,
    params: {
      search: params.search,
      page: params.page ?? 0,
      size: params.size ?? 20,
    },
    signal,
    fallbackMessage: "Failed to search brands",
  })
}

/**
 * Search active products by free-text (barcode, name, detailedName, manufacturerCode)
 * and optional brand filter. Paginated for infinite scroll.
 * GET /api/products/active?search=...&brand=...&page=...&size=...
 */
export async function searchActiveProducts(
  params: { search: string; brand?: string | null; page?: number; size?: number },
  token: string,
  signal?: AbortSignal,
): Promise<PageResponse<ActiveProductSearchItem>> {
  return apiRequest.requestJson<PageResponse<ActiveProductSearchItem>>({
    client: "app",
    method: "GET",
    headers: getAuthHeaders(token),
    url: `${BASE_URL}/api/products/active`,
    params: {
      search: params.search,
      page: params.page ?? 0,
      size: params.size ?? 10,
      ...(params.brand ? { brand: params.brand } : {}),
    },
    signal,
    fallbackMessage: "Failed to search products",
  })
}

/**
 * Normalize a GET /api/products/active row for the search dropdown.
 * Note: this row is a partial projection (no barcode/detailedName) -
 * fetch the full product via getProductById once a row is selected.
 */
export function normalizeActiveProductSearchItem(item: ActiveProductSearchItem): NormalizedSearchProduct {
  return {
    id: item.id,
    barcode: "",
    title: item.name || "",
    brand: item.brand || undefined,
    category: undefined,
    images: item.coverPhotoPath ? [getFullImageUrl(item.coverPhotoPath)] : [],
    source: "local",
    originalData: {
      id: item.id,
      name: item.name,
      coverPhotoPath: item.coverPhotoPath ?? undefined,
      brand: item.brand ?? undefined,
      manufacturer: item.manufacturer ?? undefined,
      manufacturerCode: item.manufacturerCode ?? undefined,
    } as Product,
  }
}

/**
 * Normalize a single barcode product result
 */
export function normalizeBarcodeResult(
  product: Product | BarcodeLookupProduct | BarcodeProduct,
): NormalizedSearchProduct {
  // Check if it's a BarcodeLookupProduct (has barcode_number)
  if ("barcode_number" in product) {
    return {
      id: product.barcode_number,
      barcode: product.barcode_number,
      title: product.title || "",
      brand: product.brand,
      category: product.category,
      images: product.images || [],
      source: "barcode_lookup",
      originalData: product,
    }
  }

  // Check if it's a BarcodeProduct (has barcodeNumber)
  if ("barcodeNumber" in product) {
    return {
      id: String(product.id),
      barcode: product.barcodeNumber,
      title: product.title || "",
      brand: product.brand,
      category: product.category,
      images: product.images || [],
      source: "barcode_lookup",
      originalData: product,
    }
  }

  // It's a local Product
  const images: string[] = []
  if (product.coverPhotoPath) {
    images.push(getFullImageUrl(product.coverPhotoPath))
  }
  if (product.photoPhats && product.photoPhats.length > 0) {
    images.push(...product.photoPhats.map(getFullImageUrl))
  }
  // Fallback to legacy photoPaths if available
  if (images.length === 0 && product.photoPaths) {
    images.push(...product.photoPaths.split(",").filter(Boolean).map(getFullImageUrl))
  }

  return {
    id: product.id,
    barcode: String(product.barcode || ""),
    title: product.name || product.detailedName || "",
    brand: product.brand,
    category: undefined,
    images,
    source: "local",
    originalData: product,
  }
}
