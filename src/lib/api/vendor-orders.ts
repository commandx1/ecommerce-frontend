import apiClient from "./client"

export interface VendorOrderItem {
  id: string
  userProductId: string
  productName: string
  productCoverPhotoPath?: string | null
  price: number
  quantity: number
  totalPrice: number
  status: string
  shippingLink: string[]
  trackingLink: string[]
  updatedDate: string
}

export interface VendorOrder {
  orderId: string
  orderStatus: string
  orderCreatedDate: string
  buyerId: string
  buyerName: string
  buyerSurname: string
  totalShippingCost?: number | null
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

export interface CancelDuringDeliveryByCustomerPayload {
  orderItemIds: string[]
}

export interface CancelDuringDeliveryByCustomerResponse {
  message: string
  successCount: number
  failureCount: number
  cancelledOrderItemIds: string[]
}

class VendorOrdersAPI {
  async getVendorOrders(page = 0, size = 10, sortBy?: string, sortDir?: "asc" | "desc"): Promise<VendorOrdersResponse> {
    const response = await apiClient.get<VendorOrdersResponse>("/orders/seller", {
      params: {
        page,
        size,
        sortBy,
        sortDir,
      },
    })
    return response.data
  }

  async processUberDeliveries(payload: ProcessUberDeliveriesPayload): Promise<ProcessUberDeliveriesResponse> {
    const response = await apiClient.post<ProcessUberDeliveriesResponse>("/orders/uber/process-deliveries", payload)
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
}

export const vendorOrdersAPI = new VendorOrdersAPI()
