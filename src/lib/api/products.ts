// Use Next.js API routes as proxy to avoid CORS issues
import { apiRequest } from "./request"

const BASE_URL = "" // Use Next.js API routes at /api/...
const IMAGE_PROXY_URL = "/api/images" // Proxy path for images

function normalizeBackendImagePath(path: string): string {
  const cleanPath = path.startsWith("/") ? path : `/${path}`

  // Backend static files are served under `/uploads/...`.
  // Some payloads may still contain `/api/uploads/...`; normalize both to `/uploads/...`.
  if (cleanPath.startsWith("/api/uploads/")) {
    return cleanPath.replace(/^\/api/, "")
  }

  return cleanPath
}

// Helper function to get full image URL
export function getFullImageUrl(path: string | null | undefined): string {
  if (!path || typeof path !== "string" || path.trim() === "") return ""

  const trimmedPath = path.trim()

  let fullUrl: string
  if (trimmedPath.startsWith("http://") || trimmedPath.startsWith("https://")) {
    fullUrl = trimmedPath
  } else {
    // Use the image proxy to avoid Mixed Content (HTTPS -> HTTP) issues
    const normalizedPath = normalizeBackendImagePath(trimmedPath)
    fullUrl = `${IMAGE_PROXY_URL}${normalizedPath}`
  }

  return fullUrl
}

// Product Types
export interface Product {
  id: string
  name: string
  detailedName: string
  aboutProduct: string
  subCategoriesId: string
  reviewCount: number
  vendorsCount: number
  overallStar: number
  barcode: number
  barcodeFormats: string
  active: boolean
  userId: string
  coverPhotoPath?: string
  photoPhats?: string[]
  createdDate: string
  // Product details fields (merged)
  description?: string
  manufacturerCode?: string
  brand?: string
  packaging?: string
  primaryMarket?: string
  scent?: string
  size?: string
  type?: string
  sds?: string
  // Legacy fields
  photoPaths?: string
  productDetailsId?: string | null
  customerReviews?: string
  // Vendor review flow fields (also present on ProductResponseDto)
  manufacturer?: string
  exampleVariationsProductId?: string
  categoryLevel1?: string
  categoryLevel2?: string
  categoryLevel3?: string
  categoryLevel4?: string
  categoryLevel5?: string
  manufacturerSiteProductPage?: string
  dentalLicenseRequired?: string
  reorderId?: string
  referanceNumber?: string
  height?: number
  length?: number
  width?: number
  distanceUnit?: string
  weight?: number
  massUnit?: string
  attributes?: ProductAttribute[]
}

// Data payload for multipart/form-data (JSON string in 'data' field)
export interface CreateProductData {
  name: string
  detailedName: string
  aboutProduct: string
  subCategoriesId: string
  customerReviews?: string
  barcode: number
  barcodeFormats: string
  active: boolean
  secureCode?: string
  description: string
  manufacturerCode: string
  brand: string
  packaging: string
  primaryMarket: string
  distanceUnit: string
  massUnit: string
  scent: string
  size: string
  type: string
  sds: string
}

export interface CreateProductPayload {
  data: CreateProductData
  coverPhoto?: File
  photos?: File[]
}

// Attribute pair for the vendor review flow (ProductAttributeDto)
export interface ProductAttribute {
  attributeName: string
  attributeValue: string
}

// Data payload for POST /api/products/review (JSON string in 'data' field)
// Mirrors backend ProductVendorRequestDto
export interface ProductVendorRequestData {
  name?: string
  detailedName?: string
  coverPhotoPath?: string
  photoPhats?: string[]
  barcode?: number
  barcodeFormats?: string
  description?: string
  manufacturerCode?: string
  manufacturer?: string
  brand?: string
  exampleVariationsProductId?: string
  categoryLevel1?: string
  categoryLevel2?: string
  categoryLevel3?: string
  categoryLevel4?: string
  categoryLevel5?: string
  manufacturerSiteProductPage?: string
  dentalLicenseRequired?: string
  reorderId?: string
  referanceNumber?: string
  height?: number
  length?: number
  width?: number
  weight?: number
  attributes?: ProductAttribute[]
  // UserProduct (vendor listing) fields
  skuCode?: string
  price?: number
  stock?: number
  active?: boolean
  shipmentFee?: number
  heavyShippingSurcharge?: number
  exportPackaging?: boolean
  fulfillmentPolicy?: string
}

