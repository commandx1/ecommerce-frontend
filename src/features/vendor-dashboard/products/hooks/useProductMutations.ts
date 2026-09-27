"use client"

import { useQueryClient } from "@tanstack/react-query"
import { useCallback, useMemo, useRef, useState } from "react"
import { showToast } from "@/components/ui/Toast"
import { revalidateCategoryCounts } from "@/lib/actions/revalidate-category-counts"
import { productsAPI } from "@/lib/api/products"
import { queryKeys, type VendorProductListParams } from "@/lib/query/keys"
import type { VendorProductsListResult } from "../api/products-queries"
import { keepOriginalIfUnchanged, parseEditingDraft, toDecimalInput } from "../lib/inline-edit"
import { patchProductRow } from "../lib/product-list-mappers"
import type { EditingDraft, ProductStatusDraft, ProductWithDetails } from "../types"

export interface ProductMutations {
  editingProductId: string | null
  editingDraft: EditingDraft | null
  savingProductId: string | null
  canSaveDraft: boolean
  startEdit: (product: ProductWithDetails) => void
  updateDraft: (patch: Partial<EditingDraft>) => void
  cancelEdit: () => void
  saveEdit: (product: ProductWithDetails) => Promise<void>
  deleteProduct: (userProductId: string) => Promise<boolean>
  isApplyingBulkDiscount: boolean
  applyBulkDiscount: (userProductIds: string[], discountValue: string) => Promise<boolean>
}

/**
 * Inline edit, delete and bulk discount. Only one row can be inline-edited at a time, so
 * `savingProductId` needs no per-row map.
 */
