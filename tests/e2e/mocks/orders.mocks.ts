import {
  makeBuyerOrdersResponse,
  makeCancelBySellerResponse,
  makeCancelDuringDeliveryByCustomerResponse,
  makeProcessUberDeliveriesResponse,
  makeRefundOrderResponse,
  makeSellerConfirmReturnResponse,
  makeSellerRejectReturnResponse,
  makeVendorOrdersResponse,
} from "@/test/factories/order.factory"
import type { ApiMock } from "../fixtures/api-mock.fixture"

/**
 * Mirrors src/mocks/handlers/orders.handlers.ts route-for-route: same
 * method + path, same factory. Every response here is fully reproducible
 * from an exported `@/test/factories/order.factory` function - no data was
 * copied by hand. If that handlers file adds/removes a route, mirror the
 * change here.
 */
export function registerOrdersMocks(apiMock: ApiMock) {
  apiMock.on("GET", "/backend-api/orders/buyer", () => ({ body: makeBuyerOrdersResponse() }))

  apiMock.on("POST", "/backend-api/orders/cancelDuringDeliveryByCustomer", () => ({
    body: makeCancelDuringDeliveryByCustomerResponse(),
  }))

  apiMock.on("POST", "/backend-api/orders/refundOrder", () => ({ body: makeRefundOrderResponse() }))

  apiMock.on("GET", "/backend-api/orders/seller", () => ({ body: makeVendorOrdersResponse() }))

  apiMock.on("POST", "/backend-api/orders/uber/process-deliveries", () => ({
    body: makeProcessUberDeliveriesResponse(),
  }))

  apiMock.on("POST", "/backend-api/orders/cancelBySeller", () => ({ body: makeCancelBySellerResponse() }))

  apiMock.on("POST", "/backend-api/orders/sellerConfirmReturn", () => ({
    body: makeSellerConfirmReturnResponse(),
  }))

  apiMock.on("POST", "/backend-api/orders/sellerRejectReturn", () => ({
    body: makeSellerRejectReturnResponse(),
  }))
}
