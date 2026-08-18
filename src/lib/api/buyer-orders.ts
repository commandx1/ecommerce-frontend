import apiClient from "./client"

export interface BuyerOrderAddress {
  title: string
  fullName: string
  phoneNumber: string
  country: string
  city: string
  district: string
  postalCode: string
  addressLine: string
  formattedAddress: string
  latitude: number
  longitude: number
  placeId: string
}

export interface BuyerOrderTrackingLink {
  trackingUrl: string
  status?: string
  createdDate?: string | null
  updatedDate?: string | null
  shipmentPrice?: number | null
  takedShipmentPrice?: number | null
  boxSize?: string | null
  height?: number | null
  width?: number | null
  length?: number | null
  weight?: number | null
  allItemsInThisShipment?: boolean | null
  howManyItemsContainedInThisShipment?: number | null
}

export interface BuyerOrderShippingLink {
  shippingUrl: string
  status?: string
  createdDate?: string | null
  updatedDate?: string | null
  shipmentPrice?: number | null
  takedShipmentPrice?: number | null
  boxSize?: string | null
  height?: number | null
  width?: number | null
  length?: number | null
  weight?: number | null
}

export interface BuyerOrderItem {
  id: string
  productId?: string
  userProductId: string
  price: number
  quantity: number
  status: string
  productName: string
  productCoverPhotoPath: string | null
  sellerName: string
  sellerSurname: string
  shipmentPrice?: number | null
  shipmentFreeBySeller?: boolean | null
  cancelledByCustomer?: boolean | null
  cancelledBySeller?: boolean | null
  cancelledWithShippingFee?: boolean | null
  sellerConfirmedReturn?: boolean | null
  refundStatus?: string | null
  returnRefundStatus?: string | null
  returnReason?: string | null
  returnDate?: string | null
  returnRejectReason?: string | null
  returnRejectDate?: string | null
  shippingLink?: string[]
  shippingLinks?: BuyerOrderShippingLink[]
  trackingLink?: string[]
  trackingLinks?: BuyerOrderTrackingLink[]
  returnTrackingLinks?: BuyerOrderTrackingLink[]
  returnShippingLinks?: BuyerOrderShippingLink[]
  returnenable?: boolean | null
  updatedDate: string
}

export interface BuyerOrderSellerGroup {
  sellerId: string
  sellerName: string
  sellerSurname: string
  cancellationShipmentFee?: number | null
  cancellationShipmentRefundFee?: number | null
  orderItems: BuyerOrderItem[]
}

export interface BuyerOrder {
  orderId: string
  totalPrice: number
  orderStatus: string
  createdDate: string
  addressTitle: string
  addressFormattedAddress: string
  shipmentAddress?: BuyerOrderAddress
  billingAddress?: BuyerOrderAddress
  cardName?: string | null
  cardBrand?: string | null
  cardLast4?: string | null
  cardExpMonth?: number | null
  cardExpYear?: number | null
  /** True when the scheduler placed this order from a standing auto order. */
  autoOrder?: boolean
  sellerGroups?: BuyerOrderSellerGroup[]
  orderItems?: BuyerOrderItem[]
}

export interface BuyerOrdersResponse {
  orders: BuyerOrder[]
  currentPage: number
  totalPages: number
  totalElements: number
  pageSize: number
}

export type BuyerOrderFilterType = "ALL" | "WAITING_FOR_SHIPMENT" | "ON_WAY" | "DELIVERED" | "CANCELLED" | "RETURNED"

export interface CancelDuringDeliveryByCustomerPayload {
  orderItemIds: string[]
}

export interface CancelDuringDeliveryByCustomerResponse {
  message: string
  successCount: number
  failureCount: number
  cancelledOrderItemIds: string[]
}

export interface RefundOrderItemPayload {
  orderItemId: string
  quantity: number
  returnReason: string
}

export interface RefundOrderPayload {
  items: RefundOrderItemPayload[]
}

export interface RefundOrderItemLinks {
  orderItemId: string
  returnTrackingLinks: BuyerOrderTrackingLink[]
  returnShippingLinks: BuyerOrderShippingLink[]
}

export interface RefundOrderResponse {
  message?: string
  itemLinks?: RefundOrderItemLinks[]
}

class BuyerOrdersAPI {
  async getBuyerOrders(
    page = 0,
    size = 10,
    sortBy?: string,
    sortDir?: "asc" | "desc",
    type: BuyerOrderFilterType = "ALL",
    signal?: AbortSignal,
  ): Promise<BuyerOrdersResponse> {
    const response = await apiClient.get<BuyerOrdersResponse>("/orders/buyer", {
      params: {
        page,
        size,
        sortBy,
        sortDir,
        type,
      },
      signal,
    })
    return response.data
  }

  async cancelDuringDeliveryByCustomer(
    payload: CancelDuringDeliveryByCustomerPayload,
  ): Promise<CancelDuringDeliveryByCustomerResponse> {
    const response = await apiClient.post<CancelDuringDeliveryByCustomerResponse>(
      "/orders/cancelDuringDeliveryByCustomer",
      payload,
    )
    return response.data
  }

  async refundOrder(payload: RefundOrderPayload): Promise<RefundOrderResponse> {
    const response = await apiClient.post<RefundOrderResponse>("/orders/refundOrder", payload)
    return response.data
  }
}

export const buyerOrdersAPI = new BuyerOrdersAPI()
