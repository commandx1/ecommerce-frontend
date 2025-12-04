// Use Next.js API routes as proxy to avoid CORS issues

const BASE_URL = "" // Use Next.js API routes at /api/...
const BACKEND_URL = "http://51.20.96.242:8080" // Backend URL for image paths

// Helper function to get full image URL
export function getFullImageUrl(path: string): string {
  if (!path) return ""
  // If already a full URL, return as is
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path
  }
  // Otherwise prepend backend URL
  return `${BACKEND_URL}${path.startsWith("/") ? "" : "/"}${path}`
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
  productName: string
  price: number
  discount: number
  stock: number
  active: boolean
}

class ProductsAPI {
  private getAuthHeaders(token?: string) {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    }
    if (token) {
      headers.Authorization = `Bearer ${token}`
    }
    return headers
  }

  private getFetchOptions(token?: string): RequestInit {
    return {
      headers: this.getAuthHeaders(token),
      credentials: "include", // Include cookies for session-based auth
    }
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

    const response = await fetch(`${BASE_URL}/api/products`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        // Note: Don't set Content-Type for FormData, browser will set it with boundary
      },
      credentials: "include",
      body: formData,
    })

    if (!response.ok) {
      const error = await response.json()
      throw error
    }

    return response.json()
  }

  /**
   * Get product by ID
   * GET /api/products/:id
   */
  async getProductById(id: string, token?: string): Promise<Product> {
    const response = await fetch(`${BASE_URL}/api/products/${id}`, {
      method: "GET",
      ...this.getFetchOptions(token),
    })

    if (!response.ok) {
      const error = await response.json()
      throw error
    }

    return response.json()
  }

  /**
   * Update product by ID
   * PUT /api/products/:id
   */
  async updateProduct(id: string, payload: UpdateProductPayload, token: string): Promise<Product> {
    const response = await fetch(`${BASE_URL}/api/products/${id}`, {
      method: "PUT",
      headers: this.getAuthHeaders(token),
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const error = await response.json()
      throw error
    }

    return response.json()
  }

  /**
   * Delete product by ID
   * DELETE /api/products/:id
   */
  async deleteProduct(id: string, token: string): Promise<void> {
    const response = await fetch(`${BASE_URL}/api/products/${id}`, {
      method: "DELETE",
      headers: this.getAuthHeaders(token),
    })

    if (!response.ok) {
      const error = await response.json()
      throw error
    }
  }

  // ==================== Product Details CRUD ====================

  /**
   * Create product details
   * POST /api/products/details
   */
  async createProductDetails(payload: CreateProductDetailsPayload, token: string): Promise<ProductDetails> {
    const response = await fetch(`${BASE_URL}/api/products/details`, {
      method: "POST",
      ...this.getFetchOptions(token),
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const error = await response.json()
      throw error
    }

    return response.json()
  }

  /**
   * Get product details by ID
   * GET /api/products/details/:id
   */
  async getProductDetailsById(id: string): Promise<ProductDetails> {
    const response = await fetch(`${BASE_URL}/api/products/details/${id}`, {
      method: "GET",
      headers: this.getAuthHeaders(),
    })

    if (!response.ok) {
      const error = await response.json()
      throw error
    }

    return response.json()
  }

  /**
   * Get product details by product ID
   * GET /api/products/details/by-product/:productId
   */
  async getProductDetailsByProductId(productId: string): Promise<ProductDetails> {
    const response = await fetch(`${BASE_URL}/api/products/details/by-product/${productId}`, {
      method: "GET",
      headers: this.getAuthHeaders(),
    })

    if (!response.ok) {
      const error = await response.json()
      throw error
    }

    return response.json()
  }

  /**
   * Update product details by ID
   * PUT /api/products/details/:id
   */
  async updateProductDetails(id: string, payload: UpdateProductDetailsPayload, token: string): Promise<ProductDetails> {
    const response = await fetch(`${BASE_URL}/api/products/details/${id}`, {
      method: "PUT",
      headers: this.getAuthHeaders(token),
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const error = await response.json()
      throw error
    }

    return response.json()
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
    const response = await fetch(`${BASE_URL}/api/products/details/by-product/${productId}`, {
      method: "PUT",
      headers: this.getAuthHeaders(token),
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const error = await response.json()
      throw error
    }

    return response.json()
  }

  /**
   * Delete product details by ID
   * DELETE /api/products/details/:id
   */
  async deleteProductDetails(id: string, token: string): Promise<void> {
    const response = await fetch(`${BASE_URL}/api/products/details/${id}`, {
      method: "DELETE",
      headers: this.getAuthHeaders(token),
    })

    if (!response.ok) {
      const error = await response.json()
      throw error
    }
  }

  /**
   * Delete product details by product ID
   * DELETE /api/products/details/by-product/:productId
   */
  async deleteProductDetailsByProductId(productId: string, token: string): Promise<void> {
    const response = await fetch(`${BASE_URL}/api/products/details/by-product/${productId}`, {
      method: "DELETE",
      headers: this.getAuthHeaders(token),
    })

    if (!response.ok) {
      const error = await response.json()
      throw error
    }
  }

  // ==================== Barcode Lookup ====================

  /**
   * Search products by title
   * GET /api/barcode/products/search?title=...
   */
  async searchProductsByTitle(title: string, token: string): Promise<ProductSearchResponse> {
    const response = await fetch(`${BASE_URL}/api/barcode/products/search?title=${encodeURIComponent(title)}`, {
      method: "GET",
      headers: this.getAuthHeaders(token),
    })

    if (!response.ok) {
      const error = await response.json()
      throw error
    }

    return response.json()
  }

  /**
   * Get product by barcode
   * GET /api/barcode/products/ByBarcode/:barcode
   */
  async getProductByBarcode(barcode: string, token: string): Promise<Product | BarcodeLookupProduct> {
    const response = await fetch(`${BASE_URL}/api/barcode/products/ByBarcode/${encodeURIComponent(barcode)}`, {
      method: "GET",
      headers: this.getAuthHeaders(token),
    })

    if (!response.ok) {
      const error = await response.json()
      throw error
    }

    return response.json()
  }

  /**
   * Get all products from saved barcode lookup
   * GET /api/barcode/products
   */
  async getAllBarcodeProducts(token: string): Promise<BarcodeProduct[]> {
    const response = await fetch(`${BASE_URL}/api/barcode/products`, {
      method: "GET",
      headers: this.getAuthHeaders(token),
    })

    if (!response.ok) {
      const error = await response.json()
      throw error
    }

    return response.json()
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
        barcode: String(product.barcode),
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
    const response = await fetch(`${BASE_URL}/api/user-products`, {
      method: "POST",
      ...this.getFetchOptions(token),
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const error = await response.json()
      throw error
    }

    return response.json()
  }

  /**
   * Get all user products
   * GET /api/user-products
   */
  async getUserProducts(token: string): Promise<UserProduct[]> {
    const response = await fetch(`${BASE_URL}/api/user-products`, {
      method: "GET",
      ...this.getFetchOptions(token),
    })

    if (!response.ok) {
      const error = await response.json()
      throw error
    }

    return response.json()
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
    const response = await fetch(`${BASE_URL}/api/user-products/${id}`, {
      method: "PUT",
      ...this.getFetchOptions(token),
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const error = await response.json()
      throw error
    }

    return response.json()
  }

  /**
   * Delete a user product
   * DELETE /api/user-products/:id
   */
  async deleteUserProduct(id: string, token: string): Promise<void> {
    const response = await fetch(`${BASE_URL}/api/user-products/${id}`, {
      method: "DELETE",
      ...this.getFetchOptions(token),
    })

    if (!response.ok) {
      const error = await response.json()
      throw error
    }
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
      barcode: String(product.barcode),
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
