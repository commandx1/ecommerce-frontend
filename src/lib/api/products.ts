// Use Next.js API routes as proxy to avoid CORS issues

const BASE_URL = "" // Use Next.js API routes at /api/...

// Product Types
export interface Product {
  id: string
  name: string
  detailedName: string
  aboutProduct: string
  photoPaths: string
  subCategoriesId: string
  productDetailsId: string | null
  reviewCount: number
  vendorsCount: number
  overallStar: number
  customerReviews: string
  barcode: number
  barcodeFormats: string
  active: boolean
  userId: string
  createdDate: string
}

export interface CreateProductPayload {
  name: string
  detailedName: string
  aboutProduct: string
  photoPaths: string
  subCategoriesId: string
  customerReviews?: string
  barcode: number
  barcodeFormats: string
  active: boolean
}

export interface UpdateProductPayload {
  productId?: string
  name: string
  detailedName: string
  aboutProduct: string
  photoPaths: string
  subCategoriesId: string
  customerReviews?: string
  barcode: number
  barcodeFormats: string
  active: boolean
}

// Product Details Types
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

class ProductsAPI {
  private getAuthHeaders(token?: string) {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    }
    if (token) {
      headers["Authorization"] = `Bearer ${token}`
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
   * Create a new product
   * POST /api/products
   */
  async createProduct(payload: CreateProductPayload, token: string): Promise<Product> {
    const response = await fetch(`${BASE_URL}/api/products`, {
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
   * Get product by ID
   * GET /api/products/:id
   */
  async getProductById(id: string): Promise<Product> {
    const response = await fetch(`${BASE_URL}/api/products/${id}`, {
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
}

export const productsAPI = new ProductsAPI()
