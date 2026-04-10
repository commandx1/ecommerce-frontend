"use client"

import { apiRequest } from "./request"

export async function submitProductQuestion(params: {
  accessToken: string | null
  productId: string
  userProductId: string
  question: string
}): Promise<void> {
  await apiRequest.requestJson<void>({
    client: "app",
    method: "POST",
    url: "/api/product-questions",
    headers: {
      ...(params.accessToken ? { Authorization: `Bearer ${params.accessToken}` } : {}),
    },
    data: {
      productId: params.productId,
      userProductId: params.userProductId,
      question: params.question,
    },
    fallbackMessage: "Failed to submit question",
  })
}

export async function submitProductAnswer(params: {
  accessToken: string | null
  productQuestionId: string
  answer: string
}): Promise<void> {
  await apiRequest.requestJson<void>({
    client: "app",
    method: "POST",
    url: "/api/product-answers",
    headers: {
      ...(params.accessToken ? { Authorization: `Bearer ${params.accessToken}` } : {}),
    },
    data: {
      productQuestionId: params.productQuestionId,
      answer: params.answer,
    },
    fallbackMessage: "Failed to submit answer",
  })
}
