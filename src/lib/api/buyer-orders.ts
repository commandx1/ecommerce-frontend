import apiClient from "./client"

export interface BuyerOrderItem {
  id: string
  productId?: string
  userProductId: string
  price: number
  quantity: number
  status: string
  productName: string
  productCoverPhotoPath: string
  sellerName: string
  sellerSurname: string
  trackingLink: string[]
  updatedDate: string
}

export interface BuyerOrder {
  orderId: string
  totalPrice: number
  orderStatus: string
  createdDate: string
  addressTitle: string
  addressFormattedAddress: string
  orderItems: BuyerOrderItem[]
}

export interface BuyerOrdersResponse {
  orders: BuyerOrder[]
  currentPage: number
  totalPages: number
  totalElements: number
  pageSize: number
}

class BuyerOrdersAPI {
  async getBuyerOrders(page = 0, size = 10, sortBy?: string, sortDir?: "asc" | "desc"): Promise<BuyerOrdersResponse> {
    const response = await apiClient.get<BuyerOrdersResponse>("/orders/buyer", {
      params: {
        page,
        size,
        sortBy,
        sortDir,
      },
    })
    return response.data
  }
}

export const buyerOrdersAPI = new BuyerOrdersAPI()
