"use client"

import type { ExpandedState, OnChangeFn } from "@tanstack/react-table"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { showToast } from "@/components/ui/Toast"
import { extractErrorStatus, isAuthErrorStatus, isAuthHandledError } from "@/lib/api/auth-error"
import {
  type BuyerOrder,
  type BuyerOrderFilterType,
  type BuyerOrderItem,
  type BuyerOrderTrackingLink,
  buyerOrdersAPI,
  type RefundOrderPayload,
} from "@/lib/api/buyer-orders"
import { OrderItemStatus } from "@/lib/constants/order-item-status"
import { useAuthStore } from "@/stores/authStore"
import { useCartStore } from "@/stores/cartStore"
import {
  buildBuyerOrderViewModel,
  extractApiErrorMessage,
  getAddressSummary,
  getOrderItems,
  resolvePaymentSummary,
} from "../lib/order-view-utils"
import type { BuyerOrderLinksModalPayload, BuyerOrderStatusTab, PendingCancelAction } from "../types"

const DEFAULT_PAGE_SIZE = 10
const ORDER_STATUS_TABS = ["All", "Pending", "Shipped", "Delivered", "Cancelled", "Returned"] as const
const ORDER_STATUS_TAB_TO_FILTER_TYPE: Record<BuyerOrderStatusTab, BuyerOrderFilterType> = {
  All: "ALL",
  Pending: "WAITING_FOR_SHIPMENT",
  Shipped: "ON_WAY",
  Delivered: "DELIVERED",
  Cancelled: "CANCELLED",
  Returned: "RETURNED",
}

function isBuyerOrderStatusTab(value: string | null): value is BuyerOrderStatusTab {
  return Boolean(value && ORDER_STATUS_TABS.includes(value as BuyerOrderStatusTab))
}

