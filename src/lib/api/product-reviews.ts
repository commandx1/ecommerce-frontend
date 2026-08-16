import type { ReviewsResponse } from "@/features/products/product-detail/types"
import { apiRequest } from "./request"

/** Client-side counterpart of the SSR review fetch, used when the vendor filter changes. */
export async function fetchReviewsByProduct(params: {
  productId: string
  userProductId?: string
  page?: number
  size?: number
}): Promise<ReviewsResponse> {
  return apiRequest.requestJson<ReviewsResponse>({
    client: "app",
    method: "GET",
    url: `/api/reviews/product/${params.productId}`,
    params: {
      page: params.page ?? 0,
      size: params.size ?? 10,
      ...(params.userProductId ? { userProductId: params.userProductId } : {}),
    },
    fallbackMessage: "Failed to load reviews",
  })
}

export async function createReview(params: {
  accessToken: string | null
  productId: string
  /** Required by the backend: the vendor listing (UserProduct.id) the review is written for. */
  userProductId: string
  star: number
  title: string
  comment: string
}): Promise<void> {
  await apiRequest.requestJson<void>({
    client: "app",
    method: "POST",
    headers: {
      ...(params.accessToken ? { Authorization: `Bearer ${params.accessToken}` } : {}),
    },
    url: "/api/reviews",
    data: {
      productId: params.productId,
      userProductId: params.userProductId,
      star: params.star,
      title: params.title,
      comment: params.comment,
    },
    fallbackMessage: "Failed to submit review",
  })
}

export async function deleteReview(params: { accessToken: string | null; reviewId: string }): Promise<void> {
  await apiRequest.requestJson<void>({
    client: "app",
    method: "DELETE",
    headers: {
      ...(params.accessToken ? { Authorization: `Bearer ${params.accessToken}` } : {}),
    },
    url: `/api/reviews/${params.reviewId}`,
    fallbackMessage: "Failed to delete review",
  })
}

export async function updateReview(params: {
  accessToken: string | null
  reviewId: string
  star: number
  title: string
  comment: string
}): Promise<void> {
  await apiRequest.requestJson<void>({
    client: "app",
    method: "PUT",
    headers: {
      ...(params.accessToken ? { Authorization: `Bearer ${params.accessToken}` } : {}),
    },
    url: `/api/reviews/${params.reviewId}`,
    data: {
      star: params.star,
      title: params.title,
      comment: params.comment,
    },
    fallbackMessage: "Failed to update review",
  })
}
