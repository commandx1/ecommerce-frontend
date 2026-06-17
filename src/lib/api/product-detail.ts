"use server"

import { cookies } from "next/headers"
import type {
  ProductDetailPageData,
  QuestionsResponse,
  ReviewsResponse,
} from "@/features/products/product-detail/types"
import { apiRequest } from "./request"

const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:8080"

function requireBackendUrl() {
  if (!BACKEND_URL) throw new Error("BACKEND_URL is not set")
  return BACKEND_URL
}

async function getAccessTokenFromCookie(): Promise<string | null> {
  const cookieStore = await cookies()
  const authCookie = cookieStore.get("auth-storage")
  if (!authCookie) return null

  try {
    let authData: { state?: { accessToken?: string } }
    try {
      authData = JSON.parse(authCookie.value)
    } catch {
      const decodedValue = decodeURIComponent(authCookie.value)
      authData = JSON.parse(decodedValue)
    }

    return authData?.state?.accessToken || null
  } catch {
    return null
  }
}

function buildFriendlyProductError(status: number, backendErrorMessage: string) {
  if (status === 403) {
    return "You don't have permission to view this product. Please log in and try again."
  }
  if (status === 404) {
    return "Product not found. The product may have been removed or doesn't exist."
  }
  if (status === 401) {
    return "Authentication required. Please log in to view this product."
  }
  if (status === 500) {
    return "Server error occurred. Please try again later."
  }
  if (status >= 400) {
    if (
      !backendErrorMessage ||
      backendErrorMessage === "Failed to fetch product" ||
      backendErrorMessage.toLowerCase().includes("failed to fetch")
    ) {
      return `Unable to load product (Error ${status}). Please try again later.`
    }
    return backendErrorMessage
  }
  return backendErrorMessage || "Failed to load product. Please try again."
}

export async function fetchProductDetailPageData(id: string): Promise<ProductDetailPageData> {
  const baseUrl = requireBackendUrl()

  const accessToken = await getAccessTokenFromCookie()

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    "User-Agent": "Mozilla/5.0",
    Accept: "application/json",
  }

  // Keep existing behavior (only attach token if /users/me doesn't say "User not found")
  if (accessToken) {
    const authHeaders: HeadersInit = {
      ...headers,
      Authorization: `Bearer ${accessToken}`,
    }

    const me = await apiRequest.requestResponse<{ message?: string }>({
      client: "app",
      method: "GET",
      url: `${baseUrl}/api/users/me`,
      headers: authHeaders,
      validateStatus: () => true,
      fallbackMessage: "Failed to fetch user profile",
    })
    const meData = me.data
    if (meData?.message !== "User not found") {
      headers.Authorization = `Bearer ${accessToken}`
    }
  }

  let productResponse: Awaited<
    ReturnType<typeof apiRequest.requestResponse<(Record<string, unknown> & { product?: unknown }) | string>>
  >
  try {
    productResponse = await apiRequest.requestResponse<(Record<string, unknown> & { product?: unknown }) | string>({
      client: "app",
      method: "GET",
      url: `${baseUrl}/api/products/${id}/with-user-products`,
      headers,
      validateStatus: () => true,
      fallbackMessage: "Failed to fetch product",
    })
  } catch {
    throw new Error("Unable to connect to server. Please check your internet connection.")
  }

  // Reviews & questions are optional
  const [reviewsResponse, questionsResponse] = await Promise.all([
    apiRequest
      .requestJson<ReviewsResponse>({
        client: "app",
        method: "GET",
        url: `${baseUrl}/api/reviews/product/${id}`,
        params: { page: 0, size: 10 },
        headers,
        fallbackMessage: "Failed to fetch reviews",
      })
      .catch(() => null),
    apiRequest
      .requestJson<QuestionsResponse>({
        client: "app",
        method: "GET",
        url: `${baseUrl}/api/product-questions/product/${id}`,
        params: { page: 0, size: 10 },
        headers,
        fallbackMessage: "Failed to fetch questions",
      })
      .catch(() => null),
  ])

  if (productResponse.status < 200 || productResponse.status >= 300) {
    let backendErrorMessage = ""

    const errorData = productResponse.data
    if (typeof errorData === "string" && errorData.trim()) {
      backendErrorMessage = errorData
    } else if (errorData && typeof errorData === "object") {
      if ("message" in errorData && typeof errorData.message === "string") {
        backendErrorMessage = errorData.message
      } else if ("error" in errorData && typeof errorData.error === "string") {
        backendErrorMessage = errorData.error
      }
    }

    throw new Error(buildFriendlyProductError(productResponse.status, backendErrorMessage))
  }

  const productData = productResponse.data
  if (!productData || typeof productData !== "object" || !("product" in productData) || !productData.product) {
    throw new Error("Invalid product data received from server")
  }

  return {
    productData,
    reviews: reviewsResponse,
    questions: questionsResponse,
  } as ProductDetailPageData
}
