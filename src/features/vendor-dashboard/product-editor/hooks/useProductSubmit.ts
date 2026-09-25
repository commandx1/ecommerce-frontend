"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { showToast } from "@/components/ui/Toast"
import { queryKeys } from "@/lib/query/keys"
import { type SubmitProductInput, submitProduct } from "../api/product-editor-commands"
import type { EditorMode } from "../lib/product-form"
import { SUBMIT_SUCCESS_MESSAGES, submitErrorMessage } from "../lib/product-payloads"

/**
 * The save command for every branch. Success toasts, invalidates the two products-page caches
 * that a new or changed listing affects (brand filter and stat cards; the list itself refetches
 * on mount) and returns to the list. Failure puts the reason on the form and toasts it.
 */
export function useProductSubmit({
  mode,
  accessToken,
  onError,
}: {
  mode: EditorMode
  accessToken: string | null
  onError: (message: string) => void
}) {
  const router = useRouter()
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: (input: SubmitProductInput) => submitProduct(input, accessToken || ""),
    onSuccess: (_data, input) => {
      showToast.success(SUBMIT_SUCCESS_MESSAGES[input.branch])
      void Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.vendor.products.brands() }),
        queryClient.invalidateQueries({ queryKey: queryKeys.vendor.products.stats() }),
      ])
      router.push("/vendor-dashboard/products")
    },
    onError: (error) => {
      const message = submitErrorMessage(error, mode)
      onError(message)
      showToast.error(message)
    },
  })

  return { submit: mutation.mutate, isSubmitting: mutation.isPending }
}
