"use client"

import { useRouter } from "next/navigation"
import { type FormEvent, useState } from "react"
import { useAuthStore } from "@/stores/authStore"
import { adjacentTab, countTabErrors, type TabKey } from "../lib/product-form"
import { selectSubmitBranch } from "../lib/product-payloads"
import { useProductEditorLoad } from "./useProductEditorLoad"
import { useProductEditorMode } from "./useProductEditorMode"
import { useProductForm } from "./useProductForm"
import { useProductMedia } from "./useProductMedia"
import { useProductSearch } from "./useProductSearch"
import { useProductSubmit } from "./useProductSubmit"

export type EditorView = "search" | "form"

/** View model for ProductEditorPage: composes the mode, form, media, search, load and submit hooks. */
export function useProductEditor() {
  const router = useRouter()
  const { accessToken, isAuthenticated, user } = useAuthStore()
  const modeInfo = useProductEditorMode()
  const { mode } = modeInfo

  const form = useProductForm(mode)
  const media = useProductMedia({ onCoverPhotoAdded: () => form.clearError("coverPhoto") })
  const search = useProductSearch(accessToken)
  const load = useProductEditorLoad(modeInfo, accessToken, ({ existingImages, ...seed }) => {
    form.seed(seed)
    media.seedExistingImages(existingImages)
  })
  const { submit, isSubmitting } = useProductSubmit({ mode, accessToken, onError: form.setSubmitError })

  // Search-first UX: start on the search view unless we're editing/resubmitting an existing product
  const [view, setView] = useState<EditorView>(() =>
    modeInfo.userProductId || modeInfo.reviewProductId ? "form" : "search",
  )

  /** Every piece of editor state back to a blank create form (the search view's entry point). */
  const clearAll = () => {
    form.reset()
    media.reset()
    search.reset()
  }

  const goToTab = (tab: TabKey) => form.tryLeaveTab(tab, media.hasCoverPhoto)
  const goToAdjacentTab = (step: -1 | 1) => {
    const tab = adjacentTab(form.activeTab, step)
    if (tab) goToTab(tab)
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!form.validateAll(media.hasCoverPhoto)) return

    form.clearErrors()
    submit({
      branch: selectSubmitBranch({ ...modeInfo, selectedProduct: form.selectedProduct }),
      values: form.values,
      editDiscount: form.editDiscount,
      attributes: form.attributes,
      photoFiles: media.photoFiles,
      existingImages: media.existingImages,
      linkedImages: media.linkedImages,
      userProductId: modeInfo.userProductId,
      reviewProductId: modeInfo.reviewProductId,
      selectedProduct: form.selectedProduct,
    })
  }

  return {
    isSignedIn: Boolean(isAuthenticated && user),
    accessToken,
    mode,
    view,
    form,
    media,
    search,
    // One flag for both the initial load and a save in flight, as the submit button has always shown.
    isBusy: load.isLoading || isSubmitting,
    tabErrorCounts: {
      basic: countTabErrors(form.errors, "basic"),
      details: countTabErrors(form.errors, "details"),
      media: countTabErrors(form.errors, "media"),
    } satisfies Record<TabKey, number>,
    goToTab,
    goToPreviousTab: () => goToAdjacentTab(-1),
    goToNextTab: () => goToAdjacentTab(1),
    handleSubmit,
    clearAll,
    startNewProduct: () => {
      clearAll()
      setView("form")
    },
    backToSearch: () => {
      clearAll()
      setView("search")
    },
    cancel: () => router.push("/vendor-dashboard/products"),
    goToLogin: () => router.push("/login"),
  }
}

export type ProductEditorViewModel = ReturnType<typeof useProductEditor>
