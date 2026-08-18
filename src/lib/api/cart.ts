import type { AutoOrderPeriod } from "@/lib/constants/auto-order"
import apiClient from "./client"

export interface UserProduct {
  userProductId: string
  oldPrice: number
  price: number
  discount: number
  shipmentFee: number
  heavyShippingSurcharge: number
  stock: number
  stockAlert: string | null
  userProductAlert: string | null
  sellerId: string
  sellerName: string
}

export interface ProductInfo {
  id: string
  name: string
  coverPhotoPath: string
  productAlert: string | null
  dentalLicenseRequired: string | null
}

export interface CartItem {
  id: string
  quantity: number
  /** Recurring purchase schedule for this line, null for a one-off purchase. */
  autoOrder: AutoOrderPeriod | null
  userProduct: UserProduct
  product: ProductInfo
}

export interface Cart {
  cartId: string
  cartItems: CartItem[]
}

export interface TaxEstimatePayload {
  addressId: string
  shippingAmount: string
}

export interface TaxEstimate {
  subtotal: number
  shippingAmount: number
  taxAmount: number
  totalAmount: number
  currency: string
}

class CartAPI {
  async getCart(): Promise<Cart> {
    const response = await apiClient.get<Cart>("/cart")
    return response.data
  }

  async getTaxEstimate(payload: TaxEstimatePayload): Promise<TaxEstimate> {
    const response = await apiClient.post<TaxEstimate>("/cart/tax-estimate", payload)
    return response.data
  }

  /**
   * The backend replaces the item's schedule with whatever `autoOrder` holds on
   * every write, so both calls always send it explicitly — omitting it would
   * silently clear a schedule the buyer already picked.
   */
  async addItem(userProductId: string, quantity: number, autoOrder: AutoOrderPeriod | null = null): Promise<void> {
    await apiClient.post("/cart/items", { userProductId, quantity, autoOrder })
  }

  async updateItemQuantity(
    userProductId: string,
    quantity: number,
    autoOrder: AutoOrderPeriod | null = null,
  ): Promise<void> {
    await apiClient.put("/cart/items", { userProductId, quantity, autoOrder })
  }

  async removeItem(userProductId: string): Promise<void> {
    await apiClient.delete("/cart/items", { data: { userProductId } })
  }

  async clearCart(cartId: string): Promise<void> {
    await apiClient.delete("/cart", { data: { cartId } })
  }
}

export const cartAPI = new CartAPI()
