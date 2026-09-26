import { describe, expect, it } from "vitest"
import type { BuyerOrderItem } from "@/lib/api/buyer-orders"
import {
  getTrackingLinkCount,
  isActiveShippingLinkReturn,
  resolveActiveShippingLinks,
  resolveActiveTrackingLinks,
  resolveReturnShippingLinks,
  resolveReturnTrackingLinks,
  resolveShippingLinks,
  resolveTrackingLinks,
} from "./tracking-links"

describe("active order item links", () => {
  const baseItem: BuyerOrderItem = {
    id: "item-links-1",
    userProductId: "up-links-1",
    productId: "product-links-1",
    productName: "Dental Mirror",
    price: 12,
    quantity: 1,
    status: "DELIVERED",
    productCoverPhotoPath: null,
    sellerName: "Acme",
    sellerSurname: "Store",
    trackingLinks: [{ trackingUrl: "https://carrier.example/outbound-track" }],
    shippingLinks: [{ shippingUrl: "https://carrier.example/outbound-label.pdf" }],
    updatedDate: "2026-05-20T11:00:00Z",
  }

  it("uses outbound tracking and shipping links before a return starts", () => {
    expect(resolveActiveTrackingLinks(baseItem)).toEqual([{ trackingUrl: "https://carrier.example/outbound-track" }])
    expect(resolveActiveShippingLinks(baseItem)).toEqual([
      {
        trackingUrl: "https://carrier.example/outbound-label.pdf",
        status: undefined,
        updatedDate: undefined,
      },
    ])
  })

  it("uses return tracking and return shipping links after a return starts", () => {
    const item: BuyerOrderItem = {
      ...baseItem,
      returnDate: "2026-05-21T10:00:00Z",
      returnRefundStatus: "PENDING",
      returnTrackingLinks: [{ trackingUrl: "https://carrier.example/return-track" }],
      returnShippingLinks: [{ shippingUrl: "https://carrier.example/return-label.pdf" }],
    }

    expect(resolveActiveTrackingLinks(item)).toEqual([{ trackingUrl: "https://carrier.example/return-track" }])
    expect(resolveActiveShippingLinks(item)).toEqual([
      {
        trackingUrl: "https://carrier.example/return-label.pdf",
        status: undefined,
        updatedDate: undefined,
      },
    ])
  })

  it("does not mix outbound tracking with return shipping links", () => {
    const item: BuyerOrderItem = {
      ...baseItem,
      returnDate: "2026-05-21T10:00:00Z",
      returnRefundStatus: "PENDING",
      returnTrackingLinks: [],
      returnShippingLinks: [{ shippingUrl: "https://carrier.example/return-label.pdf" }],
    }

    expect(resolveActiveTrackingLinks(item)).toEqual([])
    expect(resolveActiveShippingLinks(item)).toEqual([
      {
        trackingUrl: "https://carrier.example/return-label.pdf",
        status: undefined,
        updatedDate: undefined,
      },
    ])
  })

  // Backend contract: `hasOrderItemReturnFlowStarted` can be true (returnDate/returnRefundStatus
  // set) while BOTH return link arrays are still empty - the return was just initiated and the
  // seller hasn't generated a return label yet. In that gap the user must still see the ORIGINAL
  // outbound tracking/shipping links, not a blank panel.
  it("falls back to outbound links when a return has started but no return-specific links exist yet", () => {
    const item: BuyerOrderItem = {
      ...baseItem,
      returnDate: "2026-05-21T10:00:00Z",
      returnRefundStatus: "PENDING",
      returnTrackingLinks: [],
      returnShippingLinks: [],
    }

    expect(resolveActiveTrackingLinks(item)).toEqual([{ trackingUrl: "https://carrier.example/outbound-track" }])
    expect(resolveActiveShippingLinks(item)).toEqual([
      {
        trackingUrl: "https://carrier.example/outbound-label.pdf",
        status: undefined,
        updatedDate: undefined,
      },
    ])
  })
})

// The "Shipping Label" vs "Return Shipping Label" button text (order-item-row.tsx) is driven by
// this flag, so it must track resolveActiveShippingLinks' own branching exactly.
describe("isActiveShippingLinkReturn", () => {
  const baseItem: BuyerOrderItem = {
    id: "item-links-1",
    userProductId: "up-links-1",
    productId: "product-links-1",
    productName: "Dental Mirror",
    price: 12,
    quantity: 1,
    status: "DELIVERED",
    productCoverPhotoPath: null,
    sellerName: "Acme",
    sellerSurname: "Store",
    trackingLinks: [{ trackingUrl: "https://carrier.example/outbound-track" }],
    shippingLinks: [{ shippingUrl: "https://carrier.example/outbound-label.pdf" }],
    updatedDate: "2026-05-20T11:00:00Z",
  }

  it("is false before a return starts (normal outbound shipping label)", () => {
    expect(isActiveShippingLinkReturn(baseItem)).toBe(false)
  })

  it("is true once a return-specific shipping label exists", () => {
    const item: BuyerOrderItem = {
      ...baseItem,
      returnDate: "2026-05-21T10:00:00Z",
      returnRefundStatus: "PENDING",
      returnShippingLinks: [{ shippingUrl: "https://carrier.example/return-label.pdf" }],
    }
    expect(isActiveShippingLinkReturn(item)).toBe(true)
  })

  it("stays false when a return has started but no return-specific label exists yet (outbound fallback)", () => {
    const item: BuyerOrderItem = {
      ...baseItem,
      returnDate: "2026-05-21T10:00:00Z",
      returnRefundStatus: "PENDING",
      returnTrackingLinks: [],
      returnShippingLinks: [],
    }
    expect(isActiveShippingLinkReturn(item)).toBe(false)
  })
})

