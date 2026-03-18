"use client"

import { readApiErrorMessage } from "./api-error"

export async function submitProductQuestion(params: {
  accessToken: string | null
  productId: string
  userProductId: string
  question: string
}): Promise<void> {
  const response = await fetch("/api/product-questions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(params.accessToken ? { Authorization: `Bearer ${params.accessToken}` } : {}),
    },
    body: JSON.stringify({
      productId: params.productId,
      userProductId: params.userProductId,
      question: params.question,
    }),
  })

  if (!response.ok) {
    const message = await readApiErrorMessage(response, "Failed to submit question")
    throw new Error(message)
  }
}

export async function submitProductAnswer(params: {
  accessToken: string | null
  productQuestionId: string
  answer: string
}): Promise<void> {
  const response = await fetch("/api/product-answers", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(params.accessToken ? { Authorization: `Bearer ${params.accessToken}` } : {}),
    },
    body: JSON.stringify({
      productQuestionId: params.productQuestionId,
      answer: params.answer,
    }),
  })

  if (!response.ok) {
    const message = await readApiErrorMessage(response, "Failed to submit answer")
    throw new Error(message)
  }
}
