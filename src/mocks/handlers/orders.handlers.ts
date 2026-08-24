import { HttpResponse, http } from "msw"
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

export const ordersHandlers = [
  // Buyer orders
  http.get("*/backend-api/orders/buyer", () => HttpResponse.json(makeBuyerOrdersResponse())),

  http.post("*/backend-api/orders/cancelDuringDeliveryByCustomer", () =>
    HttpResponse.json(makeCancelDuringDeliveryByCustomerResponse()),
  ),

  http.post("*/backend-api/orders/refundOrder", () => HttpResponse.json(makeRefundOrderResponse())),

  // Vendor orders
  http.get("*/backend-api/orders/seller", () => HttpResponse.json(makeVendorOrdersResponse())),

  http.post("*/backend-api/orders/uber/process-deliveries", () =>
    HttpResponse.json(makeProcessUberDeliveriesResponse()),
  ),

  http.post("*/backend-api/orders/cancelBySeller", () => HttpResponse.json(makeCancelBySellerResponse())),

  http.post("*/backend-api/orders/sellerConfirmReturn", () => HttpResponse.json(makeSellerConfirmReturnResponse())),

  http.post("*/backend-api/orders/sellerRejectReturn", () => HttpResponse.json(makeSellerRejectReturnResponse())),
]
