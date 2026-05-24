"use client"

import type { ColumnDef, ExpandedState, Row } from "@tanstack/react-table"
import { ChevronDown, ChevronUp, ExternalLink, Loader2, LucideTimer, Package, Store, Truck, X } from "lucide-react"
import { motion, useReducedMotion } from "motion/react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import DataTable from "@/components/ui/data-table"
import Modal from "@/components/ui/Modal"
import { showToast } from "@/components/ui/Toast"
import AddressContactInfo from "@/features/checkout/components/AddressContactInfo"
import ProductImageWithFallback from "@/features/products/listing/components/ProductImageWithFallback"
import { extractErrorStatus, isAuthErrorStatus, isAuthHandledError } from "@/lib/api/auth-error"
import {
  type BuyerOrder,
  type BuyerOrderAddress,
  type BuyerOrderItem,
  type BuyerOrderSellerGroup,
  type BuyerOrderTrackingLink,
  buyerOrdersAPI,
} from "@/lib/api/buyer-orders"
import { getFullImageUrl } from "@/lib/api/products"
import { isCancelableOrderItemStatus, OrderItemStatus } from "@/lib/constants/order-item-status"
import formatCurrency from "@/lib/helpers/formatCurrency"
import { useAuthStore } from "@/stores/authStore"
import { useCartStore } from "@/stores/cartStore"

function resolveOrderItemProductId(item: BuyerOrderItem): string | null {
  const rawItem = item as unknown as Record<string, unknown>

  const directCandidates = [rawItem.productId, rawItem.productID, rawItem.product_id]
  for (const candidate of directCandidates) {
    if (typeof candidate === "string" && candidate.trim().length > 0) {
      return candidate
    }
  }

  const nestedProduct = rawItem.product
  if (nestedProduct && typeof nestedProduct === "object") {
    const nestedProductId = (nestedProduct as Record<string, unknown>).id
    if (typeof nestedProductId === "string" && nestedProductId.trim().length > 0) {
      return nestedProductId
    }
  }

  return null
}

function formatDateTime(value?: string | null): string {
  if (!value) return "-"
  const hasTimeZoneInfo = /[zZ]|[+-]\d{2}:\d{2}$/.test(value)
  const normalizedValue = hasTimeZoneInfo ? value : `${value.replace(" ", "T")}Z`
  const parsed = new Date(normalizedValue)
  if (Number.isNaN(parsed.getTime())) return "-"

  return parsed.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function formatDateOnly(value?: string | null): string {
  if (!value) return "-"
  const hasTimeZoneInfo = /[zZ]|[+-]\d{2}:\d{2}$/.test(value)
  const normalizedValue = hasTimeZoneInfo ? value : `${value.replace(" ", "T")}Z`
  const parsed = new Date(normalizedValue)
  if (Number.isNaN(parsed.getTime())) return "-"

  return parsed.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
  })
}

function formatTimeOnly(value?: string | null): string {
  if (!value) return "-"
  const hasTimeZoneInfo = /[zZ]|[+-]\d{2}:\d{2}$/.test(value)
  const normalizedValue = hasTimeZoneInfo ? value : `${value.replace(" ", "T")}Z`
  const parsed = new Date(normalizedValue)
  if (Number.isNaN(parsed.getTime())) return "-"

  return parsed.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  })
}

function getAddressSummary(
  address: BuyerOrderAddress | undefined,
  fallbackTitle?: string,
  fallbackLine?: string,
): { title: string; line: string } {
  if (!address) {
    return {
      title: fallbackTitle || "-",
      line: fallbackLine || "-",
    }
  }

  return {
    title: address.title || "-",
    line: address.formattedAddress || address.addressLine || "-",
  }
}

function resolveTrackingLinks(item: BuyerOrderItem): BuyerOrderTrackingLink[] {
  if (Array.isArray(item.trackingLinks) && item.trackingLinks.length > 0) {
    return item.trackingLinks.filter((entry) => typeof entry.trackingUrl === "string" && entry.trackingUrl.length > 0)
  }

  if (Array.isArray(item.trackingLink) && item.trackingLink.length > 0) {
    return item.trackingLink
      .filter((url) => typeof url === "string" && url.length > 0)
      .map((url) => ({ trackingUrl: url }))
  }

  return []
}

function getOrderItems(order: BuyerOrder): BuyerOrderItem[] {
  if (Array.isArray(order.orderItems) && order.orderItems.length > 0) {
    return order.orderItems
  }

  if (Array.isArray(order.sellerGroups) && order.sellerGroups.length > 0) {
    return order.sellerGroups.reduce<BuyerOrderItem[]>((items, group) => {
      if (Array.isArray(group.orderItems) && group.orderItems.length > 0) {
        items.push(...group.orderItems)
      }
      return items
    }, [])
  }

  return []
}

function getOrderSellerGroups(order: BuyerOrder): BuyerOrderSellerGroup[] {
  if (Array.isArray(order.sellerGroups) && order.sellerGroups.length > 0) {
    return order.sellerGroups.map((group) => ({
      ...group,
      orderItems: Array.isArray(group.orderItems) ? group.orderItems : [],
    }))
  }

  const legacyItems = Array.isArray(order.orderItems) ? order.orderItems : []
  if (legacyItems.length === 0) return []

  const groupedMap = new Map<string, BuyerOrderSellerGroup>()

  for (const item of legacyItems) {
    const sellerName = item.sellerName || "Seller"
    const sellerSurname = item.sellerSurname || ""
    const key = `${sellerName}::${sellerSurname}`

    if (!groupedMap.has(key)) {
      groupedMap.set(key, {
        sellerId: key,
        sellerName,
        sellerSurname,
        cancellationShipmentFee: null,
        cancellationShipmentRefundFee: null,
        orderItems: [],
      })
    }

    groupedMap.get(key)?.orderItems.push(item)
  }

  return Array.from(groupedMap.values())
}

