import apiClient from "./client"

export interface UserProduct {
  userProductId: string
  oldPrice: number
  price: number
  discount: number
  shipmentFee: number
  stock: number
  stockAlert: string | null
  userProductAlert: string | null
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

  async addItem(userProductId: string, quantity: number): Promise<void> {
    await apiClient.post("/cart/items", { userProductId, quantity })
  }

  async updateItemQuantity(userProductId: string, quantity: number): Promise<void> {
    await apiClient.put("/cart/items", { userProductId, quantity })
  }

  async removeItem(userProductId: string): Promise<void> {
    await apiClient.delete("/cart/items", { data: { userProductId } })
  }

  async clearCart(cartId: string): Promise<void> {
    await apiClient.delete("/cart", { data: { cartId } })
  }
}

export const cartAPI = new CartAPI()
