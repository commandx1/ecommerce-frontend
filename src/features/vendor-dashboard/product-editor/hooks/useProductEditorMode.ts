"use client"

import { useSearchParams } from "next/navigation"
import { useState } from "react"
import { type EditorMode, resolveEditorMode } from "../lib/product-form"

export interface ProductEditorModeInfo {
  mode: EditorMode
  /** `?edit=<userProductId>`: update price/discount/stock of an approved listing. */
  isEditMode: boolean
  userProductId: string | null
  /** `?reviewEditId=<productId>&reviewUserProductId=<id>`: fix and resubmit a rejected product. */
  isReviewEditMode: boolean
  reviewProductId: string | null
  reviewUserProductId: string | null
}

/** Read once on mount: a later URL change never switches the editor into another mode. */
export function useProductEditorMode(): ProductEditorModeInfo {
  const searchParams = useSearchParams()
  const [info] = useState<ProductEditorModeInfo>(() => {
    const userProductId = searchParams.get("edit")
    const reviewProductId = searchParams.get("reviewEditId")
    const isEditMode = !!userProductId
    const isReviewEditMode = !!reviewProductId
    return {
      mode: resolveEditorMode({ isEditMode, isReviewEditMode }),
      isEditMode,
      userProductId,
      isReviewEditMode,
      reviewProductId,
      reviewUserProductId: searchParams.get("reviewUserProductId"),
    }
  })
  return info
}