function resolvePaymentSummary(order: BuyerOrder): { title: string; detail: string } {
  if (order.cardBrand && order.cardLast4) {
    const brand = order.cardBrand.toUpperCase()
    const expiration =
      order.cardExpMonth && order.cardExpYear
        ? `Exp ${String(order.cardExpMonth).padStart(2, "0")}/${order.cardExpYear}`
        : ""
    return {
      title: `${brand} •••• ${order.cardLast4}`,
      detail: [order.cardName || "", expiration].filter(Boolean).join(" • ") || "Card payment",
    }
  }

  if (order.cardName) {
    return { title: order.cardName, detail: "Card payment" }
  }

  return { title: "-", detail: "" }
}

type OrderViewStatus = "processing" | "shipped" | "delivered" | "shipping"

function resolveOrderViewStatus(order: BuyerOrder, orderItems: BuyerOrderItem[]): OrderViewStatus {
  const normalizedOrderStatus = order.orderStatus.toUpperCase()
  const itemStatuses = orderItems.map((item) => item.status.toUpperCase())

  if (normalizedOrderStatus.includes("DELIVERED") || itemStatuses.some((status) => status.includes("DELIVERED"))) {
    return "delivered"
  }

  if (itemStatuses.some((status) => status.includes("ON_WAY"))) {
    return "shipping"
  }

  if (
    normalizedOrderStatus.includes("SHIPPED") ||
    itemStatuses.some((status) =>
      ["SHIPPED", "IN_TRANSIT", "OUT_FOR_DELIVERY", "DELIVERY"].some((token) => status.includes(token)),
    )
  ) {
    return "shipped"
  }

  return "processing"
}

function getOrderStatusBadgeClasses(status: OrderViewStatus): string {
  if (status === "delivered") {
    return "border border-success/40 bg-success/15 text-success"
  }

  if (status === "shipped") {
    return "border border-brand/40 bg-brand/15 text-brand"
  }

  return "border border-warning/40 bg-warning/15 text-warning"
}

function getOrderStatusLabel(status: OrderViewStatus): string {
  if (status === "delivered") return "Delivered"
  if (status === "shipped") return "Shipped"
  if (status === "shipping") return "Shipping"
  return "Processing"
}

type PaymentViewStatus = "paid" | "pending" | "failed" | "refunded" | "unknown"

function resolvePaymentViewStatus(orderStatus: string): PaymentViewStatus {
  const normalized = orderStatus.toUpperCase()
  if (normalized.includes("REFUND")) return "refunded"
  if (normalized.includes("FAIL")) return "failed"
  if (normalized.includes("SUCCESS") || normalized.includes("PAID")) return "paid"
  if (normalized.includes("PENDING") || normalized.includes("PROCESS")) return "pending"
  return "unknown"
}

function getPaymentViewStatusLabel(status: PaymentViewStatus): string {
  if (status === "paid") return "Paid"
  if (status === "pending") return "Pending"
  if (status === "failed") return "Failed"
  if (status === "refunded") return "Refunded"
  return "Unknown"
}

function getPaymentViewStatusClasses(status: PaymentViewStatus): string {
  if (status === "paid") return "border border-success/35 bg-success/10 text-success"
  if (status === "failed") return "border border-danger/35 bg-danger/10 text-danger"
  if (status === "refunded") return "border border-brand/35 bg-brand/12 text-brand"
  if (status === "pending") return "border border-warning/35 bg-warning/10 text-warning"
  return "border border-border-soft bg-surface-muted text-text-muted"
}

function getSellerSummary(sellerGroups: BuyerOrderSellerGroup[]): { primarySeller: string; moreCount: number } {
  if (sellerGroups.length === 0) {
    return { primarySeller: "Unknown Seller", moreCount: 0 }
  }

  const [firstSeller, ...remainingSellers] = sellerGroups
  const primarySeller = [firstSeller.sellerName, firstSeller.sellerSurname].filter(Boolean).join(" ").trim() || "Seller"

  return { primarySeller, moreCount: remainingSellers.length }
}

function getTrackingLinkCount(orderItems: BuyerOrderItem[]): number {
  const linkSet = new Set<string>()

  for (const item of orderItems) {
    for (const link of resolveTrackingLinks(item)) {
      if (link.trackingUrl) {
        linkSet.add(link.trackingUrl)
      }
    }
  }

  return linkSet.size
}

function resolveOrderMoneyBreakdown(
  itemTotal: number,
  shippingTotal: number,
  explicitTotal?: number,
): {
  tax: number
  netTotal: number
} {
  const baseTotal = itemTotal + shippingTotal
  const netTotal = typeof explicitTotal === "number" && Number.isFinite(explicitTotal) ? explicitTotal : baseTotal

  if (netTotal < baseTotal) {
    return { tax: 0, netTotal }
  }

  if (netTotal > baseTotal) {
    return { tax: netTotal - baseTotal, netTotal }
  }

  return { tax: 0, netTotal }
}

type FulfillmentStepState = "pending" | "active" | "done"

function resolveOrderItemFulfillmentState(item: BuyerOrderItem): {
  processing: FulfillmentStepState
  shipping: FulfillmentStepState
  delivered: FulfillmentStepState
} {
  const normalizedStatus = item.status.toUpperCase()
  const isCancelled =
    Boolean(item.cancelledByCustomer) || Boolean(item.cancelledBySeller) || normalizedStatus.includes("CANCEL")
  const isCancelledDuringShipping = isCancelled && Boolean(item.cancelledWithShippingFee)

  if (normalizedStatus.includes("DELIVER")) {
    return { processing: "done", shipping: "done", delivered: "done" }
  }

  const isOnWay = normalizedStatus.includes("ON_WAY")
  const isShipped =
    isOnWay ||
    ["SHIPPED", "IN_TRANSIT", "OUT_FOR_DELIVERY", "DELIVERY"].some((token) => normalizedStatus.includes(token))

  if (isOnWay) {
    return { processing: "done", shipping: "active", delivered: "pending" }
  }

  if (isShipped) {
    return { processing: "done", shipping: "done", delivered: "pending" }
  }

  if (isCancelledDuringShipping) {
    return { processing: "done", shipping: "done", delivered: "pending" }
  }

  if (isCancelled) {
    return { processing: "done", shipping: "pending", delivered: "pending" }
  }

  return { processing: "active", shipping: "pending", delivered: "pending" }
}

