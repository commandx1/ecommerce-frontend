export enum UberCancelableStatus {
  PENDING = "PENDING",
  PICKUP_IMMINENT = "PICKUP_IMMINENT",
  PICKUP = "PICKUP",
  PICKUP_COMPLETE = "PICKUP_COMPLETE",
  DROPOFF_IMMINENT = "DROPOFF_IMMINENT",
}

export enum ShippoCancelableStatus {
  UNKNOWN = "UNKNOWN",
  WAITING_FOR_SHIPMENT = "WAITING_FOR_SHIPMENT",
}

export enum OrderItemStatus {
  CANCELLATION_PENDING = "CANCELLATION_PENDING",
  CANCEL_REQUESTED = "CANCEL_REQUESTED",
}

const CANCELABLE_ORDER_ITEM_STATUS_SET = new Set<string>([
  ...Object.values(UberCancelableStatus),
  ...Object.values(ShippoCancelableStatus),
])

export function isCancelableOrderItemStatus(status: string): boolean {
  return CANCELABLE_ORDER_ITEM_STATUS_SET.has(status)
}

export function isWarningOrderItemStatus(status: string): boolean {
  return status === ShippoCancelableStatus.WAITING_FOR_SHIPMENT || status === OrderItemStatus.CANCELLATION_PENDING
}
