import type { AutoOrderPeriod } from "@/lib/constants/auto-order"
import apiClient from "./client"

export interface OrderProduct {
  userProductId: string
  quantity: number
  /** Turns this line into a standing auto order once the payment succeeds. */
  autoOrder?: AutoOrderPeriod | null
}

export interface ShippoRateOrder {
  shippoRateId: string
  // Typed `UUID` on the backend but never read there; callers omit it rather than risk a non-UUID
  // value failing deserialization of the whole order body.
  userId?: string
  products: OrderProduct[]
}

export interface UberRateOrder {
  uberRateId: string
  /** See `ShippoRateOrder.userId` — same unread, decorative field. */
  userId?: string
  products: OrderProduct[]
}

export interface PlaceOrderPayload {
  addressId: string
  cartId?: string
  shippoRateOrders: ShippoRateOrder[]
  uberRateOrders: UberRateOrder[]
  paymentMethodId?: string
  cardSave?: boolean
  cardName?: string
  /** Only used with `cardSave`: saves the new card with an off-session mandate. */
  cardOpenToAutoPayment?: boolean
  /** Only used with `cardSave`: makes the new card the buyer's auto order card. */
  cardAutoOrderCard?: boolean
  /**
   * Consent to upgrade an already saved card to off-session payments so it can
   * cover the auto order items in this request.
   */
  openToAutoOrder?: boolean
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
  isDefault?: boolean
  openToAutoPayment?: boolean
  autoOrderCard?: boolean
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

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * The orders endpoints' optional `orderId` param is a UUID on the backend - a non-UUID value
 * makes Spring return 400. Both orders pages read `orderId` from the URL (set by a notification
 * link), so this validates it before it ever reaches an API call. Lowercases the result so an
 * upper-case URL still matches the backend's lowercase `order.orderId` for auto-expand.
 */
export function parseOrderIdParam(value: string | null): string | null {
  return value && UUID_PATTERN.test(value) ? value.toLowerCase() : null
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
