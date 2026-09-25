import type { BuyerOrder, BuyerOrderItem, BuyerOrderSellerGroup, BuyerOrderTrackingLink } from "@/lib/api/buyer-orders"

// Canonical definition moved to lib/orders/fulfillment.ts (Phase 4 §7, step O1) - shared with
// the vendor side now that FulfillmentTimeline lives in components/orders/. Re-exported here so
// existing `from "../types"` imports keep working.
export type { FulfillmentStepState } from "@/lib/orders/fulfillment"

export type OrderViewStatus = "processing" | "shipped" | "delivered" | "shipping"
export type BuyerOrderStatusTab = "All" | "Pending" | "Shipped" | "Delivered" | "Cancelled" | "Returned"

export type PaymentViewStatus = "paid" | "pending" | "failed" | "refunded" | "unknown"

export interface BuyerOrderViewModel {
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
  heavyShipmentTotal: number
  taxTotal: number
  totalAmountFromItemPrices: number
  totalQuantity: number
  trackingCount: number
  uiStatus: OrderViewStatus
}

export interface CancelActionOptions {
  cancelingItemId?: string
  cancelingSellerKey?: string
}

export interface PendingCancelAction {
  description: string
  orderItemIds: string[]
  options?: CancelActionOptions
}

export interface BuyerOrderLinksModalPayload {
  links: BuyerOrderTrackingLink[]
  title: string
}

export interface BuyerOrdersPageState {
  cancelingItemId: string | null
  cancelingSellerKey: string | null
  currentPage: number
  dateSortDir: "asc" | "desc"
  expandedOrderId: string | null
  isConfirmingCancel: boolean
  isLoading: boolean
  orders: BuyerOrder[]
  pendingCancelAction: PendingCancelAction | null
  reorderingItemId: string | null
  totalElements: number
  totalPages: number
}
