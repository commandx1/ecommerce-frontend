import type { BuyerOrder, BuyerOrderAddress, BuyerOrderItem, BuyerOrderSellerGroup } from "@/lib/api/buyer-orders"
import { formatDateOnly, formatTimeOnly } from "@/lib/orders/order-format"
import type { BuyerOrderViewModel, OrderViewStatus, PaymentViewStatus } from "../types"
import {
  getOrderItemHeavyShipmentFee,
  getOrderItemShipmentFee,
  getOrderItemTaxPrice,
  resolveOrderMoneyBreakdown,
} from "./order-money"
import { getTrackingLinkCount } from "./tracking-links"

export function resolveOrderItemProductId(item: BuyerOrderItem): string | null {
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

export function getAddressSummary(
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

export function getOrderItems(order: BuyerOrder): BuyerOrderItem[] {
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

export function getOrderSellerGroups(order: BuyerOrder): BuyerOrderSellerGroup[] {
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
        cancellationHeavyShipmentFeeRefund: null,
        orderItems: [],
      })
    }

    groupedMap.get(key)?.orderItems.push(item)
  }

  return Array.from(groupedMap.values())
}

export function resolvePaymentSummary(order: BuyerOrder): { title: string; detail: string } {
  if (typeof order.cardBrand === "string" && order.cardBrand && order.cardLast4) {
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

export function resolveOrderViewStatus(order: BuyerOrder, orderItems: BuyerOrderItem[]): OrderViewStatus {
  // The wire is not the entity: a malformed order with a missing status must not throw here, or
  // one bad order unmounts the whole list.
  const normalizedOrderStatus = typeof order.orderStatus === "string" ? order.orderStatus.toUpperCase() : ""
  const itemStatuses = (Array.isArray(orderItems) ? orderItems : []).map((item) =>
    typeof item?.status === "string" ? item.status.toUpperCase() : "",
  )

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

export function getOrderStatusBadgeClasses(status: OrderViewStatus): string {
  if (status === "delivered") {
    return "border border-success/40 bg-success/15 text-success"
  }

  if (status === "shipped") {
    return "border border-brand/40 bg-brand/15 text-brand"
  }

  return "border border-warning/40 bg-warning/15 text-warning"
}

export function getOrderStatusLabel(status: OrderViewStatus): string {
  if (status === "delivered") return "Delivered"
  if (status === "shipped") return "Shipped"
  if (status === "shipping") return "Shipping"
  return "Processing"
}

export function resolvePaymentViewStatus(orderStatus: string): PaymentViewStatus {
  // Same guard as resolveOrderViewStatus - both read the same `order.orderStatus`.
  const normalized = typeof orderStatus === "string" ? orderStatus.toUpperCase() : ""
  if (normalized.includes("REFUND")) return "refunded"
  if (normalized.includes("FAIL")) return "failed"
  if (normalized.includes("SUCCESS") || normalized.includes("PAID")) return "paid"
  if (normalized.includes("PENDING") || normalized.includes("PROCESS")) return "pending"
  return "unknown"
}

export function getPaymentViewStatusLabel(status: PaymentViewStatus): string {
  if (status === "paid") return "Paid"
  if (status === "pending") return "Pending"
  if (status === "failed") return "Failed"
  if (status === "refunded") return "Refunded"
  return "Unknown"
}

export function getPaymentViewStatusClasses(status: PaymentViewStatus): string {
  if (status === "paid") return "border border-success/35 bg-success/10 text-success"
  if (status === "failed") return "border border-danger/35 bg-danger/10 text-danger"
  if (status === "refunded") return "border border-brand/35 bg-brand/12 text-brand"
  if (status === "pending") return "border border-warning/35 bg-warning/10 text-warning"
  return "border border-border-soft bg-surface-muted text-text-muted"
}

export function getSellerSummary(sellerGroups: BuyerOrderSellerGroup[]): { primarySeller: string; moreCount: number } {
  if (sellerGroups.length === 0) {
    return { primarySeller: "Unknown Seller", moreCount: 0 }
  }

  const [firstSeller, ...remainingSellers] = sellerGroups
  const primarySeller = [firstSeller.sellerName, firstSeller.sellerSurname].filter(Boolean).join(" ").trim() || "Seller"

  return { primarySeller, moreCount: remainingSellers.length }
}

export function buildBuyerOrderViewModel(order: BuyerOrder): BuyerOrderViewModel {
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
  const heavyShipmentTotal = orderItems.reduce((sum, item) => sum + getOrderItemHeavyShipmentFee(item), 0)
  const taxTotal = orderItems.reduce((sum, item) => sum + getOrderItemTaxPrice(item), 0)
  const totalAmountFromItemPrices = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
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
    heavyShipmentTotal,
    taxTotal,
    totalAmountFromItemPrices,
    totalQuantity,
    trackingCount,
    uiStatus,
  }
}