describe("getTrackingLinkCount", () => {
  const trackedItem = (id: string, url: string): BuyerOrderItem => ({
    id,
    userProductId: `up-${id}`,
    productId: "product-x",
    productName: "Item",
    price: 1,
    quantity: 1,
    status: "ON_WAY",
    productCoverPhotoPath: null,
    sellerName: "Acme",
    sellerSurname: "Store",
    trackingLinks: url ? [{ trackingUrl: url }] : [],
    updatedDate: "2026-05-20T11:00:00Z",
  })

  it("counts distinct tracking URLs across items", () => {
    const items = [trackedItem("1", "https://track/a"), trackedItem("2", "https://track/b")]
    expect(getTrackingLinkCount(items)).toBe(2)
  })

  it("deduplicates the same tracking URL shared across multiple items (one shipment, many line items)", () => {
    const items = [trackedItem("1", "https://track/shared"), trackedItem("2", "https://track/shared")]
    expect(getTrackingLinkCount(items)).toBe(1)
  })

  it("skips items with no tracking links and returns 0 for an empty item list", () => {
    expect(getTrackingLinkCount([])).toBe(0)
    expect(getTrackingLinkCount([trackedItem("1", "")])).toBe(0)
  })
})

// ---------------------------------------------------------------------------
// Priority 7: link resolvers - completing branches not covered by the pre-existing
// "active order item links" describe block above.
// ---------------------------------------------------------------------------
describe("resolveTrackingLinks / resolveShippingLinks / resolveReturnTrackingLinks / resolveReturnShippingLinks", () => {
  const base: BuyerOrderItem = {
    id: "item-links",
    userProductId: "up-links",
    productId: "product-links",
    productName: "Item",
    price: 1,
    quantity: 1,
    status: "ON_WAY",
    productCoverPhotoPath: null,
    sellerName: "Acme",
    sellerSurname: "Store",
    updatedDate: "2026-05-20T11:00:00Z",
  }

  it("resolveTrackingLinks prefers the structured trackingLinks array over the legacy string array", () => {
    const item: BuyerOrderItem = {
      ...base,
      trackingLinks: [{ trackingUrl: "https://structured" }],
      trackingLink: ["https://legacy"],
    }
    expect(resolveTrackingLinks(item)).toEqual([{ trackingUrl: "https://structured" }])
  })

  it("resolveTrackingLinks falls back to the legacy string array, mapping each URL to an object", () => {
    const item: BuyerOrderItem = { ...base, trackingLink: ["https://legacy-a", "https://legacy-b"] }
    expect(resolveTrackingLinks(item)).toEqual([
      { trackingUrl: "https://legacy-a" },
      { trackingUrl: "https://legacy-b" },
    ])
  })

  it("resolveTrackingLinks filters out entries with a missing or empty trackingUrl", () => {
    const item: BuyerOrderItem = {
      ...base,
      trackingLinks: [{ trackingUrl: "" }, { trackingUrl: "https://kept" }],
    }
    expect(resolveTrackingLinks(item)).toEqual([{ trackingUrl: "https://kept" }])
  })

  it("resolveTrackingLinks returns [] when there are no links of either shape", () => {
    expect(resolveTrackingLinks(base)).toEqual([])
  })

  it("resolveShippingLinks prefers structured shippingLinks and carries status/updatedDate through", () => {
    const item: BuyerOrderItem = {
      ...base,
      shippingLinks: [{ shippingUrl: "https://ship", status: "IN_TRANSIT", updatedDate: "2026-05-21T00:00:00Z" }],
    }
    expect(resolveShippingLinks(item)).toEqual([
      { trackingUrl: "https://ship", status: "IN_TRANSIT", updatedDate: "2026-05-21T00:00:00Z" },
    ])
  })

  it("resolveShippingLinks falls back to the legacy shippingLink string array", () => {
    const item: BuyerOrderItem = { ...base, shippingLink: ["https://legacy-ship"] }
    expect(resolveShippingLinks(item)).toEqual([{ trackingUrl: "https://legacy-ship" }])
  })

  it("resolveReturnTrackingLinks is empty when returnTrackingLinks is missing or not an array", () => {
    expect(resolveReturnTrackingLinks(base)).toEqual([])
    expect(resolveReturnTrackingLinks({ ...base, returnTrackingLinks: "not-an-array" as unknown as never })).toEqual([])
  })

  it("resolveReturnShippingLinks maps status/updatedDate through and filters empty shippingUrl", () => {
    const item: BuyerOrderItem = {
      ...base,
      returnShippingLinks: [
        { shippingUrl: "", status: "PENDING" },
        { shippingUrl: "https://return-ship", status: "DELIVERED", updatedDate: "2026-05-22T00:00:00Z" },
      ],
    }
    expect(resolveReturnShippingLinks(item)).toEqual([
      { trackingUrl: "https://return-ship", status: "DELIVERED", updatedDate: "2026-05-22T00:00:00Z" },
    ])
  })
})
