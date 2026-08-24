import { describe, expect, it } from "vitest"
import {
  isCancelableOrderItemStatus,
  isPreShippingCancelableStatus,
  isWarningOrderItemStatus,
  OrderItemStatus,
  ShippoCancelableStatus,
  UberCancelableStatus,
} from "./order-item-status"

const allUberStatuses = Object.values(UberCancelableStatus)
const allShippoStatuses = Object.values(ShippoCancelableStatus)

describe("isCancelableOrderItemStatus", () => {
  it.each(allUberStatuses)("returns true for Uber status %s", (status) => {
    expect(isCancelableOrderItemStatus(status)).toBe(true)
  })

  it.each(allShippoStatuses)("returns true for Shippo status %s", (status) => {
    expect(isCancelableOrderItemStatus(status)).toBe(true)
  })

  it("returns false for CANCELLATION_PENDING", () => {
    expect(isCancelableOrderItemStatus(OrderItemStatus.CANCELLATION_PENDING)).toBe(false)
  })

  it("returns false for CANCEL_REQUESTED", () => {
    expect(isCancelableOrderItemStatus(OrderItemStatus.CANCEL_REQUESTED)).toBe(false)
  })

  it("returns false for DELIVERED", () => {
    expect(isCancelableOrderItemStatus("DELIVERED")).toBe(false)
  })

  it("returns false for an unknown status string", () => {
    expect(isCancelableOrderItemStatus("NOT_A_REAL_STATUS")).toBe(false)
  })

  it("returns false for an empty string", () => {
    expect(isCancelableOrderItemStatus("")).toBe(false)
  })
})

describe("isPreShippingCancelableStatus", () => {
  const preShippingStatuses = [
    UberCancelableStatus.PENDING,
    UberCancelableStatus.WAITING_FOR_UBER_DIRECT,
    ShippoCancelableStatus.UNKNOWN,
    ShippoCancelableStatus.WAITING_FOR_SHIPMENT,
  ]

  it.each(preShippingStatuses)("returns true for pre-shipping status %s", (status) => {
    expect(isPreShippingCancelableStatus(status)).toBe(true)
  })

  it("returns false for DELIVERED", () => {
    expect(isPreShippingCancelableStatus("DELIVERED")).toBe(false)
  })

  it("returns false for an unknown status", () => {
    expect(isPreShippingCancelableStatus("NOT_A_REAL_STATUS")).toBe(false)
  })

  // Key distinction driving table actions: PICKUP and DROPOFF_IMMINENT are
  // cancelable (the courier hasn't dropped off yet) but are NOT pre-shipping —
  // the shipment is already in motion, so the UI must not offer the
  // "pre-shipping" cancel path for these two statuses.
  it("PICKUP is cancelable but NOT pre-shipping-cancelable", () => {
    expect(isCancelableOrderItemStatus(UberCancelableStatus.PICKUP)).toBe(true)
    expect(isPreShippingCancelableStatus(UberCancelableStatus.PICKUP)).toBe(false)
  })

  it("DROPOFF_IMMINENT is cancelable but NOT pre-shipping-cancelable", () => {
    expect(isCancelableOrderItemStatus(UberCancelableStatus.DROPOFF_IMMINENT)).toBe(true)
    expect(isPreShippingCancelableStatus(UberCancelableStatus.DROPOFF_IMMINENT)).toBe(false)
  })
})

describe("isWarningOrderItemStatus", () => {
  it("returns true for WAITING_FOR_SHIPMENT", () => {
    expect(isWarningOrderItemStatus(ShippoCancelableStatus.WAITING_FOR_SHIPMENT)).toBe(true)
  })

  it("returns true for CANCELLATION_PENDING", () => {
    expect(isWarningOrderItemStatus(OrderItemStatus.CANCELLATION_PENDING)).toBe(true)
  })

  it("returns false for CANCEL_REQUESTED", () => {
    expect(isWarningOrderItemStatus(OrderItemStatus.CANCEL_REQUESTED)).toBe(false)
  })

  it("returns false for DELIVERED", () => {
    expect(isWarningOrderItemStatus("DELIVERED")).toBe(false)
  })

  it("returns false for an unknown status", () => {
    expect(isWarningOrderItemStatus("NOT_A_REAL_STATUS")).toBe(false)
  })
})

describe("WAITING_FOR_SHIPMENT overlap across all three predicates", () => {
  // WAITING_FOR_SHIPMENT is simultaneously cancelable, pre-shipping-cancelable
  // and a warning status — all three predicates must agree it is `true`.
  it("is true under isCancelableOrderItemStatus, isPreShippingCancelableStatus and isWarningOrderItemStatus", () => {
    const status = ShippoCancelableStatus.WAITING_FOR_SHIPMENT
    expect(isCancelableOrderItemStatus(status)).toBe(true)
    expect(isPreShippingCancelableStatus(status)).toBe(true)
    expect(isWarningOrderItemStatus(status)).toBe(true)
  })
})