export interface CreateProductForReviewPayload {
  data: ProductVendorRequestData
  coverPhoto?: File
  photos?: File[]
}

export interface UpdateProductPayload {
  productId?: string
  name: string
  detailedName: string
  aboutProduct: string
  subCategoriesId: string
  customerReviews?: string
  barcode: number
  barcodeFormats: string
  active: boolean
}

// Product Details Types (for backward compatibility)
export interface ProductDetails {
  id: string
  productId: string
  description: string
  manufacturerCode: string
  brand: string
  packaging: string
  primaryMarket: string
  scent: string
  size: string
  type: string
  sds: string
  createdDate?: string
}

export interface CreateProductDetailsPayload {
  productId: string
  description: string
  manufacturerCode: string
  brand: string
  packaging: string
  primaryMarket: string
  scent: string
  size: string
  type: string
  sds: string
}

export interface UpdateProductDetailsPayload {
  productId: string
  description?: string
  manufacturerCode?: string
  brand?: string
  packaging?: string
  primaryMarket?: string
  scent?: string
  size?: string
  type?: string
  sds?: string
}

// Barcode Lookup Types
export interface BarcodeLookupProduct {
  barcode_number: string
  barcode_formats?: string
  mpn?: string
  model?: string
  asin?: string
  title?: string
  category?: string
  manufacturer?: string
  brand?: string
  contributors?: string[]
  age_group?: string
  ingredients?: string
  nutrition_facts?: string
  energy_efficiency_class?: string
  color?: string
  gender?: string
  material?: string
  pattern?: string
  format?: string
  multipack?: string
  size?: string
  length?: string
  width?: string
  height?: string
  weight?: string
  release_date?: string
  description?: string
  features?: string[]
  images?: string[]
  last_update?: string
  stores?: unknown[]
  reviews?: unknown[]
}

export interface BarcodeProduct {
  id: number
  barcodeNumber: string
  barcodeFormats?: string
  mpn?: string
  title?: string
  category?: string
  manufacturer?: string
  brand?: string
  images?: string[]
  lastUpdate?: string
}

export interface ProductSearchResponse {
  products: Product[]
  barcodeProducts: BarcodeLookupProduct[]
}

// Generic Spring Page<T> wrapper
export interface PageResponse<T> {
  content: T[]
  totalElements: number
  totalPages: number
  number: number
  size: number
  numberOfElements: number
  first: boolean
  last: boolean
  empty: boolean
}

// Item shape returned by GET /api/products/active (search autocomplete row, not full product details)
export interface ActiveProductSearchItem {
  id: string
  name: string
  coverPhotoPath: string | null
  brand: string | null
  manufacturer: string | null
  manufacturerCode: string | null
}

// Normalized product for autocomplete
export interface NormalizedSearchProduct {
  id: string
  barcode: string
  title: string
  brand?: string
  category?: string
  images: string[]
  source: "local" | "barcode_lookup"
  originalData: Product | BarcodeLookupProduct | BarcodeProduct
}

// User Product Types
export interface CreateUserProductPayload {
  productId: string
  price: number
  discount: number
  stock: number
  active: boolean
}

export interface UserProduct {
  id: string
  userId: string
  productId: string
  coverPhotoPath: string
  photoPhats: string[]
  subCategoriesId: string
  productName: string
  price: number
  discount: number
  stock: number
  active: boolean
  periodicSellCount?: number
  periodicGrossRevenue?: number
  skuCode?: string
  shipmentFee?: number
  heavyShippingSurcharge?: number
  // Populated client-side by merging in GET /api/products/my-products (not part of the filter response)
  reviewStatus?: ProductReviewStatus
}

