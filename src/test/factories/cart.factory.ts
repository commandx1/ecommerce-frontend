import type { Cart, CartItem, ProductInfo, TaxEstimate, UserProduct } from "@/lib/api/cart"

export function makeCartUserProduct(overrides: Partial<UserProduct> = {}): UserProduct {
  return {
    userProductId: "up-1",
    oldPrice: 70,
    price: 56,
    discount: 20,
    shipmentFee: 5,
    heavyShippingSurcharge: 0,
    stock: 40,
    stockAlert: null,
    userProductAlert: null,
    sellerId: "seller-1",
    sellerName: "Acme Dental",
    ...overrides,
  }
}

export function makeCartProductInfo(overrides: Partial<ProductInfo> = {}): ProductInfo {
  return {
    id: "p-1",
    name: "Intra Oral Mixing Tips",
    coverPhotoPath: "/uploads/tips.png",
    productAlert: null,
    dentalLicenseRequired: null,
    ...overrides,
  }
}

export function makeCartItem(overrides: Partial<CartItem> = {}): CartItem {
  return {
    id: "ci-1",
    quantity: 2,
    autoOrder: null,
    userProduct: makeCartUserProduct(),
    product: makeCartProductInfo(),
    ...overrides,
  }
}

export function makeCart(overrides: Partial<Cart> = {}): Cart {
  return {
    cartId: "2ba28f52-f51d-4e67-8452-53a7f8061804",
    cartItems: [makeCartItem()],
    ...overrides,
  }
}

export function makeTaxEstimate(overrides: Partial<TaxEstimate> = {}): TaxEstimate {
  return {
    subtotal: 100,
    shippingAmount: 10,
    taxAmount: 8.5,
    totalAmount: 118.5,
    currency: "USD",
    ...overrides,
  }
}
