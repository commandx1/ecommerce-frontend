"use client"

import { useRouter } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import { showToast } from "@/components/ui/Toast"
import { loadListingForEdit, loadRejectedProduct } from "../api/product-editor-commands"
import type { ProductFormValues } from "../lib/product-form"
import type { ExistingImages } from "../lib/product-media"
import type { ProductEditorModeInfo } from "./useProductEditorMode"

export interface EditorSeed {
  values: ProductFormValues
  existingImages: ExistingImages
  /** Plain edit only. */
  editDiscount?: string
  lockCatalogueFields?: boolean
}

const PRODUCTS_PATH = "/vendor-dashboard/products"

const loadFailureMessage = (error: unknown) => (error as { message?: string })?.message || "Failed to load product data"

/**
 * Seeds the form once for plain edit or review edit. Imperative rather than a query: the data seeds
 * editable local state, and a failure toasts and returns to the products list. A token change re-runs it.
 */
export function useProductEditorLoad(
  modeInfo: ProductEditorModeInfo,
  accessToken: string | null,
  onLoaded: (seed: EditorSeed) => void,
) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  // Read through a ref so the effects below re-run only on the ids and the token.
  const onLoadedRef = useRef(onLoaded)
  onLoadedRef.current = onLoaded
  const { isEditMode, userProductId, isReviewEditMode, reviewProductId, reviewUserProductId } = modeInfo

  // biome-ignore lint/correctness/useExhaustiveDependencies: router is stable; re-run only on ids and token
  useEffect(() => {
    if (!isEditMode || !userProductId || !accessToken) return
    const run = async () => {
      try {
        setIsLoading(true)
        const loaded = await loadListingForEdit(userProductId, accessToken)
        if (!loaded) {
          showToast.error("Product not found")
          router.push(PRODUCTS_PATH)
          return
        }
        onLoadedRef.current({ ...loaded, lockCatalogueFields: true })
      } catch (error) {
        showToast.error(loadFailureMessage(error))
        router.push(PRODUCTS_PATH)
      } finally {
        setIsLoading(false)
      }
    }
    void run()
  }, [isEditMode, userProductId, accessToken])

  // biome-ignore lint/correctness/useExhaustiveDependencies: router is stable; re-run only on ids and token
  useEffect(() => {
    if (!isReviewEditMode || !reviewProductId || !reviewUserProductId || !accessToken) return
    const run = async () => {
      try {
        setIsLoading(true)
        onLoadedRef.current(await loadRejectedProduct(reviewProductId, reviewUserProductId, accessToken))
      } catch (error) {
        showToast.error(loadFailureMessage(error))
        router.push(PRODUCTS_PATH)
      } finally {
        setIsLoading(false)
      }
    }
    void run()
  }, [isReviewEditMode, reviewProductId, reviewUserProductId, accessToken])

  return { isLoading }
}
