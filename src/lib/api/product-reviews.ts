"use client"

import { apiRequest } from "./request"

export async function createReview(params: {
  accessToken: string | null
  productId: string
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
      star: params.star,
      title: params.title,
      comment: params.comment,
    },
    fallbackMessage: "Failed to submit review",
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