export function useProductMutations(listParams: VendorProductListParams, accessToken: string | null): ProductMutations {
  const queryClient = useQueryClient()
  // Keyed on the serialized `listParams` (a fresh object every render) so `listKey` - and
  // `saveEdit` below - only change identity on an actual filter/sort/page change.
  // biome-ignore lint/correctness/useExhaustiveDependencies: keyed on the serialized value, not the (always-fresh) listParams reference
  const listKey = useMemo(() => queryKeys.vendor.products.list(listParams), [JSON.stringify(listParams)])

  const [editingProductId, setEditingProductId] = useState<string | null>(null)
  const [editingDraft, setEditingDraft] = useState<EditingDraft | null>(null)
  const [savingProductId, setSavingProductId] = useState<string | null>(null)
  const [isApplyingBulkDiscount, setIsApplyingBulkDiscount] = useState(false)

  // `saveEdit` reads the draft through this ref (not a closure) so its own identity stays stable
  // while the vendor types — see the note on `useProductColumns` for why that matters.
  const editingDraftRef = useRef(editingDraft)
  editingDraftRef.current = editingDraft

  const invalidateProductStats = useCallback(
    () => queryClient.invalidateQueries({ queryKey: queryKeys.vendor.products.stats() }),
    [queryClient],
  )

  // Stable callbacks: they flow into the table's action cells (see `columns.tsx`), which read
  // `editingDraft` off a ref so the draft need not be a dependency.
  const startEdit = useCallback((product: ProductWithDetails) => {
    setEditingProductId(product.id)
    setEditingDraft({
      price: toDecimalInput(product.price),
      discount: toDecimalInput(product.discount),
      stock: String(product.stock),
      active: (product.active ? "active" : "inactive") as ProductStatusDraft,
      shipmentFee: toDecimalInput(product.shipmentFee),
      heavyShippingSurcharge: toDecimalInput(product.heavyShippingSurcharge),
    })
  }, [])

  const updateDraft = useCallback(
    (patch: Partial<EditingDraft>) => setEditingDraft((prev) => (prev ? { ...prev, ...patch } : prev)),
    [],
  )

  const cancelEdit = useCallback(() => {
    setEditingProductId(null)
    setEditingDraft(null)
  }, [])

  const saveEdit = useCallback(
    async (product: ProductWithDetails) => {
      const draft = editingDraftRef.current
      if (!accessToken || !draft) return
      const parsed = parseEditingDraft(draft)
      if (!parsed) return

      try {
        setSavingProductId(product.id)
        const updatedProduct = await productsAPI.updateUserProduct(
          product.id,
          {
            price: keepOriginalIfUnchanged(parsed.price, product.price),
            stock: parsed.stock,
            discount: keepOriginalIfUnchanged(parsed.discount, product.discount),
            active: parsed.active,
            skuCode: product.skuCode,
            shipmentFee: keepOriginalIfUnchanged(parsed.shipmentFee, product.shipmentFee),
            heavyShippingSurcharge: keepOriginalIfUnchanged(
              parsed.heavyShippingSurcharge,
              product.heavyShippingSurcharge,
            ),
          },
          accessToken,
        )

        queryClient.setQueryData<VendorProductsListResult>(listKey, (data) =>
          data
            ? patchProductRow(data, product.id, {
                ...updatedProduct,
                active: parsed.active,
                productName: updatedProduct.productName,
              })
            : data,
        )
        setEditingProductId(null)
        setEditingDraft(null)
        // Stock and the active flag both feed the stat cards.
        void invalidateProductStats()
        // Only stock crossing the 0 boundary (in or out of stock) or the active toggle can move
        // this listing in or out of its category's public count - a price/discount/shipping-only
        // edit never does, so skip the purge for those. Fire-and-forget either way, never blocks
        // the already-saved edit.
        const stockCrossedZeroBoundary = (product.stock === 0) !== (parsed.stock === 0)
        const activeChanged = product.active !== parsed.active
        if (stockCrossedZeroBoundary || activeChanged) {
          void revalidateCategoryCounts()
        }
      } catch (error) {
        console.error("Error updating product:", error)
        showToast.error("Update failed", error instanceof Error ? error.message : "Failed to update product")
      } finally {
        setSavingProductId(null)
      }
    },
    [accessToken, listKey, queryClient, invalidateProductStats],
  )

  const deleteProduct = useCallback(
    async (userProductId: string): Promise<boolean> => {
      if (!accessToken) return false

      try {
        await productsAPI.deleteUserProduct(userProductId, accessToken)
        void revalidateCategoryCounts()
        // `.all` (not just `.lists()`/`.stats()`) so a deleted product's brand also drops out of
        // the brand filter, not just the table and stat cards.
        await queryClient.invalidateQueries({ queryKey: queryKeys.vendor.products.all })
        return true
      } catch (error) {
        console.error("Error deleting product:", error)
        showToast.error("Delete failed", error instanceof Error ? error.message : "Failed to delete product")
        return false
      }
    },
    [accessToken, queryClient],
  )

  const applyBulkDiscount = useCallback(
    async (userProductIds: string[], discountValue: string): Promise<boolean> => {
      if (!accessToken || userProductIds.length === 0) return false

      const discount = Number(discountValue)
      if (!Number.isFinite(discount) || discount < 0 || discount > 100) {
        showToast.error("Invalid discount", "Discount must be a number between 0 and 100.")
        return false
      }

      try {
        setIsApplyingBulkDiscount(true)
        await productsAPI.bulkDiscount(accessToken, { userProductIds, discount })

        showToast.success(
          "Discount applied",
          `${discount}% discount applied to ${userProductIds.length} product${userProductIds.length > 1 ? "s" : ""}.`,
        )
        await queryClient.invalidateQueries({ queryKey: queryKeys.vendor.products.lists() })
        return true
      } catch (error) {
        console.error("Error applying bulk discount:", error)
        showToast.error("Bulk discount failed", error instanceof Error ? error.message : "Failed to apply discount")
        return false
      } finally {
        setIsApplyingBulkDiscount(false)
      }
    },
    [accessToken, queryClient],
  )

  const canSaveDraft = editingDraft !== null && parseEditingDraft(editingDraft) !== null

  return {
    editingProductId,
    editingDraft,
    savingProductId,
    canSaveDraft,
    startEdit,
    updateDraft,
    cancelEdit,
    saveEdit,
    deleteProduct,
    isApplyingBulkDiscount,
    applyBulkDiscount,
  }
}
