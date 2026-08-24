import type { AutoOrder, AutoOrdersResponse } from "@/lib/api/auto-orders"

export function makeAutoOrder(overrides: Partial<AutoOrder> = {}): AutoOrder {
  return {
    id: "584aa69c-10b5-4911-952a-4d33d298f23d",
    userProductId: "63fb93ae-b6e2-4c3f-918c-69b9653a83ab",
    productId: "1cb0d772-718b-4f24-9a90-6956be185e16",
    productName: "Intra Oral Mixing Tips Yellow 100/Pk - MARK3",
    productCoverPhotoPath: "/uploads/productCoverPhoto/1577afd9-cover.jpg",
    price: 80,
    quantity: 2,
    period: "ONE_MONTH",
    nextOrderDate: "2026-09-14T18:06:14.835534",
    active: true,
    sellerName: "Acme Dental",
    createdDate: "2026-08-15T18:06:15.634535",
    updatedDate: "2026-08-15T18:06:15.634559",
    ...overrides,
  }
}

export function makeAutoOrdersResponse(overrides: Partial<AutoOrdersResponse> = {}): AutoOrdersResponse {
  return {
    autoOrders: [makeAutoOrder()],
    total: 1,
    ...overrides,
  }
}
