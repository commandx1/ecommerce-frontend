// Use Next.js API routes as proxy to avoid CORS issues
import { apiRequest } from "./request"

const BASE_URL = "" // Use Next.js API routes at /api/...
const IMAGE_PROXY_URL = "/api/images" // Proxy path for images

// Helper function to get full image URL
export function getFullImageUrl(path: string | null | undefined): string {
  if (!path || typeof path !== "string" || path.trim() === "") return ""

  const trimmedPath = path.trim()

  let fullUrl: string
  if (trimmedPath.startsWith("http://") || trimmedPath.startsWith("https://")) {
    fullUrl = trimmedPath
  } else {
    // Use the image proxy to avoid Mixed Content (HTTPS -> HTTP) issues
    const cleanPath = trimmedPath.startsWith("/") ? trimmedPath : `/${trimmedPath}`
    fullUrl = `${IMAGE_PROXY_URL}${cleanPath}`
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
  title?: string
  category?: string
  manufacturer?: string
  brand?: string
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
   * Filter user products
   * GET /api/user-products/filter?type=TOTAL&price=true&stock=false&page=0&size=10
   */
  async filterUserProducts(
    token: string,
    type: "ACTIVE" | "INACTIVE" | "OUT_OF_STOCK" | "LOW_STOCK" | "TOTAL",
    page: number = 0,
    size: number = 10,
    price?: boolean,
    stock?: boolean,
    search?: string,
  ): Promise<{ content: UserProduct[]; totalElements: number; totalPages: number; page: number; size: number }> {
    const response = await apiRequest.requestResponse<
      | UserProduct[]
      | { content: UserProduct[]; totalElements: number; totalPages: number; page: number; size: number }
      | { message?: string; error?: string }
    >({
      client: "app",
      method: "GET",
      url: `${BASE_URL}/api/user-products/filter`,
      headers: this.getAuthHeaders(token),
      withCredentials: true,
      params: {
        type,
        page,
        size,
        ...(price !== undefined ? { price } : {}),
        ...(stock !== undefined ? { stock } : {}),
        ...(search !== undefined ? { search: search || "" } : {}),
      },
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

    if (
      data &&
      typeof data === "object" &&
      "content" in data &&
      Array.isArray(data.content) &&
      "totalElements" in data &&
      typeof data.totalElements === "number" &&
      "totalPages" in data &&
      typeof data.totalPages === "number" &&
      "page" in data &&
      typeof data.page === "number" &&
      "size" in data &&
      typeof data.size === "number"
    ) {
      return {
        content: data.content as UserProduct[],
        totalElements: data.totalElements,
        totalPages: data.totalPages,
        page: data.page,
        size: data.size,
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
    payload: { price: number; discount: number; stock: number; active: boolean },
    token: string,
  ): Promise<UserProduct> {
    return apiRequest.requestJson<UserProduct, { price: number; discount: number; stock: number; active: boolean }>({
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