function getTimelineDotClass(state: FulfillmentStepState): string {
  if (state === "done") return "bg-success"
  if (state === "active") return "bg-warning animate-pulse"
  return "bg-border-soft"
}

function getTimelineLabelClass(state: FulfillmentStepState): string {
  if (state === "done") return "text-success"
  if (state === "active") return "text-warning"
  return "text-text-muted"
}

function getRefundTimelineClass(refundStatus: string): { dot: string; label: string } {
  const normalizedStatus = refundStatus.toUpperCase()

  if (normalizedStatus === "APPROVED") {
    return { dot: "bg-success", label: "text-success" }
  }

  if (normalizedStatus === "CANCELLED") {
    return { dot: "bg-danger", label: "text-danger" }
  }

  return { dot: "bg-warning animate-pulse", label: "text-warning" }
}

function getSellerFirstTwoLetters(value: string): string {
  const words = value
    .split(/\s+/)
    .map((word) => word.trim())
    .filter(Boolean)

  if (words.length === 0) return "SE"
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase()

  return `${words[0][0] ?? ""}${words[1][0] ?? ""}`.toUpperCase()
}

function getOrderItemStatusTagClass(status: string): string {
  const normalizedStatus = status.toUpperCase()

  if (normalizedStatus.includes("CANCEL")) {
    return "border border-danger/40 bg-danger/15 text-danger"
  }
  if (normalizedStatus.includes("DELIVER")) {
    return "border border-success/40 bg-success/15 text-success"
  }
  if (normalizedStatus.includes("SHIP")) {
    return "border border-brand/40 bg-brand/15 text-brand"
  }
  if (normalizedStatus.includes("REFUND") || normalizedStatus.includes("RETURN")) {
    return "border border-brand/40 bg-brand/15 text-brand"
  }

  return "border border-warning/40 bg-warning/15 text-warning"
}

function formatOrderItemStatus(status: string): string {
  return status
    .toLowerCase()
    .split("_")
    .map((part) => (part ? `${part[0].toUpperCase()}${part.slice(1)}` : ""))
    .join(" ")
}

function formatRefundStatus(refundStatus: string): string {
  const normalizedStatus = refundStatus.toUpperCase()
  if (normalizedStatus === "APPROVED") return "Refund Approved"
  if (normalizedStatus === "CANCELLED") return "Refund Cancelled"
  if (normalizedStatus === "PENDING") return "Refund Pending"
  return `Refund ${formatOrderItemStatus(refundStatus)}`
}

function getOrderItemShipmentFee(item: BuyerOrderItem): number {
  if (item.shipmentFreeBySeller) return 0
  const shipmentUnitPrice = typeof item.shipmentPrice === "number" ? item.shipmentPrice : 0
  return shipmentUnitPrice * item.quantity
}

interface BuyerOrderViewModel {
  customerLabel: string
  itemTotal: number
  lineItemCount: number
  money: {
    netTotal: number
    tax: number
  }
  orderDate: string
  orderItems: BuyerOrderItem[]
  orderTime: string
  payment: {
    detail: string
    title: string
  }
  paymentStatus: PaymentViewStatus
  sellerCount: number
  sellerGroups: BuyerOrderSellerGroup[]
  sellerSummary: {
    moreCount: number
    primarySeller: string
  }
  shippingAddress: {
    line: string
    title: string
  }
  shippingTotal: number
  totalAmountFromItemPrices: number
  totalQuantity: number
  trackingCount: number
  uiStatus: OrderViewStatus
}

function buildBuyerOrderViewModel(order: BuyerOrder): BuyerOrderViewModel {
  const shippingAddress = getAddressSummary(order.shipmentAddress, order.addressTitle, order.addressFormattedAddress)
  const payment = resolvePaymentSummary(order)
  const orderItems = getOrderItems(order)
  const sellerGroups = getOrderSellerGroups(order)
  const uiStatus = resolveOrderViewStatus(order, orderItems)
  const paymentStatus = resolvePaymentViewStatus(order.orderStatus)
  const totalQuantity = orderItems.reduce((sum, item) => sum + item.quantity, 0)
  const orderDate = formatDateOnly(order.createdDate)
  const orderTime = formatTimeOnly(order.createdDate)
  const sellerCount = sellerGroups.length
  const sellerSummary = getSellerSummary(sellerGroups)
  const trackingCount = getTrackingLinkCount(orderItems)
  const customerLabel = order.shipmentAddress?.fullName || payment.title || "Customer"
  const shippingTotal = orderItems.reduce((sum, item) => sum + getOrderItemShipmentFee(item), 0)
  const totalAmountFromItemPrices = orderItems.reduce((sum, item) => sum + item.price, 0)
  const itemTotal = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const money = resolveOrderMoneyBreakdown(itemTotal, shippingTotal, order.totalPrice)
  const lineItemCount = orderItems.length

  return {
    customerLabel,
    itemTotal,
    lineItemCount,
    money,
    orderDate,
    orderItems,
    orderTime,
    payment,
    paymentStatus,
    sellerCount,
    sellerGroups,
    sellerSummary,
    shippingAddress,
    shippingTotal,
    totalAmountFromItemPrices,
    totalQuantity,
    trackingCount,
    uiStatus,
  }
}

