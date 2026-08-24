import { accountHandlers } from "./account.handlers"
import { autoOrdersHandlers } from "./auto-orders.handlers"
import { cartHandlers } from "./cart.handlers"
import { ordersHandlers } from "./orders.handlers"
import { paymentsHandlers } from "./payments.handlers"
import { productsHandlers } from "./products.handlers"
import { shipmentHandlers } from "./shipment.handlers"
import { vendorHandlers } from "./vendor.handlers"

export { accountHandlers } from "./account.handlers"
export { autoOrdersHandlers } from "./auto-orders.handlers"
export { cartHandlers } from "./cart.handlers"
export { ordersHandlers } from "./orders.handlers"
export { paymentsHandlers } from "./payments.handlers"
export { productsHandlers } from "./products.handlers"
export { shipmentHandlers } from "./shipment.handlers"
export { vendorHandlers } from "./vendor.handlers"

export const handlers = [
  ...cartHandlers,
  ...ordersHandlers,
  ...autoOrdersHandlers,
  ...productsHandlers,
  ...paymentsHandlers,
  ...accountHandlers,
  ...vendorHandlers,
  ...shipmentHandlers,
]
