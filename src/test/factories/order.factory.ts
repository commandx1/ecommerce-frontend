import type {
  BuyerOrder,
  BuyerOrderItem,
  BuyerOrderSellerGroup,
  BuyerOrdersResponse,
  CancelDuringDeliveryByCustomerResponse,
  RefundOrderResponse,
} from "@/lib/api/buyer-orders"
import type {
  CancelBySellerResponse,
  ProcessUberDeliveriesResponse,
  SellerConfirmReturnResponse,
  SellerRejectReturnResponse,
  VendorOrder,
  VendorOrderItem,
  VendorOrdersResponse,
} from "@/lib/api/vendor-orders"

export function makeBuyerOrderItem(overrides: Partial<BuyerOrderItem> = {}): BuyerOrderItem {
  return {
    id: "item-1",
    productId: "p-1",
    userProductId: "up-1",
    price: 100,
    quantity: 2,
    status: "WAITING_FOR_SHIPMENT",
    productName: "Dental Kit",
    productCoverPhotoPath: null,
    sellerName: "Acme",
    sellerSurname: "Store",
    updatedDate: "2026-05-20T11:00:00Z",
    ...overrides,
  }
}

export function makeBuyerOrderSellerGroup(overrides: Partial<BuyerOrderSellerGroup> = {}): BuyerOrderSellerGroup {
  return {
    sellerId: "seller-1",
    sellerName: "Acme",
    sellerSurname: "Store",
    orderItems: [makeBuyerOrderItem()],
    ...overrides,
  }
}

export function makeBuyerOrder(overrides: Partial<BuyerOrder> = {}): BuyerOrder {
  return {
    orderId: "order-1",
    totalPrice: 240,
    orderStatus: "PAID",
    createdDate: "2026-05-20T10:30:00Z",
    addressTitle: "Home",
    addressFormattedAddress: "Bagdat Caddesi 10, Kadikoy / Istanbul",
    sellerGroups: [makeBuyerOrderSellerGroup()],
    ...overrides,
  }
}

export function makeBuyerOrdersResponse(overrides: Partial<BuyerOrdersResponse> = {}): BuyerOrdersResponse {
  return {
    orders: [makeBuyerOrder()],
    currentPage: 0,
    totalPages: 1,
    totalElements: 1,
    pageSize: 10,
    ...overrides,
  }
}

export function makeCancelDuringDeliveryByCustomerResponse(
  overrides: Partial<CancelDuringDeliveryByCustomerResponse> = {},
): CancelDuringDeliveryByCustomerResponse {
  return {
    message: "Cancellation queued",
    successCount: 1,
    failureCount: 0,
    cancelledOrderItemIds: ["item-1"],
    ...overrides,
  }
}

export function makeRefundOrderResponse(overrides: Partial<RefundOrderResponse> = {}): RefundOrderResponse {
  return {
    message: "Return created",
    itemLinks: [],
    ...overrides,
  }
}

export function makeVendorOrderItem(overrides: Partial<VendorOrderItem> = {}): VendorOrderItem {
  return {
    id: "vitem-1",
    userProductId: "up-1",
    productId: "p-1",
    productName: "Dental Kit",
    productCoverPhotoPath: null,
    price: 100,
    quantity: 2,
    totalPrice: 200,
    status: "WAITING_FOR_SHIPMENT",
    updatedDate: "2026-05-20T11:00:00Z",
    ...overrides,
  }
}

export function makeVendorOrder(overrides: Partial<VendorOrder> = {}): VendorOrder {
  return {
    orderId: "vorder-1",
    orderStatus: "PAID",
    orderCreatedDate: "2026-05-20T10:30:00Z",
    buyerId: "buyer-1",
    buyerName: "Jane",
    buyerSurname: "Doe",
    orderItems: [makeVendorOrderItem()],
    ...overrides,
  }
}

export function makeVendorOrdersResponse(overrides: Partial<VendorOrdersResponse> = {}): VendorOrdersResponse {
  return {
    orders: [makeVendorOrder()],
    currentPage: 0,
    totalPages: 1,
    totalElements: 1,
    pageSize: 10,
    ...overrides,
  }
}

export function makeProcessUberDeliveriesResponse(
  overrides: Partial<ProcessUberDeliveriesResponse> = {},
): ProcessUberDeliveriesResponse {
  return {
    message: "Delivery scheduled",
    successCount: 1,
    failureCount: 0,
    deliveryId: "delivery-1",
    shippingPrice: 12.5,
    trackingUrl: "https://track.example.com/delivery-1",
    ...overrides,
  }
}

export function makeCancelBySellerResponse(overrides: Partial<CancelBySellerResponse> = {}): CancelBySellerResponse {
  return {
    message: "Cancellation queued",
    successCount: 1,
    failureCount: 0,
    cancelledOrderItemIds: ["vitem-1"],
    ...overrides,
  }
}

export function makeSellerConfirmReturnResponse(
  overrides: Partial<SellerConfirmReturnResponse> = {},
): SellerConfirmReturnResponse {
  return {
    message: "Return confirmed",
    refundAmount: 100,
    orderItemIds: ["vitem-1"],
    ...overrides,
  }
}

export function makeSellerRejectReturnResponse(
  overrides: Partial<SellerRejectReturnResponse> = {},
): SellerRejectReturnResponse {
  return {
    message: "Return rejected",
    orderItemIds: ["vitem-1"],
    ...overrides,
  }
}
