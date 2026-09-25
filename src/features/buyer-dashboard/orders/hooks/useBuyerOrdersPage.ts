"use client"

import type { ExpandedState, OnChangeFn } from "@tanstack/react-table"
import { useCallback, useEffect, useMemo, useState } from "react"
import type { BuyerOrderTrackingLink } from "@/lib/api/buyer-orders"
import { buildBuyerOrderViewModel } from "../lib/order-view-model"
import type { BuyerOrderLinksModalPayload, BuyerOrderStatusTab } from "../types"
import { useBuyerOrderActions } from "./useBuyerOrderActions"
import { useBuyerOrdersQuery } from "./useBuyerOrdersQuery"

/**
 * Composes `useBuyerOrdersQuery` (URL/tab/page/sort -> params -> list query) and
 * `useBuyerOrderActions` (reorder / cancel / refund, keyed off the query's current params), and
 * owns the remaining page-only UI state (row expansion, tracking-links modal) that neither of
 * those hooks needs (Phase 4 §7, B4c). The return shape is unchanged from the pre-migration
 * hook, so `BuyerOrdersProvider` and its context slices don't change.
 *
 * The old inline `filteredOrders` search filter is dropped here: `searchQuery` was hardcoded to
 * `""`, so `!searchQuery.trim()` was always true and the filter always returned every order
 * unchanged - a behaviour-neutral removal of dead code, not a feature change.
 */
export function useBuyerOrdersPage() {
  const ordersQuery = useBuyerOrdersQuery()
  const actions = useBuyerOrderActions(ordersQuery.params)

  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null)
  const [trackingModalLinks, setTrackingModalLinks] = useState<
    BuyerOrderLinksModalPayload | BuyerOrderTrackingLink[] | null
  >(null)

  useEffect(() => {
    if (ordersQuery.singleOrderId) {
      setExpandedOrderId(ordersQuery.singleOrderId)
    }
  }, [ordersQuery.singleOrderId])

  const handleTabChange = useCallback(
    (tab: BuyerOrderStatusTab) => {
      ordersQuery.handleTabChange(tab)
      setExpandedOrderId(null)
    },
    [ordersQuery.handleTabChange],
  )

  const filteredOrders = ordersQuery.orders

  const summariesByOrderId = useMemo(
    () =>
      new Map(
        filteredOrders.map((order) => {
          return [order.orderId, buildBuyerOrderViewModel(order)] as const
        }),
      ),
    [filteredOrders],
  )

  const expandedState = useMemo<ExpandedState>(
    () => (expandedOrderId ? { [expandedOrderId]: true } : {}),
    [expandedOrderId],
  )

  const handleExpandedChange = useCallback<OnChangeFn<ExpandedState>>(
    (nextExpanded) => {
      const resolvedExpanded = typeof nextExpanded === "function" ? nextExpanded(expandedState) : nextExpanded
      if (resolvedExpanded === true) {
        setExpandedOrderId(null)
        return
      }

      const expandedRowIds = Object.keys(resolvedExpanded).filter((rowId) => Boolean(resolvedExpanded[rowId]))
      const nextExpandedRowId = expandedRowIds[expandedRowIds.length - 1] ?? null
      setExpandedOrderId(nextExpandedRowId)
    },
    [expandedState],
  )

  return {
    cancelingItemId: actions.cancelingItemId,
    cancelingSellerKey: actions.cancelingSellerKey,
    confirmPendingCancelAction: actions.confirmPendingCancelAction,
    currentPage: ordersQuery.currentPage,
    sortField: ordersQuery.sortField,
    sortDir: ordersQuery.sortDir,
    expandedState,
    filteredOrders,
    handleSort: ordersQuery.handleSort,
    handleExpandedChange,
    handlePageChange: ordersQuery.handlePageChange,
    handleReorder: actions.handleReorder,
    isSubmittingRefund: actions.isSubmittingRefund,
    isAuthenticated: ordersQuery.isAuthenticated,
    isConfirmingCancel: actions.isConfirmingCancel,
    isLoading: ordersQuery.isLoading,
    pageSize: ordersQuery.pageSize,
    pendingCancelAction: actions.pendingCancelAction,
    pendingRefundOrder: actions.pendingRefundOrder,
    reorderingItemId: actions.reorderingItemId,
    requestCancelAction: actions.requestCancelAction,
    requestRefundAction: actions.requestRefundAction,
    selectedTab: ordersQuery.selectedTab,
    singleOrderId: ordersQuery.singleOrderId,
    clearSingleOrder: ordersQuery.clearSingleOrder,
    submitRefundOrder: actions.submitRefundOrder,
    setPendingCancelAction: actions.setPendingCancelAction,
    setPendingRefundOrder: actions.setPendingRefundOrder,
    setTrackingModalLinks,
    summariesByOrderId,
    totalElements: ordersQuery.totalElements,
    totalPages: ordersQuery.totalPages,
    trackingModalLinks,
    handleTabChange,
  }
}

export type UseBuyerOrdersPageResult = ReturnType<typeof useBuyerOrdersPage>
