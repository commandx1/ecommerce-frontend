import apiClient from "./client"

export interface VendorOrderItem {
  id: string
  userProductId: string
  productName: string
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
  orderItems: VendorOrderItem[]
}

export interface VendorOrdersResponse {
  orders: VendorOrder[]
  currentPage: number
  totalPages: number
  totalElements: number
  pageSize: number
}

class VendorOrdersAPI {
  async getVendorOrders(page = 0, size = 10): Promise<VendorOrdersResponse> {
    const response = await apiClient.get<VendorOrdersResponse>("/orders/seller", {
      params: {
        page,
        size,
      },
    })
    return response.data
  }
}

export const vendorOrdersAPI = new VendorOrdersAPI()
