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
  updatedDate?: string | null
}

export interface BuyerOrderShippingLink {
  shippingUrl: string
  status?: string
  updatedDate?: string | null
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

export interface RefundOrderResponse {
  message?: string
}

class BuyerOrdersAPI {
  async getBuyerOrders(
    page = 0,
    size = 10,
    sortBy?: string,
    sortDir?: "asc" | "desc",
    selectedTab?: string,
  ): Promise<BuyerOrdersResponse> {
    const response = await apiClient.get<BuyerOrdersResponse>("/orders/buyer", {
      params: {
        page,
        size,
        sortBy,
        sortDir,
        selectedTab,
      },
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