export function useBuyerOrdersPage() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { isAuthenticated } = useAuthStore()
  const addToCart = useCartStore((state) => state.addToCart)

  const [orders, setOrders] = useState<BuyerOrder[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState<number>(0)
  const [totalPages, setTotalPages] = useState<number>(1)
  const [totalElements, setTotalElements] = useState<number>(0)
  const [sort, setSort] = useState<{ field: "createdDate" | "totalPrice"; dir: "asc" | "desc" }>({
    field: "createdDate",
    dir: "desc",
  })
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null)
  const [trackingModalLinks, setTrackingModalLinks] = useState<
    BuyerOrderLinksModalPayload | BuyerOrderTrackingLink[] | null
  >(null)
  const [pendingRefundOrder, setPendingRefundOrder] = useState<BuyerOrder | null>(null)
  const [isSubmittingRefund, setIsSubmittingRefund] = useState(false)
  const [reorderingItemId, setReorderingItemId] = useState<string | null>(null)
  const [cancelingItemId, setCancelingItemId] = useState<string | null>(null)
  const [cancelingSellerKey, setCancelingSellerKey] = useState<string | null>(null)
  const [pendingCancelAction, setPendingCancelAction] = useState<PendingCancelAction | null>(null)
  const [isConfirmingCancel, setIsConfirmingCancel] = useState(false)

  const pageSize = DEFAULT_PAGE_SIZE
  const searchQuery = ""
  const abortControllerRef = useRef<AbortController | null>(null)

  const selectedTab = useMemo<BuyerOrderStatusTab>(() => {
    const queryValue = searchParams.get("selectedTab")
    if (isBuyerOrderStatusTab(queryValue)) {
      return queryValue
    }
    return "All"
  }, [searchParams])

  const handleTabChange = useCallback(
    (tab: BuyerOrderStatusTab) => {
      const nextParams = new URLSearchParams(searchParams.toString())
      nextParams.set("selectedTab", tab)
      router.replace(`${pathname}?${nextParams.toString()}`, { scroll: false })
      setCurrentPage(0)
      setExpandedOrderId(null)
    },
    [pathname, router, searchParams],
  )

  useEffect(() => {
    const fetchOrders = async () => {
      if (!isAuthenticated) return

      abortControllerRef.current?.abort()
      const controller = new AbortController()
      abortControllerRef.current = controller

      try {
        setIsLoading(true)
        const response = await buyerOrdersAPI.getBuyerOrders(
          currentPage,
          pageSize,
          sort.field,
          sort.dir,
          ORDER_STATUS_TAB_TO_FILTER_TYPE[selectedTab],
          controller.signal,
        )
        setOrders(response.orders)
        setTotalPages(response.totalPages)
        setTotalElements(response.totalElements)
      } catch (error: unknown) {
        if (controller.signal.aborted) return
        if (!isAuthHandledError(error)) {
          showToast.error("Orders unavailable", "Your orders could not be loaded right now. Please try again.")
        }
        setOrders([])
        setTotalPages(0)
        setTotalElements(0)
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false)
        }
      }
    }

    void fetchOrders()

    return () => {
      abortControllerRef.current?.abort()
    }
  }, [isAuthenticated, currentPage, pageSize, sort, selectedTab])

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page)
  }, [])

  const handleSort = useCallback((field: "createdDate" | "totalPrice") => {
    setSort((prev) => ({
      field,
      dir: prev.field === field ? (prev.dir === "desc" ? "asc" : "desc") : "desc",
    }))
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

  const requestRefundAction = useCallback((order: BuyerOrder, orderItem: BuyerOrderItem) => {
    if (typeof orderItem.returnDate === "string" && orderItem.returnDate.trim().length > 0) {
      return
    }

    setPendingRefundOrder({
      ...order,
      orderItems: [orderItem],
      sellerGroups: Array.isArray(order.sellerGroups)
        ? order.sellerGroups
            .map((group) => ({
              ...group,
              orderItems: group.orderItems.filter((item) => item.id === orderItem.id),
            }))
            .filter((group) => group.orderItems.length > 0)
        : order.sellerGroups,
    })
  }, [])

  const submitRefundOrder = useCallback(
    async (payload: RefundOrderPayload) => {
      if (!pendingRefundOrder || payload.items.length === 0) return

      setIsSubmittingRefund(true)
      try {
        const response = await buyerOrdersAPI.refundOrder(payload)
        const refundedItemIds = new Set(payload.items.map((item) => item.orderItemId))
        const refundReasonByOrderItemId = new Map(payload.items.map((item) => [item.orderItemId, item.returnReason]))
        const submittedAt = new Date().toISOString()
        const linksByItemId = new Map((response.itemLinks ?? []).map((link) => [link.orderItemId, link]))

        setOrders((prev) =>
          prev.map((order) => {
            if (order.orderId !== pendingRefundOrder.orderId) {
              return order
            }

            const applyUpdate = (item: BuyerOrderItem) => {
              if (!refundedItemIds.has(item.id)) return item
              const links = linksByItemId.get(item.id)
              return {
                ...item,
                refundStatus: "PENDING",
                returnRefundStatus: "PENDING",
                returnReason: refundReasonByOrderItemId.get(item.id) ?? item.returnReason ?? null,
                returnDate: submittedAt,
                ...(links?.returnTrackingLinks && { returnTrackingLinks: links.returnTrackingLinks }),
                ...(links?.returnShippingLinks && { returnShippingLinks: links.returnShippingLinks }),
              }
            }

            return {
              ...order,
              sellerGroups: Array.isArray(order.sellerGroups)
                ? order.sellerGroups.map((group) => ({
                    ...group,
                    orderItems: Array.isArray(group.orderItems) ? group.orderItems.map(applyUpdate) : [],
                  }))
                : order.sellerGroups,
              orderItems: Array.isArray(order.orderItems) ? order.orderItems.map(applyUpdate) : order.orderItems,
            }
          }),
        )

        showToast.success("Return request sent", response.message || "Your return request was submitted successfully.")
        setPendingRefundOrder(null)
      } catch (error: unknown) {
        if (isAuthHandledError(error)) {
          return
        }

        const status = extractErrorStatus(error)
        const apiErrorMessage = extractApiErrorMessage(error)
        if (isAuthErrorStatus(status)) {
          showToast.error("Authentication required", apiErrorMessage || "Please sign in to request a refund.")
          router.push("/login")
          return
        }

        showToast.error("Return request failed", apiErrorMessage || "Your return request could not be submitted.")
      } finally {
        setIsSubmittingRefund(false)
      }
    },
    [pendingRefundOrder, router],
  )

  return {
    cancelingItemId,
    cancelingSellerKey,
    confirmPendingCancelAction,
    currentPage,
    sortField: sort.field,
    sortDir: sort.dir,
    expandedState,
    filteredOrders,
    handleSort,
    handleExpandedChange,
    handlePageChange,
    handleReorder,
    isSubmittingRefund,
    isAuthenticated,
    isConfirmingCancel,
    isLoading,
    pageSize,
    pendingCancelAction,
    pendingRefundOrder,
    reorderingItemId,
    requestCancelAction,
    requestRefundAction,
    selectedTab,
    submitRefundOrder,
    setPendingCancelAction,
    setPendingRefundOrder,
    setTrackingModalLinks,
    summariesByOrderId,
    totalElements,
    totalPages,
    trackingModalLinks,
    handleTabChange,
  }
}

export type UseBuyerOrdersPageResult = ReturnType<typeof useBuyerOrdersPage>
