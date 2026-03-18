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
  shippoRateOrders: ShippoRateOrder[]
  uberRateOrders: UberRateOrder[]
  cardSave?: number
  cardName?: string
}

export interface OrderItem {
  id: string
  userProductId: string
  price: number
  quantity: number
  status: string
  shippingLink: string[]
  trackingLink: string[]
  updatedDate: string
}

export interface PlaceOrderResponse {
  orderId: string
  totalPrice: number
  status: string
  createdDate: string
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

class OrdersAPI {
  async placeOrder(payload: PlaceOrderPayload): Promise<PlaceOrderResponse> {
    const response = await apiClient.post<PlaceOrderResponse>("/orders", payload)
    return response.data
  }

  async getSavedCards(): Promise<SavedCardsResponse> {
    const response = await apiClient.get<SavedCardsResponse>("/orders/saved-cards")
    return response.data
  }
}

export const ordersAPI = new OrdersAPI()