// Mirrors backend UserProductResponse (GET /api/user-products/:id)
export interface UserProductDetailResponse {
  id: string
  userId: string
  productId: string
  productName: string
  price: number
  oldPrice: number
  discount: number
  stock: number
  active: boolean
  coverPhotoPath: string
  skuCode: string
  sellCount: number
  periodicSellCount?: number
  periodicGrossRevenue?: number
  height: number
  length: number
  width: number
  distanceUnit: string
  weight: number
  massUnit: string
  shipmentFee: number
  heavyShippingSurcharge?: number
}

// Mirrors backend ProductReviewStatusDto
// approved === null means the product is still pending review
export interface ProductReviewStatus {
  id: string
  approved: boolean | null
  rejectedReason?: string | null
  lastReviewedByAdminId?: string | null
  updatedDate: string
}

// Mirrors backend VendorProductReviewResponseDto (GET /api/products/my-products)
export interface VendorProductReviewItem {
  product: Product
  reviewStatus?: ProductReviewStatus
  userProduct?: UserProductDetailResponse
}

export interface MyProductsPageResponse {
  content: VendorProductReviewItem[]
  totalElements: number
  totalPages: number
}

export type UserProductSortBy =
  | "PRICE"
  | "STOCK"
  | "OLD_PRICE"
  | "DISCOUNT"
  | "SELL_COUNT"
  | "PERIODIC_SELL_COUNT"
  | "PERIODIC_GROSS_REVENUE"

export interface UserProductsFilterResponse {
  content: UserProduct[]
  totalElements: number
  totalPages: number
  page: number
  size: number
}

class ProductsAPI {
  private getAuthHeaders(token?: string): Record<string, string> {
    if (!token) {
      return {}
    }

    return { Authorization: `Bearer ${token}` }
  }

  // ==================== Product CRUD ====================

