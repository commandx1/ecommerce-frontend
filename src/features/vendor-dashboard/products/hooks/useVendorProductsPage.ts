"use client"

import { useQuery } from "@tanstack/react-query"
import type { Row } from "@tanstack/react-table"
import type { MouseEvent } from "react"
import { useCallback, useEffect, useState } from "react"
import { useAuthStore } from "@/stores/authStore"
import { vendorProductBrandsOptions } from "../api/products-queries"
import type { ProductWithDetails } from "../types"
import { useProductListQuery } from "./useProductListQuery"
import { useProductMutations } from "./useProductMutations"

interface DeleteModalState {
  isOpen: boolean
  productId: string | null
  productName: string
}

/**
 * Composes the list query, the brand lookup and the mutations into the single view model
 * `VendorProductsPage` renders. UI-only state that does not belong to any one of those — row
 * selection, the image-placeholder fallback map, and which modal (if any) is open — stays here,
 * the same place `VendorOrdersPage` keeps its own modal-open state (design's established
 * pattern for this codebase, not a hook of its own).
 */
export function useVendorProductsPage() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const accessToken = useAuthStore((state) => state.accessToken)

  const listQuery = useProductListQuery()
  const mutations = useProductMutations(listQuery.listParams, accessToken)

  const brandsQuery = useQuery(vendorProductBrandsOptions(isAuthenticated && Boolean(accessToken), accessToken))
  const brandOptions = brandsQuery.data ?? []

  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([])
  const [imageFallbacks, setImageFallbacks] = useState<Record<string, boolean>>({})
  const [isImportModalOpen, setIsImportModalOpen] = useState(false)
  const [deleteModal, setDeleteModal] = useState<DeleteModalState>({ isOpen: false, productId: null, productName: "" })
  const [detailModalProduct, setDetailModalProduct] = useState<ProductWithDetails | null>(null)
  const [isBulkDiscountModalOpen, setIsBulkDiscountModalOpen] = useState(false)
  const [bulkDiscountValue, setBulkDiscountValue] = useState("")

  const clearSelection = () => setSelectedProductIds([])

  // Selection refers to rows on the current page of the current query, so any change to the
  // query invalidates it.
  // biome-ignore lint/correctness/useExhaustiveDependencies: selection is reset on query change only
  useEffect(() => {
    setSelectedProductIds([])
  }, [
    listQuery.selectedFilter,
    listQuery.sortField,
    listQuery.sortDirection,
    listQuery.pageSize,
    listQuery.currentPage,
    listQuery.searchQuery,
    listQuery.selectedBrand,
    listQuery.selectedPeriodTab,
    listQuery.viewMode,
    listQuery.reviewApprovedFilter,
  ])

  // Clicking anywhere on a row toggles its selection, except on the controls (inline edit
  // inputs, action buttons, links) that live inside the row.
  const handleRowClick = (row: Row<ProductWithDetails>, event: MouseEvent<HTMLTableRowElement>) => {
    const productId = row.original.id

    // A row being inline-edited is not selectable — clicking around its inputs should not
    // toggle selection out from under the draft.
    if (mutations.editingProductId === productId) {
      return
    }

    const target = event.target as HTMLElement
    if (target.closest('button, a, input, select, textarea, [role="button"], [role="dialog"]')) {
      return
    }

    setSelectedProductIds((prev) =>
      prev.includes(productId) ? prev.filter((item) => item !== productId) : [...prev, productId],
    )
  }

  // Stabilized with `useCallback` — flows into the table's actions column as `onDelete`, which
  // needs a stable identity for the same reason described in `components/columns.tsx`.
  const openDeleteModal = useCallback(
    (userProductId: string, productName: string) =>
      setDeleteModal({ isOpen: true, productId: userProductId, productName }),
    [],
  )

  const closeDeleteModal = () => setDeleteModal({ isOpen: false, productId: null, productName: "" })

  const confirmDelete = async () => {
    if (!deleteModal.productId) return
    const succeeded = await mutations.deleteProduct(deleteModal.productId)
    if (succeeded) {
      closeDeleteModal()
    }
  }

  const openBulkDiscountModal = () => setIsBulkDiscountModalOpen(true)
  const closeBulkDiscountModal = () => setIsBulkDiscountModalOpen(false)

  const confirmBulkDiscount = async () => {
    const succeeded = await mutations.applyBulkDiscount(selectedProductIds, bulkDiscountValue)
    if (succeeded) {
      closeBulkDiscountModal()
      setBulkDiscountValue("")
      clearSelection()
    }
  }

  // Stabilized with `useCallback` — flows into the table's product column as `onImageError`; see
  // `components/columns.tsx`.
  const handleImageError = useCallback(
    (productId: string) => setImageFallbacks((prev) => (prev[productId] ? prev : { ...prev, [productId]: true })),
    [],
  )

  return {
    isAuthenticated,
    listQuery,
    mutations,
    brandOptions,
    selectedProductIds,
    clearSelection,
    handleRowClick,
    imageFallbacks,
    handleImageError,
    isImportModalOpen,
    openImportModal: () => setIsImportModalOpen(true),
    closeImportModal: () => setIsImportModalOpen(false),
    deleteModal,
    openDeleteModal,
    closeDeleteModal,
    confirmDelete,
    detailModalProduct,
    openDetailModal: setDetailModalProduct,
    closeDetailModal: () => setDetailModalProduct(null),
    isBulkDiscountModalOpen,
    openBulkDiscountModal,
    closeBulkDiscountModal,
    bulkDiscountValue,
    setBulkDiscountValue,
    confirmBulkDiscount,
  }
}
