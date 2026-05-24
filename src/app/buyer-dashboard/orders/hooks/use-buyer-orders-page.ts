"use client"

import type { ExpandedState, OnChangeFn } from "@tanstack/react-table"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useMemo, useState } from "react"
import { showToast } from "@/components/ui/Toast"
import { extractErrorStatus, isAuthErrorStatus, isAuthHandledError } from "@/lib/api/auth-error"
import { type BuyerOrder, type BuyerOrderTrackingLink, buyerOrdersAPI } from "@/lib/api/buyer-orders"
import { OrderItemStatus } from "@/lib/constants/order-item-status"
import { useAuthStore } from "@/stores/authStore"
import { useCartStore } from "@/stores/cartStore"
import {
  buildBuyerOrderViewModel,
  extractApiErrorMessage,
  getAddressSummary,
  getOrderItems,
  resolveOrderViewStatus,
  resolvePaymentSummary,
} from "../lib/order-view-utils"
import type { OrderViewStatus, PendingCancelAction } from "../types"

const DEFAULT_PAGE_SIZE = 10

export function useBuyerOrdersPage() {
  const router = useRouter()
  const { isAuthenticated } = useAuthStore()
  const addToCart = useCartStore((state) => state.addToCart)

  const [orders, setOrders] = useState<BuyerOrder[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState<number>(0)
  const [totalPages, setTotalPages] = useState<number>(1)
  const [totalElements, setTotalElements] = useState<number>(0)
  const [dateSortDir, setDateSortDir] = useState<"asc" | "desc">("desc")
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null)
  const [trackingModalLinks, setTrackingModalLinks] = useState<BuyerOrderTrackingLink[] | null>(null)
  const [reorderingItemId, setReorderingItemId] = useState<string | null>(null)
  const [cancelingItemId, setCancelingItemId] = useState<string | null>(null)
  const [cancelingSellerKey, setCancelingSellerKey] = useState<string | null>(null)
  const [pendingCancelAction, setPendingCancelAction] = useState<PendingCancelAction | null>(null)
  const [isConfirmingCancel, setIsConfirmingCancel] = useState(false)

  const pageSize = DEFAULT_PAGE_SIZE
  const searchQuery = ""
  const statusFilter: "all" | OrderViewStatus = "all"

  useEffect(() => {
    const fetchOrders = async () => {
      if (!isAuthenticated) return
      try {
        setIsLoading(true)
        const response = await buyerOrdersAPI.getBuyerOrders(currentPage, pageSize, "createdDate", dateSortDir)
        setOrders(response.orders)
        setTotalPages(response.totalPages)
        setTotalElements(response.totalElements)
      } catch (error: unknown) {
        if (!isAuthHandledError(error)) {
          showToast.error("Orders unavailable", "Your orders could not be loaded right now. Please try again.")
        }
        setOrders([])
        setTotalPages(0)
        setTotalElements(0)
      } finally {
        setIsLoading(false)
      }
    }

    void fetchOrders()
  }, [isAuthenticated, currentPage, pageSize, dateSortDir])

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page)
  }, [])

  const handleDateSortToggle = useCallback(() => {
    setDateSortDir((prev) => (prev === "desc" ? "asc" : "desc"))
    setCurrentPage(0)
  }, [])

  const handleReorder = useCallback(
    async (userProductId: string, quantity: number, productName: string) => {
      setReorderingItemId(userProductId)

      try {
        await addToCart(userProductId, quantity)
        showToast.success("Added to cart", `${productName} was added to your cart.`)
      } catch (error: unknown) {
        if (isAuthHandledError(error)) {
          return
        }

        const status = extractErrorStatus(error)
        if (isAuthErrorStatus(status)) {
          showToast.error("Authentication required", "Please sign in to reorder items.")
          router.push("/login")
          return
        }

        showToast.error("Reorder failed", "This item could not be added to your cart. Please try again.")
      } finally {
        setReorderingItemId(null)
      }
    },
    [addToCart, router],
  )

  const handleCancelDuringDelivery = useCallback(
    async (
      orderItemIds: string[],
      successFallbackMessage: string,
      options?: { cancelingItemId?: string; cancelingSellerKey?: string },
    ) => {
      if (orderItemIds.length === 0) return
      if (options?.cancelingItemId) {
        setCancelingItemId(options.cancelingItemId)
      }
      if (options?.cancelingSellerKey) {
        setCancelingSellerKey(options.cancelingSellerKey)
      }

      try {
        const response = await buyerOrdersAPI.cancelDuringDeliveryByCustomer({ orderItemIds })
        setOrders((prev) =>
          prev.map((order) => ({
            ...order,
            sellerGroups: Array.isArray(order.sellerGroups)
              ? order.sellerGroups.map((group) => ({
                  ...group,
                  orderItems: Array.isArray(group.orderItems)
                    ? group.orderItems.map((orderItem) =>
                        response.cancelledOrderItemIds.includes(orderItem.id)
                          ? { ...orderItem, status: OrderItemStatus.CANCEL_REQUESTED }
                          : orderItem,
                      )
                    : [],
                }))
              : order.sellerGroups,
            orderItems: Array.isArray(order.orderItems)
              ? order.orderItems.map((orderItem) =>
                  response.cancelledOrderItemIds.includes(orderItem.id)
                    ? { ...orderItem, status: OrderItemStatus.CANCEL_REQUESTED }
                    : orderItem,
                )
              : order.orderItems,
          })),
        )
        showToast.success("Cancellation sent", response.message || successFallbackMessage)
      } catch (error: unknown) {
        if (isAuthHandledError(error)) {
          return
        }

        const status = extractErrorStatus(error)
        const apiErrorMessage = extractApiErrorMessage(error)
        if (isAuthErrorStatus(status)) {
          showToast.error("Authentication required", apiErrorMessage || "Please sign in to cancel this order item.")
          router.push("/login")
          return
        }

        showToast.error(
          "Cancellation failed",
          apiErrorMessage || "Your cancellation request could not be submitted. Please try again.",
        )
      } finally {
        if (options?.cancelingItemId) {
          setCancelingItemId(null)
        }
        if (options?.cancelingSellerKey) {
          setCancelingSellerKey(null)
        }
      }
    },
    [router],
  )

  const confirmPendingCancelAction = useCallback(async () => {
    if (!pendingCancelAction) return

    setIsConfirmingCancel(true)
    try {
      await handleCancelDuringDelivery(
        pendingCancelAction.orderItemIds,
        pendingCancelAction.description,
        pendingCancelAction.options,
      )
    } finally {
      setIsConfirmingCancel(false)
      setPendingCancelAction(null)
    }
  }, [handleCancelDuringDelivery, pendingCancelAction])

  const filteredOrders = useMemo(
    () =>
      orders.filter((order) => {
        const orderItems = getOrderItems(order)
        const statusMatches = statusFilter === "all" ? true : resolveOrderViewStatus(order, orderItems) === statusFilter
        if (!statusMatches) return false

        if (!searchQuery.trim()) return true
        const query = searchQuery.toLowerCase()
        const shipmentAddress = getAddressSummary(
          order.shipmentAddress,
          order.addressTitle,
          order.addressFormattedAddress,
        )
        const billingAddress = getAddressSummary(
          order.billingAddress,
          order.addressTitle,
          order.addressFormattedAddress,
        )
        const payment = resolvePaymentSummary(order)

        return (
          order.orderId.toLowerCase().includes(query) ||
          (order.addressTitle || "").toLowerCase().includes(query) ||
          (order.addressFormattedAddress || "").toLowerCase().includes(query) ||
          shipmentAddress.title.toLowerCase().includes(query) ||
          shipmentAddress.line.toLowerCase().includes(query) ||
          billingAddress.title.toLowerCase().includes(query) ||
          billingAddress.line.toLowerCase().includes(query) ||
          payment.title.toLowerCase().includes(query) ||
          orderItems.some(
            (item) =>
              item.productName.toLowerCase().includes(query) ||
              item.sellerName.toLowerCase().includes(query) ||
              item.sellerSurname.toLowerCase().includes(query),
          )
        )
      }),
    [orders],
  )

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

  const requestCancelAction = useCallback((action: PendingCancelAction) => {
    setPendingCancelAction(action)
  }, [])

  return {
    cancelingItemId,
    cancelingSellerKey,
    confirmPendingCancelAction,
    currentPage,
    dateSortDir,
    expandedState,
    filteredOrders,
    handleDateSortToggle,
    handleExpandedChange,
    handlePageChange,
    handleReorder,
    isAuthenticated,
    isConfirmingCancel,
    isLoading,
    pageSize,
    pendingCancelAction,
    reorderingItemId,
    requestCancelAction,
    setPendingCancelAction,
    setTrackingModalLinks,
    summariesByOrderId,
    totalElements,
    totalPages,
    trackingModalLinks,
  }
}

export type UseBuyerOrdersPageResult = ReturnType<typeof useBuyerOrdersPage>