  /**
   * Create a new product with multipart/form-data
   * POST /api/products
   * Content-Type: multipart/form-data
   * Fields: data (JSON string), coverPhoto (file), photos (file[])
   */
  async createProduct(payload: CreateProductPayload, token: string): Promise<Product> {
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
      url: `${BASE_URL}/api/products`,
      withCredentials: true,
      data: formData,
      fallbackMessage: "Failed to create product",
    })
  }

  /**
   * Create a new product and submit it for review (vendor flow)
   * POST /api/products/review
   * Content-Type: multipart/form-data
   * Fields: data (JSON string of ProductVendorRequestData), coverPhoto (file), photos (file[])
   */
  async createProductForReview(payload: CreateProductForReviewPayload, token: string): Promise<Product> {
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
  async updateProductForReview(id: string, payload: CreateProductForReviewPayload, token: string): Promise<Product> {
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
  async getMyProducts(
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
      headers: this.getAuthHeaders(token),
      withCredentials: true,
      params: {
        approved: params.approved ?? "ALL",
        sortBy: params.sortBy ?? "createdDate",
        sortDir: params.sortDir ?? "desc",
        page: params.page ?? 0,
        size: params.size ?? 1000,
      },
      signal,
      fallbackMessage: "Failed to fetch review status for products",
    })
  }

  /**
   * Get product by ID
   * GET /api/products/:id
   */
  async getProductById(id: string, token?: string): Promise<Product> {
    return apiRequest.requestJson<Product>({
      client: "app",
      method: "GET",
      url: `${BASE_URL}/api/products/${id}`,
      headers: this.getAuthHeaders(token),
      withCredentials: true,
      fallbackMessage: "Failed to fetch product",
    })
  }

  /**
   * Get product by ID regardless of active status (owner or admin only).
   * Needed for rejected/pending products, which are not active yet.
   * GET /api/products/:id/owner
   */
  async getProductByIdForOwner(id: string, token?: string): Promise<Product> {
    return apiRequest.requestJson<Product>({
      client: "app",
      method: "GET",
      url: `${BASE_URL}/api/products/${id}/owner`,
      headers: this.getAuthHeaders(token),
      withCredentials: true,
      fallbackMessage: "Failed to fetch product",
    })
  }

  /**
   * Update product by ID
   * PUT /api/products/:id
   */
  async updateProduct(id: string, payload: UpdateProductPayload, token: string): Promise<Product> {
    return apiRequest.requestJson<Product, UpdateProductPayload>({
      client: "app",
      method: "PUT",
      headers: this.getAuthHeaders(token),
      url: `${BASE_URL}/api/products/${id}`,
      data: payload,
      fallbackMessage: "Failed to update product",
    })
  }

  /**
   * Delete product by ID
   * DELETE /api/products/:id
   */
  async deleteProduct(id: string, token: string): Promise<void> {
    await apiRequest.requestJson<void>({
      client: "app",
      method: "DELETE",
      headers: this.getAuthHeaders(token),
      url: `${BASE_URL}/api/products/${id}`,
      fallbackMessage: "Failed to delete product",
    })
  }

  // ==================== Product Details CRUD ====================

  /**
   * Create product details
   * POST /api/products/details
   */
  async createProductDetails(payload: CreateProductDetailsPayload, token: string): Promise<ProductDetails> {
    return apiRequest.requestJson<ProductDetails, CreateProductDetailsPayload>({
      client: "app",
      method: "POST",
      url: `${BASE_URL}/api/products/details`,
      headers: this.getAuthHeaders(token),
      withCredentials: true,
      data: payload,
      fallbackMessage: "Failed to create product details",
    })
  }

  /**
   * Get product details by ID
   * GET /api/products/details/:id
   */
  async getProductDetailsById(id: string): Promise<ProductDetails> {
    return apiRequest.requestJson<ProductDetails>({
      client: "app",
      method: "GET",
      headers: this.getAuthHeaders(),
      url: `${BASE_URL}/api/products/details/${id}`,
      fallbackMessage: "Failed to fetch product details",
    })
  }

  /**
   * Get product details by product ID
   * GET /api/products/details/by-product/:productId
   */
  async getProductDetailsByProductId(productId: string): Promise<ProductDetails> {
    return apiRequest.requestJson<ProductDetails>({
      client: "app",
      method: "GET",
      headers: this.getAuthHeaders(),
      url: `${BASE_URL}/api/products/details/by-product/${productId}`,
      fallbackMessage: "Failed to fetch product details",
    })
  }

  /**
   * Update product details by ID
   * PUT /api/products/details/:id
   */
  async updateProductDetails(id: string, payload: UpdateProductDetailsPayload, token: string): Promise<ProductDetails> {
    return apiRequest.requestJson<ProductDetails, UpdateProductDetailsPayload>({
      client: "app",
      method: "PUT",
      headers: this.getAuthHeaders(token),
      url: `${BASE_URL}/api/products/details/${id}`,
      data: payload,
      fallbackMessage: "Failed to update product details",
    })
  }

  /**
   * Update product details by product ID
   * PUT /api/products/details/by-product/:productId
   */
  async updateProductDetailsByProductId(
    productId: string,
    payload: UpdateProductDetailsPayload,
    token: string,
  ): Promise<ProductDetails> {
    return apiRequest.requestJson<ProductDetails, UpdateProductDetailsPayload>({
      client: "app",
      method: "PUT",
      headers: this.getAuthHeaders(token),
      url: `${BASE_URL}/api/products/details/by-product/${productId}`,
      data: payload,
      fallbackMessage: "Failed to update product details",
    })
  }

  /**
   * Delete product details by ID
   * DELETE /api/products/details/:id
   */
  async deleteProductDetails(id: string, token: string): Promise<void> {
    await apiRequest.requestJson<void>({
      client: "app",
      method: "DELETE",
      headers: this.getAuthHeaders(token),
      url: `${BASE_URL}/api/products/details/${id}`,
      fallbackMessage: "Failed to delete product details",
    })
  }

  /**
   * Delete product details by product ID
   * DELETE /api/products/details/by-product/:productId
   */
  async deleteProductDetailsByProductId(productId: string, token: string): Promise<void> {
    await apiRequest.requestJson<void>({
      client: "app",
      method: "DELETE",
      headers: this.getAuthHeaders(token),
      url: `${BASE_URL}/api/products/details/by-product/${productId}`,
      fallbackMessage: "Failed to delete product details",
    })
  }

  // ==================== Product Search (active products + brand filter) ====================

  /**
   * Search brand names for the brand filter dropdown (paginated, typeahead)
   * GET /api/products/brands/search?search=...&page=...&size=...
   */
  async searchBrands(
    params: { search: string; page?: number; size?: number },
    token: string,
    signal?: AbortSignal,
  ): Promise<PageResponse<string>> {
    return apiRequest.requestJson<PageResponse<string>>({
      client: "app",
      method: "GET",
      headers: this.getAuthHeaders(token),
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
  async searchActiveProducts(
    params: { search: string; brand?: string | null; page?: number; size?: number },
    token: string,
    signal?: AbortSignal,
  ): Promise<PageResponse<ActiveProductSearchItem>> {
    return apiRequest.requestJson<PageResponse<ActiveProductSearchItem>>({
      client: "app",
      method: "GET",
      headers: this.getAuthHeaders(token),
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
  normalizeActiveProductSearchItem(item: ActiveProductSearchItem): NormalizedSearchProduct {
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

  // ==================== Barcode Lookup ====================

  /**
   * Search products by title
   * GET /api/barcode/products/search?title=...
   */
  async searchProductsByTitle(title: string, token: string): Promise<ProductSearchResponse> {
    return apiRequest.requestJson<ProductSearchResponse>({
      client: "app",
      method: "GET",
      headers: this.getAuthHeaders(token),
      url: `${BASE_URL}/api/barcode/products/search`,
      params: { title },
      fallbackMessage: "Failed to search products",
    })
  }

  /**
   * Get product by barcode
   * GET /api/barcode/products/bybarcode/:barcode
   */
  async getProductByBarcode(barcode: string, token: string): Promise<Product | BarcodeLookupProduct> {
    const response = await apiRequest.requestResponse<Product | BarcodeLookupProduct | string>({
      client: "app",
      method: "GET",
      headers: this.getAuthHeaders(token),
      url: `${BASE_URL}/api/barcode/products/bybarcode/${encodeURIComponent(barcode)}`,
      validateStatus: () => true,
      fallbackMessage: "Failed to fetch product by barcode",
    })

    if (response.status < 200 || response.status >= 300) {
      const contentType = response.headers["content-type"]
      const hasJson = typeof contentType === "string" && contentType.includes("application/json")

      if (hasJson) {
        throw response.data
      } else {
        throw new Error(`Product not found (${response.status})`)
      }
    }

    return response.data as Product | BarcodeLookupProduct
  }

  /**
   * Get all products from saved barcode lookup
   * GET /api/barcode/products
   */
  async getAllBarcodeProducts(token: string): Promise<BarcodeProduct[]> {
    return apiRequest.requestJson<BarcodeProduct[]>({
      client: "app",
      method: "GET",
      headers: this.getAuthHeaders(token),
      url: `${BASE_URL}/api/barcode/products`,
      fallbackMessage: "Failed to fetch barcode products",
    })
  }

  /**
   * Normalize search results for autocomplete
   */
  normalizeSearchResults(response: ProductSearchResponse): NormalizedSearchProduct[] {
    const normalized: NormalizedSearchProduct[] = []

    // Normalize local products
    for (const product of response.products) {
      // Build images array from coverPhotoPath and photoPhats
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

      normalized.push({
        id: product.id,
        barcode: String(product.barcode || ""),
        title: product.name || product.detailedName || "",
        brand: product.brand,
        category: undefined,
        images,
        source: "local",
        originalData: product,
      })
    }

    // Normalize barcode lookup products
    for (const product of response.barcodeProducts) {
      normalized.push({
        id: product.barcode_number,
        barcode: product.barcode_number,
        title: product.title || "",
        brand: product.brand,
        category: product.category,
        images: product.images || [],
        source: "barcode_lookup",
        originalData: product,
      })
    }

    return normalized
  }

  // ==================== User Products ====================

  /**
   * Create a user product
   * POST /api/user-products
   */
  async createUserProduct(payload: CreateUserProductPayload, token: string): Promise<UserProduct> {
    return apiRequest.requestJson<UserProduct, CreateUserProductPayload>({
      client: "app",
      method: "POST",
      url: `${BASE_URL}/api/user-products`,
      headers: this.getAuthHeaders(token),
      withCredentials: true,
      data: payload,
      fallbackMessage: "Failed to create user product",
    })
  }

  /**
   * Get all user products
   * GET /api/user-products
   */
  async getUserProducts(token: string): Promise<UserProduct[]> {
    return apiRequest.requestJson<UserProduct[]>({
      client: "app",
      method: "GET",
      url: `${BASE_URL}/api/user-products`,
      headers: this.getAuthHeaders(token),
      withCredentials: true,
      fallbackMessage: "Failed to fetch user products",
    })
  }

  /**
   * Get user product by ID
   * GET /api/user-products/:id
   */
  async getUserProductById(id: string, token: string): Promise<UserProductDetailResponse> {
    return apiRequest.requestJson<UserProductDetailResponse>({
      client: "app",
      method: "GET",
      url: `${BASE_URL}/api/user-products/${id}`,
      headers: this.getAuthHeaders(token),
      withCredentials: true,
      fallbackMessage: "Failed to fetch user product",
    })
  }

  /**
   * Filter user products
   * GET /api/user-products/filter?type=TOTAL&price=true&stock=false&page=0&size=10
   */
  async filterUserProducts(
    token: string,
    type: "ACTIVE" | "INACTIVE" | "OUT_OF_STOCK" | "LOW_STOCK" | "TOTAL",
    page: number = 0,
    size: number = 10,
    sortBy?: UserProductSortBy,
    sortDir?: "asc" | "desc",
    search?: string,
    howManySoldDay?: number,
    userProductId?: string,
    signal?: AbortSignal,
  ): Promise<UserProductsFilterResponse> {
    const response = await apiRequest.requestResponse<unknown>({
      client: "app",
      method: "GET",
      url: `${BASE_URL}/api/user-products/filter`,
      headers: this.getAuthHeaders(token),
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

    // Handle both array and pagination object responses
    if (Array.isArray(data)) {
      // If response is array, create pagination object
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

  /**
   * Update a user product
   * PUT /api/user-products/:id
   */
  async updateUserProduct(
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
      url: `${BASE_URL}/api/user-products/${id}`,
      headers: this.getAuthHeaders(token),
      withCredentials: true,
      data: payload,
      fallbackMessage: "Failed to update user product",
    })
  }

  /**
   * Delete a user product
   * DELETE /api/user-products/:id
   */
  async deleteUserProduct(id: string, token: string): Promise<void> {
    await apiRequest.requestJson<void>({
      client: "app",
      method: "DELETE",
      url: `${BASE_URL}/api/user-products/${id}`,
      headers: this.getAuthHeaders(token),
      withCredentials: true,
      fallbackMessage: "Failed to delete user product",
    })
  }

  /**
   * Normalize a single barcode product result
   */
  normalizeBarcodeResult(product: Product | BarcodeLookupProduct | BarcodeProduct): NormalizedSearchProduct {
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
}

export const productsAPI = new ProductsAPI()
