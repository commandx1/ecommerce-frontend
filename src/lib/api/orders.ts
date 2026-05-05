import apiClient from "./client"

export interface OrderProduct {
  userProductId: string
  quantity: number
}

export interface ShippoRateOrder {
  shippoRateId: string
  userId: string
  products: OrderProduct[]
}

export interface UberRateOrder {
  uberRateId: string
  userId: string
  products: OrderProduct[]
}

export interface PlaceOrderPayload {
  addressId: string
  cartId?: string
  shippoRateOrders: ShippoRateOrder[]
  uberRateOrders: UberRateOrder[]
  paymentMethodId?: string
  cardSave?: number
  cardName?: string
}

export interface OrderItem {
  id: string
  userProductId: string
  productId?: string
  productName?: string
  productCoverPhotoPath?: string
  price: number
  quantity: number
  status: string
  shippingLink: string[]
  trackingLink: string[]
  updatedDate: string | null
}

export interface PlaceOrderResponse {
  orderId: string
  totalPrice: number
  status: string
  paymentStatus?: string
  createdDate: string | null
  clientSecret?: string
  orderItems: OrderItem[]
}

export interface SavedCard {
  id: string
  name: string
  stripeCardId: string
  brand: string
  last4: string
  expMonth: number
  expYear: number
  createdDate: string
}

export interface SavedCardsResponse {
  cards: SavedCard[]
  total: number
}

export interface GetPaymentStatusResponse {
  paymentIntentId: string
  status: "requires_confirmation" | "canceled" | "succeeded" | string
  amount: number
  currency: string
  clientSecret: string
  error: string | null
}

class OrdersAPI {
  async placeOrder(payload: PlaceOrderPayload): Promise<PlaceOrderResponse> {
    const response = await apiClient.post<PlaceOrderResponse>("/orders", payload)
    return response.data
  }

  async getPaymentStatus(paymentIntentId: string): Promise<GetPaymentStatusResponse> {
    const response = await apiClient.get<GetPaymentStatusResponse>(`/orders/payment/${paymentIntentId}`)
    return response.data
  }

  async getSavedCards(): Promise<SavedCardsResponse> {
    const response = await apiClient.get<SavedCardsResponse>("/orders/saved-cards")
    return response.data
  }
}

export const ordersAPI = new OrdersAPI()
