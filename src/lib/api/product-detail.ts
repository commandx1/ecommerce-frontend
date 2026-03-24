"use server"

import { cookies } from "next/headers"
import type { ProductDetailPageData, QuestionsResponse, ReviewsResponse } from "@/app/products/[id]/types"

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL

function requireBackendUrl() {
  if (!BACKEND_URL) throw new Error("NEXT_PUBLIC_BACKEND_URL is not set")
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

function buildFriendlyProductError(productResponse: Response, backendErrorMessage: string) {
  if (productResponse.status === 403) {
    return "You don't have permission to view this product. Please log in and try again."
  }
  if (productResponse.status === 404) {
    return "Product not found. The product may have been removed or doesn't exist."
  }
  if (productResponse.status === 401) {
    return "Authentication required. Please log in to view this product."
  }
  if (productResponse.status === 500) {
    return "Server error occurred. Please try again later."
  }
  if (productResponse.status >= 400) {
    if (
      !backendErrorMessage ||
      backendErrorMessage === "Failed to fetch product" ||
      backendErrorMessage.toLowerCase().includes("failed to fetch")
    ) {
      return `Unable to load product (Error ${productResponse.status}). Please try again later.`
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
    const me = await fetch(`${baseUrl}/api/users/me`, {
      cache: "no-store",
      headers,
    })
    const meData = await me.json()
    if (meData?.message !== "User not found") {
      headers.Authorization = `Bearer ${accessToken}`
    }
  }

  let productResponse: Response
  try {
    productResponse = await fetch(`${baseUrl}/api/products/${id}/with-user-products`, {
      cache: "no-store",
      headers,
    })
  } catch {
    throw new Error("Unable to connect to server. Please check your internet connection.")
  }

  // Reviews & questions are optional
  const [reviewsResponse, questionsResponse] = await Promise.all([
    fetch(`${baseUrl}/api/reviews/product/${id}?page=0&size=10`, { cache: "no-store", headers }).catch(() => null),
    fetch(`${baseUrl}/api/product-questions/product/${id}?page=0&size=10`, { cache: "no-store", headers }).catch(
      () => null,
    ),
  ])

  if (!productResponse.ok) {
    let backendErrorMessage = ""
    try {
      const contentType = productResponse.headers.get("content-type")
      if (contentType?.includes("application/json")) {
        const errorData = await productResponse.json()
        backendErrorMessage = errorData?.message || errorData?.error || ""
      } else {
        const errorText = await productResponse.text()
        if (errorText.trim()) backendErrorMessage = errorText
      }
    } catch {
      // ignore
    }

    throw new Error(buildFriendlyProductError(productResponse, backendErrorMessage))
  }

  const productData = await productResponse.json()
  if (!productData || !productData.product) {
    throw new Error("Invalid product data received from server")
  }

  const reviewsRaw = reviewsResponse?.ok ? await reviewsResponse.json() : null
  const questionsRaw = questionsResponse?.ok ? await questionsResponse.json() : null

  return {
    productData,
    reviews: reviewsRaw as ReviewsResponse | null,
    questions: questionsRaw as QuestionsResponse | null,
  } as ProductDetailPageData
}
