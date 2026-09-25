"use client"

import { useEffect, useState } from "react"
import { showToast } from "@/components/ui/Toast"
import type { NormalizedSearchProduct } from "@/lib/api/products"
import { useAuthStore } from "@/stores/authStore"
import { submitSearchResultProduct } from "../api/product-editor-commands"
import { validateSearchResultInputs } from "../lib/search-result-payloads"

export interface UseProductDetailsSubmitInput {
  product: NormalizedSearchProduct
  isOpen: boolean
  onSuccess: () => void
}

/** ProductDetailsModal's price/stock form plus its one-shot "Add Product" submit. */
export function useProductDetailsSubmit({ product, isOpen, onSuccess }: UseProductDetailsSubmitInput) {
  const { accessToken } = useAuthStore()
  const [price, setPrice] = useState("")
  const [stock, setStock] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      setPrice("")
      setStock("")
      setErrorMessage(null)
    }
  }, [isOpen])

  const handleSubmit = async () => {
    const validationError = validateSearchResultInputs(price, stock)
    if (validationError) {
      setErrorMessage(validationError)
      return
    }

    setIsSubmitting(true)
    setErrorMessage(null)

    try {
      await submitSearchResultProduct(product, price, stock, accessToken || "")
      showToast.success("Product added successfully!")
      onSuccess()
    } catch (error) {
      const message = (error as { message?: string })?.message || "Failed to add product. Please try again."
      setErrorMessage(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return {
    price,
    setPrice,
    stock,
    setStock,
    isSubmitting,
    errorMessage,
    canSubmit: Boolean(product.title.trim()),
    handleSubmit,
  }
}

export type ProductDetailsSubmit = ReturnType<typeof useProductDetailsSubmit>
