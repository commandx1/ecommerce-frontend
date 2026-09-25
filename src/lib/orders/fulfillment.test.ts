import { describe, expect, it } from "vitest"
import {
  getRefundTimelineClass,
  getTimelineDotClass,
  getTimelineLabelClass,
  resolveOrderItemFulfillmentState,
} from "./fulfillment"

// Moved verbatim from app/buyer-dashboard/orders/lib/order-view-utils.test.ts (Phase 4 §7, O1) -
// assertions unchanged.

describe("resolveOrderItemFulfillmentState", () => {
  it.each([
    {
      name: "DELIVERED -> all steps done, regardless of cancellation flags",
      input: { status: "DELIVERED", cancelledByCustomer: true },
      expected: { processing: "done", shipping: "done", delivered: "done" },
    },
    {
      name: "ON_WAY -> processing done, shipping active, delivered pending",
      input: { status: "ON_WAY" },
      expected: { processing: "done", shipping: "active", delivered: "pending" },
    },
    {
      name: "WAITING_FOR_SHIPMENT (not cancelled) -> only processing active",
      input: { status: "WAITING_FOR_SHIPMENT" },
      expected: { processing: "active", shipping: "pending", delivered: "pending" },
    },
    {
      name: "PROCESSING (initial item status) -> only processing active",
      input: { status: "PROCESSING" },
      expected: { processing: "active", shipping: "pending", delivered: "pending" },
    },
    {
      name: "CANCELLED by status text, no shipping fee charged -> processing done, rest pending",
      input: { status: "CANCELLED" },
      expected: { processing: "done", shipping: "pending", delivered: "pending" },
    },
    {
      name: "CANCELLED with cancelledWithShippingFee=true -> shipping already happened, so shipping shows done",
      input: { status: "CANCELLED", cancelledWithShippingFee: true },
      expected: { processing: "done", shipping: "done", delivered: "pending" },
    },
    {
      name: "cancelledByCustomer=true drives isCancelled even when status text doesn't say CANCEL",
      input: { status: "WAITING_FOR_SHIPMENT", cancelledByCustomer: true },
      expected: { processing: "done", shipping: "pending", delivered: "pending" },
    },
    {
      name: "cancelledBySeller=true also drives isCancelled",
      input: { status: "WAITING_FOR_SHIPMENT", cancelledBySeller: true },
      expected: { processing: "done", shipping: "pending", delivered: "pending" },
    },
    {
      name: "CANCELLATION_PENDING contains CANCEL as a substring -> treated as cancelled",
      input: { status: "CANCELLATION_PENDING" },
      expected: { processing: "done", shipping: "pending", delivered: "pending" },
    },
    {
      name: "boolean cancellation flag combined with cancelledWithShippingFee -> shipping done",
      input: { status: "WAITING_FOR_SHIPMENT", cancelledByCustomer: true, cancelledWithShippingFee: true },
      expected: { processing: "done", shipping: "done", delivered: "pending" },
    },
  ])("$name", ({ input, expected }) => {
    expect(resolveOrderItemFulfillmentState(input)).toEqual(expected)
  })

  // Moved from order-view-utils.test.ts's "status resolution survives a non-string status"
  // describe (Phase 4 §7, O1) - assertion unchanged.
  it.each([
    ["null", null],
    ["undefined", undefined],
    ["a number", 7],
  ])("tolerates a status that is %s", (_label, status) => {
    expect(() => resolveOrderItemFulfillmentState({ status } as never)).not.toThrow()
  })
})

describe("getTimelineDotClass / getTimelineLabelClass", () => {
  it.each([
    { state: "done", dotToken: "success", labelToken: "success" },
    { state: "active", dotToken: "warning", labelToken: "warning" },
    { state: "pending", dotToken: "border-soft", labelToken: "text-muted" },
  ] as const)("$state", ({ state, dotToken, labelToken }) => {
    expect(getTimelineDotClass(state)).toContain(dotToken)
    expect(getTimelineLabelClass(state)).toContain(labelToken)
  })
})

// Backend contract check (order/enums/RefundStatus.java): real values are PENDING, ON_WAY,
// DELIVERED, APPROVED, REJECTED_BY_STRIPE, REJECTED_BY_SELLER, ERROR - set from
// `item.getReturnRefundStatus().name()` in OrderMapper.java. There is no CANCELLED value on
// this enum, so `getRefundTimelineClass`'s and `formatRefundStatus`'s "CANCELLED" branches are
// unreachable with real data; not tested here per the "don't test statuses the backend can't
// produce" rule, and reported instead.
describe("getRefundTimelineClass (real RefundStatus values)", () => {
  it.each([
    { refundStatus: "APPROVED", dotToken: "success", labelToken: "success" },
    { refundStatus: "PENDING", dotToken: "warning", labelToken: "warning" },
    { refundStatus: "ON_WAY", dotToken: "warning", labelToken: "warning" },
    { refundStatus: "DELIVERED", dotToken: "warning", labelToken: "warning" },
    { refundStatus: "REJECTED_BY_STRIPE", dotToken: "warning", labelToken: "warning" },
    { refundStatus: "REJECTED_BY_SELLER", dotToken: "warning", labelToken: "warning" },
    { refundStatus: "ERROR", dotToken: "warning", labelToken: "warning" },
  ])("$refundStatus", ({ refundStatus, dotToken, labelToken }) => {
    const result = getRefundTimelineClass(refundStatus)
    expect(result.dot).toContain(dotToken)
    expect(result.label).toContain(labelToken)
  })

  it("is case-insensitive for APPROVED", () => {
    expect(getRefundTimelineClass("approved").dot).toContain("success")
  })
})
