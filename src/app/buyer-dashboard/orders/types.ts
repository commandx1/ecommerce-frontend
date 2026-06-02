import type { BuyerOrder, BuyerOrderItem, BuyerOrderSellerGroup, BuyerOrderTrackingLink } from "@/lib/api/buyer-orders"

export type OrderViewStatus = "processing" | "shipped" | "delivered" | "shipping"
export type BuyerOrderStatusTab = "All" | "Pending" | "Shipped" | "Delivered" | "Cancelled"

export type PaymentViewStatus = "paid" | "pending" | "failed" | "refunded" | "unknown"

export type FulfillmentStepState = "pending" | "active" | "done"

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
