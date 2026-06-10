import apiClient from "./client"

export type VendorOrderFilterType =
  | "ALL"
  | "WAITING_FOR_SHIPMENT"
  | "ON_WAY"
  | "DELIVERED"
  | "CANCELLED"
  | "RETURNED"

export interface VendorTrackingLink {
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

export interface VendorShippingLink {
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

export interface VendorOrderItem {
  id: string
  userProductId: string
  productId?: string
  productName: string
  productCoverPhotoPath?: string | null
  price: number
  quantity: number
  totalPrice: number
  status: string
  shippingLink?: string[]
  trackingLink?: string[]
  shippingLinks?: VendorShippingLink[]
  trackingLinks?: VendorTrackingLink[]
  returnTrackingLinks?: VendorTrackingLink[]
  returnRefundStatus?: string | null
  returnReason?: string | null
  returnPrice?: string | null
  returnDate?: string | null
  returnRejectReason?: string | null
  returnRejectDate?: string | null
  cancelledRefundStatus?: string | null
  cancelledByCustomer?: boolean | null
  cancelledBySeller?: boolean | null
  cancelledWithShippingFee?: boolean | null
  takedShipmentPrice?: number | null
  shipmentFreeBySeller?: boolean | null
  sellerConfirmedReturn?: boolean | null
  deliveredDate?: string | null
  updatedDate: string
}

export interface VendorOrderAddress {
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

export interface VendorOrder {
  orderId: string
  orderStatus: string
  orderCreatedDate: string
  buyerId: string
  buyerName: string
  buyerSurname: string
  totalShippingCost?: number | null
  cancellationShipmentFee?: number | null
  cancellationShipmentRefundFee?: number | null
  sellerAddress?: VendorOrderAddress
  orderItems: VendorOrderItem[]
}

export interface VendorOrdersResponse {
  orders: VendorOrder[]
  currentPage: number
  totalPages: number
  totalElements: number
  pageSize: number
}

export interface ProcessUberDeliveriesPayload {
  orderItemIds: string[]
}

export interface ProcessUberDeliveriesResponse {
  message: string
  successCount: number
  failureCount: number
  deliveryId: string
  shippingPrice: number
  trackingUrl: string
}

export interface CancelBySellerPayload {
  orderItemIds: string[]
}

export interface CancelBySellerResponse {
  message: string
  successCount: number
  failureCount: number
  cancelledOrderItemIds: string[]
}

export interface SellerConfirmReturnPayload {
  orderItemIds: string[]
}

export interface SellerConfirmReturnResponse {
  message: string
  refundAmount: number
  orderItemIds: string[]
}

export interface SellerRejectReturnItemPayload {
  orderItemId: string
  returnRejectReason: string
}

export interface SellerRejectReturnPayload {
  items: SellerRejectReturnItemPayload[]
}

export interface SellerRejectReturnResponse {
  message: string
  orderItemIds: string[]
}

class VendorOrdersAPI {
  async getVendorOrders(
    page = 0,
    size = 10,
    sortBy?: string,
    sortDir?: "asc" | "desc",
    type: VendorOrderFilterType = "ALL",
    signal?: AbortSignal,
  ): Promise<VendorOrdersResponse> {
    const response = await apiClient.get<VendorOrdersResponse>("/orders/seller", {
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

  async processUberDeliveries(payload: ProcessUberDeliveriesPayload): Promise<ProcessUberDeliveriesResponse> {
    const response = await apiClient.post<ProcessUberDeliveriesResponse>("/orders/uber/process-deliveries", payload)
    return response.data
  }

  async cancelBySeller(payload: CancelBySellerPayload): Promise<CancelBySellerResponse> {
    const response = await apiClient.post<CancelBySellerResponse>("/orders/cancelBySeller", payload)
    return response.data
  }

  async sellerConfirmReturn(payload: SellerConfirmReturnPayload): Promise<SellerConfirmReturnResponse> {
    const response = await apiClient.post<SellerConfirmReturnResponse>("/orders/sellerConfirmReturn", payload)
    return response.data
  }

  async sellerRejectReturn(payload: SellerRejectReturnPayload): Promise<SellerRejectReturnResponse> {
    const response = await apiClient.post<SellerRejectReturnResponse>("/orders/sellerRejectReturn", payload)
    return response.data
  }
}

export const vendorOrdersAPI = new VendorOrdersAPI()