function extractApiErrorMessage(error: unknown): string | null {
  if (!error || typeof error !== "object") return null

  const maybeError = error as {
    message?: unknown
    response?: { data?: unknown }
  }

  const data = maybeError.response?.data
  if (typeof data === "string" && data.trim()) {
    return data
  }

  if (data && typeof data === "object") {
    const payload = data as { message?: unknown; error?: unknown }

    if (typeof payload.message === "string" && payload.message.trim()) {
      return payload.message
    }

    if (typeof payload.error === "string" && payload.error.trim()) {
      if (payload.error.startsWith("{")) {
        try {
          const nested = JSON.parse(payload.error) as { message?: unknown; error?: unknown }
          if (typeof nested.message === "string" && nested.message.trim()) {
            return nested.message
          }
          if (typeof nested.error === "string" && nested.error.trim()) {
            return nested.error
          }
        } catch {
          // ignore invalid nested JSON
        }
      }

      return payload.error
    }
  }

  if (typeof maybeError.message === "string" && maybeError.message.trim()) {
    return maybeError.message
  }

  return null
}

interface PendingCancelAction {
  description: string
  orderItemIds: string[]
  options?: { cancelingItemId?: string; cancelingSellerKey?: string }
}

export default function BuyerOrdersPage() {
  const router = useRouter()
  const prefersReducedMotion = useReducedMotion()
  const { isAuthenticated } = useAuthStore()
  const addToCart = useCartStore((state) => state.addToCart)
  const [orders, setOrders] = useState<BuyerOrder[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery] = useState("")
  const [statusFilter] = useState<"all" | OrderViewStatus>("all")
  const [pageSize, _setPageSize] = useState<number>(10)
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

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const handleDateSortToggle = useCallback(() => {
    setDateSortDir((prev) => (prev === "desc" ? "asc" : "desc"))
    setCurrentPage(0)
  }, [])

  const handleReorder = async (userProductId: string, quantity: number, productName: string) => {
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
  }

  const handleCancelDuringDelivery = async (
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
  }

  const confirmPendingCancelAction = async () => {
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
  }

  const filteredOrders = orders.filter((order) => {
    const orderItems = getOrderItems(order)
    const statusMatches = statusFilter === "all" ? true : resolveOrderViewStatus(order, orderItems) === statusFilter
    if (!statusMatches) return false

    if (!searchQuery.trim()) return true
    const query = searchQuery.toLowerCase()
    const shipmentAddress = getAddressSummary(order.shipmentAddress, order.addressTitle, order.addressFormattedAddress)
    const billingAddress = getAddressSummary(order.billingAddress, order.addressTitle, order.addressFormattedAddress)
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
  })

  const expandedState = useMemo<ExpandedState>(
    () => (expandedOrderId ? { [expandedOrderId]: true } : {}),
    [expandedOrderId],
  )

  const orderColumns = useMemo<Array<ColumnDef<BuyerOrder, unknown>>>(
    () => [
      {
        id: "expander",
        header: () => null,
        cell: ({ row }) => (
          <Button
            type="button"
            variant="unstyled"
            onClick={() => row.toggleExpanded()}
            className="inline-flex items-center rounded-full border border-border-soft p-1.5! text-text-muted hover:bg-surface-muted hover:text-text-secondary"
          >
            {row.getIsExpanded() ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        ),
        meta: {
          cellClassName: "px-4 py-4 text-text-muted",
          headerClassName: "w-12 px-4 py-4",
        },
      },
      {
        id: "date",
        header: () => (
          <Button
            type="button"
            variant="unstyled"
            onClick={handleDateSortToggle}
            className="inline-flex items-center gap-1 text-xs font-semibold tracking-wider text-text-muted uppercase hover:text-text-secondary"
            aria-label={`Sort by date ${dateSortDir === "desc" ? "ascending" : "descending"}`}
          >
            Date
            {dateSortDir === "desc" ? <ChevronDown className="h-3 w-3" /> : <ChevronUp className="h-3 w-3" />}
          </Button>
        ),
        cell: ({ row }) => {
          const summary = buildBuyerOrderViewModel(row.original)
          return (
            <>
              <p>{summary.orderDate}</p>
              <p className="text-xs">{summary.orderTime}</p>
            </>
          )
        },
        meta: {
          cellClassName: "px-6 py-4 text-text-muted",
          headerClassName: "px-6 py-4",
        },
      },
      {
        id: "seller",
        header: () => "Seller / Store",
        cell: ({ row }) => {
          const summary = buildBuyerOrderViewModel(row.original)
          return (
            <>
              <p className="inline-flex items-center gap-1.5 font-medium text-text-primary">
                <Store className="h-3.5 w-3.5 text-brand" />
                {summary.sellerSummary.primarySeller}
              </p>
              {summary.sellerSummary.moreCount > 0 ? (
                <p className="text-xs text-text-muted">+{summary.sellerSummary.moreCount} more seller(s)</p>
              ) : null}
            </>
          )
        },
      },
      {
        id: "items",
        header: () => "Items",
        cell: ({ row }) => {
          const summary = buildBuyerOrderViewModel(row.original)
          return (
            <div>
              <p className="inline-flex items-center gap-1.5 text-text-primary">
                <Package className="h-3.5 w-3.5 text-brand" />
                <span className="font-semibold">
                  {summary.totalQuantity} item{summary.totalQuantity > 1 ? "s" : ""}
                </span>
              </p>
              <p className="text-xs text-text-muted">{summary.lineItemCount} line item(s)</p>
            </div>
          )
        },
      },
      {
        id: "paymentMethod",
        header: () => "Payment Method",
        cell: ({ row }) => {
          const summary = buildBuyerOrderViewModel(row.original)
          return (
            <>
              <p className="font-medium text-text-primary">{summary.payment.title}</p>
              {summary.payment.detail ? <p className="text-xs text-text-muted">{summary.payment.detail}</p> : null}
            </>
          )
        },
        meta: {
          cellClassName: "border-l-2 border-border-soft px-6 py-4 text-text-secondary",
          headerClassName: "border-l-2 border-border-soft px-6 py-4",
        },
      },
      {
        id: "paymentStatus",
        header: () => "Payment Status",
        cell: ({ row }) => {
          const summary = buildBuyerOrderViewModel(row.original)
          return (
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${getPaymentViewStatusClasses(summary.paymentStatus)}`}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-current" />
              {getPaymentViewStatusLabel(summary.paymentStatus)}
            </span>
          )
        },
      },
      {
        id: "shipmentStatus",
        header: () => "Shipment Status",
        cell: ({ row }) => {
          const summary = buildBuyerOrderViewModel(row.original)
          return (
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${getOrderStatusBadgeClasses(summary.uiStatus)}`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  summary.uiStatus === "delivered"
                    ? "bg-success"
                    : summary.uiStatus === "shipped"
                      ? "bg-brand"
                      : "bg-warning"
                }`}
              />
              {getOrderStatusLabel(summary.uiStatus)}
            </span>
          )
        },
        meta: {
          cellClassName: "border-l-2 border-border-soft px-6 py-4",
          headerClassName: "border-l-2 border-border-soft px-6 py-4",
        },
      },
      {
        id: "tracking",
        header: () => "Tracking",
        cell: ({ row }) => {
          const summary = buildBuyerOrderViewModel(row.original)
          return summary.trackingCount > 0 ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-brand/35 bg-brand/10 px-2.5 py-1 text-xs font-medium text-brand">
              <Truck className="h-3 w-3" />
              {summary.trackingCount} link{summary.trackingCount > 1 ? "s" : ""}
            </span>
          ) : (
            <span className="text-xs text-text-muted">No tracking yet</span>
          )
        },
      },
      {
        id: "netTotal",
        header: () => "Net Total",
        cell: ({ row }) => {
          const summary = buildBuyerOrderViewModel(row.original)
          return <p>{formatCurrency(summary.money.netTotal)}</p>
        },
        meta: {
          cellClassName: "border-l-2 border-border-soft px-6 py-4 text-right font-semibold text-text-primary",
          headerClassName: "border-l-2 border-border-soft px-6 py-4 text-right",
        },
      },
      {
        id: "shipmentFee",
        header: () => "Shipment Fee",
        cell: ({ row }) => {
          const summary = buildBuyerOrderViewModel(row.original)
          return <p className="text-3sm">{formatCurrency(summary.shippingTotal)}</p>
        },
        meta: {
          cellClassName: "px-6 py-4 text-right font-medium text-text-primary",
          headerClassName: "px-6 py-4 text-right",
        },
      },
    ],
    [dateSortDir, handleDateSortToggle],
  )

  const renderExpandedOrderContent = (row: Row<BuyerOrder>) => {
    const order = row.original
    const summary = buildBuyerOrderViewModel(order)

    return (
      <div className="bg-surface-muted/55 p-6 shadow-inner">
        <div className="mb-4 flex items-center gap-2">
          <h4 className="text-xl font-semibold text-text-primary">Order Items</h4>
          <p className="text-sm font-medium text-text-muted">
            ({summary.totalQuantity} items from {summary.sellerCount} seller{summary.sellerCount > 1 ? "s" : ""})
          </p>
        </div>
        <div className="flex gap-8 rounded-xl border border-border-soft bg-surface-elevated p-6 lg:flex-row">
          <div className="flex-1">
            <div className="space-y-6">
              {summary.sellerGroups.map((group) => {
                const sellerDisplayName = [group.sellerName, group.sellerSurname].filter(Boolean).join(" ").trim()
                const sellerTotal = group.orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
                const sellerItemCount = group.orderItems.reduce((sum, item) => sum + item.quantity, 0)
                const cancelableItemIds = group.orderItems
                  .filter((item) => isCancelableOrderItemStatus(item.status))
                  .map((item) => item.id)
                const hasCancelableItems = cancelableItemIds.length > 0
                const sellerKey = `${order.orderId}:${group.sellerId}`
                const isCancelingSellerGroup = cancelingSellerKey === sellerKey

                return (
                  <section key={group.sellerId} className="overflow-hidden rounded-xl border border-border-soft">
                    <div className="flex items-center justify-between border-b border-border-soft bg-linear-to-r from-surface-muted/45 to-surface-muted/75 px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand text-xs font-bold text-primary-foreground shadow-sm">
                          {getSellerFirstTwoLetters(sellerDisplayName)}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-text-primary">{sellerDisplayName || "Seller"}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-text-primary">{formatCurrency(sellerTotal)}</p>
                        <p className="text-xs text-text-muted">
                          {sellerItemCount} item{sellerItemCount > 1 ? "s" : ""}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-3 bg-surface-elevated p-3">
                      {group.orderItems.map((item) => {
                        const productId = resolveOrderItemProductId(item)
                        const productHref = productId
                          ? `/products/${encodeURIComponent(productId)}?vendorId=${encodeURIComponent(item.userProductId)}`
                          : null
                        const trackingLinks = resolveTrackingLinks(item)

                        return (
                          <div
                            key={item.id}
                            className="rounded-lg border border-border-soft bg-surface-muted/30 p-3 transition-colors hover:border-border-soft"
                          >
                            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_240px]">
                              <div className="flex items-start gap-4">
                                <div className="h-12 w-12 shrink-0 overflow-hidden rounded-md bg-surface-elevated shadow-sm">
                                  <ProductImageWithFallback
                                    src={
                                      getFullImageUrl(item.productCoverPhotoPath) || "/dentypro-product-placeholder.png"
                                    }
                                    alt={item.productName}
                                    width={48}
                                    height={48}
                                    className="h-full w-full object-cover"
                                  />
                                </div>
                                <div className="relative h-full min-w-0 flex-1">
                                  <p className="max-w-96 mb-2 text-sm font-medium text-text-primary">
                                    {productHref ? (
                                      <Link href={productHref} className="transition-colors hover:text-brand">
                                        {item.productName}
                                      </Link>
                                    ) : (
                                      item.productName
                                    )}
                                  </p>
                                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-text-muted">
                                    <span className="rounded bg-surface-muted px-2 py-0.5">
                                      Qty: {item.quantity} unit{item.quantity > 1 ? "s" : ""}
                                    </span>
                                    {!item.cancelledByCustomer && !item.cancelledBySeller ? (
                                      <>
                                        <span>•</span>
                                        <span
                                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${getOrderItemStatusTagClass(item.status)}`}
                                        >
                                          {formatOrderItemStatus(item.status)}
                                        </span>
                                      </>
                                    ) : null}
                                    <span>•</span>
                                    <span className="font-semibold text-text-primary">
                                      {item.price * item.quantity === 0
                                        ? "FREE"
                                        : formatCurrency(item.price * item.quantity)}
                                    </span>
                                    {item.quantity > 1 ? (
                                      <span className="text-[11px] text-text-muted">
                                        ({formatCurrency(item.price)} each)
                                      </span>
                                    ) : null}
                                    <span>•</span>
                                    {item.shipmentFreeBySeller ? (
                                      <span className="font-semibold text-success">Free Shipping</span>
                                    ) : (
                                      <span className="font-semibold text-text-secondary">
                                        Shipment Fee: {formatCurrency(getOrderItemShipmentFee(item))}
                                      </span>
                                    )}
                                  </div>
                                  <div className="absolute bottom-0 left-0 flex w-full flex-wrap items-center gap-2 border-t border-border-soft pt-3">
                                    <Button
                                      type="button"
                                      variant="unstyled"
                                      onClick={() => handleReorder(item.userProductId, item.quantity, item.productName)}
                                      disabled={
                                        reorderingItemId === item.userProductId ||
                                        cancelingItemId === item.id ||
                                        isCancelingSellerGroup
                                      }
                                      className="rounded-md bg-success px-2.5 py-1 text-[11px] font-semibold text-primary-foreground hover:bg-success/80 disabled:opacity-70"
                                    >
                                      {reorderingItemId === item.userProductId ? "Adding..." : "Reorder"}
                                    </Button>
                                    {isCancelableOrderItemStatus(item.status) ? (
                                      <Button
                                        type="button"
                                        variant="unstyled"
                                        onClick={() =>
                                          setPendingCancelAction({
                                            orderItemIds: [item.id],
                                            description: `${item.productName} cancellation request was submitted.`,
                                            options: { cancelingItemId: item.id },
                                          })
                                        }
                                        disabled={
                                          cancelingItemId === item.id ||
                                          reorderingItemId === item.userProductId ||
                                          isCancelingSellerGroup
                                        }
                                        className="rounded-md border border-danger/40 bg-danger/15 px-2.5 py-1 text-[11px] font-semibold text-danger hover:bg-danger/25 disabled:opacity-70"
                                      >
                                        {cancelingItemId === item.id ? "Canceling..." : "Cancel Item"}
                                      </Button>
                                    ) : null}
                                    {trackingLinks.length > 0 ? (
                                      <Button
                                        type="button"
                                        variant="unstyled"
                                        onClick={() => setTrackingModalLinks(trackingLinks)}
                                        className="inline-flex items-center gap-1 rounded-md border border-success/40 bg-success/15 px-2.5 py-1 text-[11px] font-semibold text-success hover:bg-success/25"
                                      >
                                        Track
                                        <ExternalLink className="h-3 w-3" />
                                      </Button>
                                    ) : null}
                                  </div>
                                </div>
                              </div>
                              <div className="rounded-lg border border-border-soft bg-surface-elevated p-3">
                                {(() => {
                                  const timelineState = resolveOrderItemFulfillmentState(item)
                                  const cancellationLabel = item.cancelledByCustomer
                                    ? "Cancelled by Customer"
                                    : item.cancelledBySeller
                                      ? "Cancelled by Seller"
                                      : null
                                  const isCancelledDuringShipping =
                                    Boolean(cancellationLabel) && Boolean(item.cancelledWithShippingFee)
                                  const shippingDotClass = isCancelledDuringShipping
                                    ? "bg-danger"
                                    : getTimelineDotClass(timelineState.shipping)
                                  const shippingLabelClass = isCancelledDuringShipping
                                    ? "text-danger"
                                    : getTimelineLabelClass(timelineState.shipping)
                                  const cancellationDotClass = "bg-danger"
                                  const cancellationLabelClass = "text-danger"
                                  const refundTimeline = item.refundStatus
                                    ? getRefundTimelineClass(item.refundStatus)
                                    : null
                                  let timelineStepIndex = 0
                                  const getTimelineStepMotionProps = () => {
                                    if (prefersReducedMotion) return {}

                                    const expandPanelDuration = 0.32
                                    const expandPanelBuffer = 0.03
                                    const delay = expandPanelDuration + expandPanelBuffer + timelineStepIndex * 0.07
                                    timelineStepIndex += 1

                                    return {
                                      initial: { opacity: 0, y: -10 },
                                      animate: { opacity: 1, y: 0 },
                                      transition: {
                                        duration: 0.24,
                                        delay,
                                        ease: [0.22, 1, 0.36, 1] as const,
                                      },
                                    }
                                  }

                                  return (
                                    <>
                                      <div className="mb-2 flex items-start gap-2">
                                        <div className="flex items-center gap-1.5 text-xs font-semibold text-text-secondary">
                                          <LucideTimer className="h-3.5 w-3.5 text-success" />
                                          Fulfillment
                                        </div>
                                      </div>
                                      <div className="relative space-y-2.5 ps-0.5 before:absolute before:top-2 before:bottom-2 before:left-[7px] before:w-0.5 before:bg-border-soft before:content-['']">
                                        <motion.div
                                          {...getTimelineStepMotionProps()}
                                          className="relative z-10 flex items-start gap-2.5"
                                        >
                                          <div className="h-3.5 w-3.5 rounded-full border-2 border-surface-elevated bg-success shadow-sm" />
                                          <div>
                                            <p className="text-xs font-semibold text-success">Order Placed</p>
                                            <p className="text-[11px] text-text-muted">
                                              {summary.orderDate}, {summary.orderTime}
                                            </p>
                                          </div>
                                        </motion.div>
                                        <motion.div
                                          {...getTimelineStepMotionProps()}
                                          className="relative z-10 flex items-start gap-2.5"
                                        >
                                          <div
                                            className={`h-3.5 w-3.5 rounded-full border-2 border-surface-elevated shadow-sm ${getTimelineDotClass(timelineState.processing)}`}
                                          />
                                          <p
                                            className={`text-xs font-medium ${getTimelineLabelClass(timelineState.processing)}`}
                                          >
                                            Processing
                                          </p>
                                        </motion.div>
                                        {cancellationLabel && !isCancelledDuringShipping ? (
                                          <motion.div
                                            {...getTimelineStepMotionProps()}
                                            className="relative z-10 flex items-start gap-2.5"
                                          >
                                            <div
                                              className={`h-3.5 w-3.5 rounded-full border-2 border-surface-elevated shadow-sm ${cancellationDotClass}`}
                                            />
                                            <p className={`text-xs font-medium ${cancellationLabelClass}`}>
                                              {cancellationLabel}
                                            </p>
                                          </motion.div>
                                        ) : null}
                                        {item.refundStatus && refundTimeline && !isCancelledDuringShipping ? (
                                          <motion.div
                                            {...getTimelineStepMotionProps()}
                                            className="relative z-10 flex items-start gap-2.5"
                                          >
                                            <div
                                              className={`h-3.5 w-3.5 rounded-full border-2 border-surface-elevated shadow-sm ${refundTimeline.dot}`}
                                            />
                                            <p className={`text-xs font-medium ${refundTimeline.label}`}>
                                              {formatRefundStatus(item.refundStatus)}
                                            </p>
                                          </motion.div>
                                        ) : null}
                                        {!cancellationLabel || isCancelledDuringShipping ? (
                                          <motion.div
                                            {...getTimelineStepMotionProps()}
                                            className="relative z-10 flex items-start gap-2.5"
                                          >
                                            <div
                                              className={`h-3.5 w-3.5 rounded-full border-2 border-surface-elevated shadow-sm ${shippingDotClass}`}
                                            />
                                            <p className={`text-xs font-medium ${shippingLabelClass}`}>Shipping</p>
                                          </motion.div>
                                        ) : null}
                                        {cancellationLabel && isCancelledDuringShipping ? (
                                          <motion.div
                                            {...getTimelineStepMotionProps()}
                                            className="relative z-10 flex items-start gap-2.5"
                                          >
                                            <div
                                              className={`h-3.5 w-3.5 rounded-full border-2 border-surface-elevated shadow-sm ${cancellationDotClass}`}
                                            />
                                            <p className={`text-xs font-medium ${cancellationLabelClass}`}>
                                              {cancellationLabel}
                                            </p>
                                          </motion.div>
                                        ) : null}
                                        {item.refundStatus && refundTimeline && isCancelledDuringShipping ? (
                                          <motion.div
                                            {...getTimelineStepMotionProps()}
                                            className="relative z-10 flex items-start gap-2.5"
                                          >
                                            <div
                                              className={`h-3.5 w-3.5 rounded-full border-2 border-surface-elevated shadow-sm ${refundTimeline.dot}`}
                                            />
                                            <p className={`text-xs font-medium ${refundTimeline.label}`}>
                                              {formatRefundStatus(item.refundStatus)}
                                            </p>
                                          </motion.div>
                                        ) : null}
                                        {!cancellationLabel ? (
                                          <motion.div
                                            {...getTimelineStepMotionProps()}
                                            className="relative z-10 flex items-start gap-2.5"
                                          >
                                            <div
                                              className={`h-3.5 w-3.5 rounded-full border-2 border-surface-elevated shadow-sm ${getTimelineDotClass(timelineState.delivered)}`}
                                            />
                                            <p
                                              className={`text-xs font-medium ${getTimelineLabelClass(timelineState.delivered)}`}
                                            >
                                              Delivered
                                            </p>
                                          </motion.div>
                                        ) : null}
                                      </div>
                                    </>
                                  )
                                })()}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>

                    <div className="flex items-center justify-between border-t border-border-soft bg-surface-muted/55 px-4 py-3 text-sm text-text-muted">
                      <span>Updated: {formatDateTime(group.orderItems[0]?.updatedDate)}</span>
                      {hasCancelableItems ? (
                        <Button
                          type="button"
                          variant="unstyled"
                          onClick={() =>
                            setPendingCancelAction({
                              orderItemIds: cancelableItemIds,
                              description: `${sellerDisplayName} items cancellation request was submitted.`,
                              options: { cancelingSellerKey: sellerKey },
                            })
                          }
                          disabled={isCancelingSellerGroup}
                          className="rounded-md border border-danger/40 bg-danger/15 px-2.5 py-1 text-[11px] font-semibold text-danger hover:bg-danger/25 disabled:opacity-70"
                        >
                          {isCancelingSellerGroup ? "Canceling items..." : `Cancel All Items from ${sellerDisplayName}`}
                        </Button>
                      ) : null}
                    </div>
                  </section>
                )
              })}
            </div>
          </div>

          <div className="flex w-full flex-col gap-6 lg:w-80">
            <div className="rounded-lg border border-border-soft bg-surface-muted/55 p-4">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-text-muted">
                  <span>Subtotal</span>
                  <span className="text-text-primary">{formatCurrency(summary.itemTotal)}</span>
                </div>
                <div className="flex justify-between text-text-muted">
                  <span>Shipping</span>
                  <span className="text-text-primary">
                    {summary.shippingTotal > 0 ? formatCurrency(summary.shippingTotal) : "FREE"}
                  </span>
                </div>
                <div className="mt-2 flex justify-between border-t border-border-soft pt-2 font-semibold">
                  <span className="text-text-primary">Total</span>
                  <span className="text-text-primary">
                    {formatCurrency(summary.totalAmountFromItemPrices + summary.shippingTotal)}
                  </span>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-border-soft bg-surface-muted/55 p-4">
              <h4 className="mb-3 text-sm font-semibold text-text-primary">Customer Details</h4>
              <p className="text-sm font-semibold text-text-secondary">
                {order.shipmentAddress?.fullName || summary.customerLabel}
              </p>
              <AddressContactInfo
                className="mt-2"
                address={summary.shippingAddress.line}
                phone={order.shipmentAddress?.phoneNumber}
              />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas">
        <p className="text-text-secondary">Please log in to view your orders.</p>
      </div>
    )
  }

  return (
    <>
      {/* Page Header */}
      <section className="mb-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-text-primary">Your Orders</h1>
            <p className="mt-1 text-text-secondary">Track and review all orders placed from your account</p>
          </div>
        </div>
      </section>

      {/* Orders Table */}
      <section className="overflow-hidden rounded-2xl border border-border-soft bg-surface-elevated shadow-soft">
        <div className="overflow-x-auto">
          <DataTable
            columns={orderColumns}
            data={filteredOrders}
            expanded={expandedState}
            getRowClassName={(row) =>
              `cursor-pointer transition-colors hover:bg-surface-muted/55 ${
                row.getIsExpanded() ? "bg-surface-muted/40" : ""
              }`
            }
            getRowId={(order) => order.orderId}
            isLoading={isLoading}
            loadingText="Loading orders..."
            minTableWidthClassName="min-w-[1380px]"
            noRowsText="No orders found."
            onExpandedChange={(nextExpanded) => {
              const resolvedExpanded = typeof nextExpanded === "function" ? nextExpanded(expandedState) : nextExpanded
              const firstExpandedRowId = Object.keys(resolvedExpanded).find((rowId) => Boolean(resolvedExpanded[rowId]))
              setExpandedOrderId(firstExpandedRowId ?? null)
            }}
            renderExpandedContent={renderExpandedOrderContent}
          />
        </div>

        <div className="flex items-center justify-between border-t border-border-soft p-4 text-sm text-text-muted">
          <div>
            {totalElements > 0
              ? `Showing ${currentPage * pageSize + 1} to ${Math.min((currentPage + 1) * pageSize, totalElements)} of ${totalElements.toLocaleString()} results`
              : "Showing 0 results"}
          </div>
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="unstyled"
              onClick={() => handlePageChange(Math.max(0, currentPage - 1))}
              disabled={currentPage === 0}
              className="rounded border border-border-soft px-3 py-1 hover:bg-surface-muted/55 disabled:opacity-50"
            >
              Prev
            </Button>
            {Array.from({ length: Math.min(3, totalPages) }, (_, i) => {
              const pageNumber = i
              return (
                <Button
                  key={pageNumber}
                  type="button"
                  variant="unstyled"
                  onClick={() => handlePageChange(pageNumber)}
                  className={`rounded border px-3 py-1 ${
                    currentPage === pageNumber
                      ? "border-brand/35 bg-brand/15 font-medium text-brand"
                      : "border-border-soft hover:bg-surface-muted/55"
                  }`}
                >
                  {pageNumber + 1}
                </Button>
              )
            })}
            {totalPages > 3 ? <span className="px-2">...</span> : null}
            <Button
              type="button"
              variant="unstyled"
              onClick={() => handlePageChange(Math.min(totalPages - 1, currentPage + 1))}
              disabled={currentPage >= totalPages - 1}
              className="rounded border border-border-soft px-3 py-1 hover:bg-surface-muted/55 disabled:opacity-50"
            >
              Next
            </Button>
          </div>
        </div>
      </section>
      <Modal
        isOpen={Boolean(pendingCancelAction)}
        onClose={() => {
          if (isConfirmingCancel) return
          setPendingCancelAction(null)
        }}
        title="Confirm cancellation"
        maxWidthClassName="max-w-lg"
        closeOnEscape={!isConfirmingCancel}
        closeOnOverlayClick={!isConfirmingCancel}
      >
        <div className="space-y-4 p-6">
          <h3 className="text-lg font-semibold text-text-primary">Cancel order item(s)?</h3>
          <p className="text-sm text-text-secondary">
            This will submit a cancellation request for the selected item(s). Do you want to continue?
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setPendingCancelAction(null)}
              disabled={isConfirmingCancel}
            >
              Keep order
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => void confirmPendingCancelAction()}
              disabled={isConfirmingCancel}
            >
              {isConfirmingCancel ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Canceling...
                </>
              ) : (
                "Confirm cancel"
              )}
            </Button>
          </div>
        </div>
      </Modal>
      {trackingModalLinks && trackingModalLinks.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="mx-4 w-full max-w-2xl rounded-2xl border border-border-soft bg-surface-elevated shadow-panel">
            <div className="flex items-center justify-between border-b border-border-soft px-6 py-4">
              <h2 className="text-lg font-semibold text-text-primary">Tracking links ({trackingModalLinks.length})</h2>
              <Button
                type="button"
                variant="quiet"
                size="icon-sm"
                onClick={() => setTrackingModalLinks(null)}
                className="text-text-muted hover:bg-surface-muted hover:text-text-secondary"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="max-h-80 space-y-3 overflow-y-auto px-6 py-4">
              {trackingModalLinks.map((link, index) => (
                <div
                  key={`${link.trackingUrl}-${index}`}
                  className="flex items-center justify-between gap-3 rounded-lg border border-border-soft px-3 py-2 text-xs"
                >
                  <div className="flex-1 break-all text-text-secondary">
                    <span className="mr-2 font-semibold text-text-primary">Link {index + 1}</span>
                    {link.trackingUrl.length > 50 ? `${link.trackingUrl.substring(0, 50)}...` : link.trackingUrl}
                    {(link.status || link.updatedDate) && (
                      <div className="mt-1 text-[11px] text-text-muted">
                        {[link.status, formatDateTime(link.updatedDate)]
                          .filter((part) => part && part !== "-")
                          .join(" • ")}
                      </div>
                    )}
                  </div>
                  <Link
                    href={link.trackingUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center whitespace-nowrap rounded-full bg-brand px-2 py-1 text-[11px] font-medium text-primary-foreground transition-colors hover:bg-brand-strong"
                  >
                    Open
                    <ExternalLink className="w-3 h-3 ml-1" />
                  </Link>
                </div>
              ))}
            </div>
            <div className="flex justify-end border-t border-border-soft px-6 py-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setTrackingModalLinks(null)}
                className="rounded-lg"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
