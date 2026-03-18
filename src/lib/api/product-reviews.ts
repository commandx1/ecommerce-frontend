"use client"

import { readApiErrorMessage } from "./api-error"

export async function createReview(params: {
  accessToken: string | null
  productId: string
  star: number
  title: string
  comment: string
}): Promise<void> {
  const response = await fetch("/api/reviews", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(params.accessToken ? { Authorization: `Bearer ${params.accessToken}` } : {}),
    },
    body: JSON.stringify({
      productId: params.productId,
      star: params.star,
      title: params.title,
      comment: params.comment,
    }),
  })

  if (!response.ok) {
    const message = await readApiErrorMessage(response, "Failed to submit review")
    throw new Error(message)
  }
}

export async function updateReview(params: {
  accessToken: string | null
  reviewId: string
  star: number
  title: string
  comment: string
}): Promise<void> {
  const response = await fetch(`/api/reviews/${params.reviewId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...(params.accessToken ? { Authorization: `Bearer ${params.accessToken}` } : {}),
    },
    body: JSON.stringify({
      star: params.star,
      title: params.title,
      comment: params.comment,
    }),
  })

  if (!response.ok) {
    const message = await readApiErrorMessage(response, "Failed to update review")
    throw new Error(message)
  }
}
