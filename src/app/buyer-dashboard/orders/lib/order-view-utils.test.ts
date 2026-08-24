import { describe, expect, it } from "vitest"
import type { BuyerOrder, BuyerOrderItem } from "@/lib/api/buyer-orders"
import { buildBuyerOrderViewModel, resolveActiveShippingLinks, resolveActiveTrackingLinks } from "./order-view-utils"

const orderFixture: BuyerOrder = {
  orderId: "order-fixture-1",
  totalPrice: 240,
  orderStatus: "PAID",
  createdDate: "2026-05-20T10:30:00Z",
  addressTitle: "Home",
  addressFormattedAddress: "Bagdat Caddesi 10, Kadikoy / Istanbul",
  shipmentAddress: {
    title: "Home",
    fullName: "Jane Doe",
    phoneNumber: "5551234567",
    country: "TR",
    city: "Istanbul",
    district: "Kadikoy",
    postalCode: "34000",
    addressLine: "Bagdat Caddesi 10",
    formattedAddress: "Bagdat Caddesi 10, Kadikoy / Istanbul",
    latitude: 0,
    longitude: 0,
    placeId: "place-1",
  },
  cardName: "Jane Doe",
  cardBrand: "visa",
  cardLast4: "4242",
  cardExpMonth: 12,
  cardExpYear: 2030,
  sellerGroups: [
    {
      sellerId: "seller-1",
      sellerName: "Acme",
      sellerSurname: "Store",
      orderItems: [
        {
          id: "item-1",
          userProductId: "up-1",
          productId: "product-1",
          productName: "Dental Kit",
          price: 100,
          quantity: 2,
          status: "WAITING_FOR_SHIPMENT",
          productCoverPhotoPath: null,
          sellerName: "Acme",
          sellerSurname: "Store",
          shipmentPrice: 5,
          shipmentFreeBySeller: false,
          trackingLinks: [
            {
              trackingUrl: "https://track.example/1",
            },
          ],
          updatedDate: "2026-05-20T11:00:00Z",
        },
        {
          id: "item-2",
          userProductId: "up-2",
          productId: "product-2",
          productName: "Toothpaste",
          price: 30,
          quantity: 1,
          status: "DELIVERED",
          productCoverPhotoPath: null,
          sellerName: "Acme",
          sellerSurname: "Store",
          shipmentPrice: 0,
          shipmentFreeBySeller: true,
          updatedDate: "2026-05-20T11:10:00Z",
        },
      ],
    },
  ],
}

describe("buildBuyerOrderViewModel", () => {
  it("derives correct quantitative totals from raw order data", () => {
    const summary = buildBuyerOrderViewModel(orderFixture)

    expect(summary.totalQuantity).toBe(3)
    expect(summary.lineItemCount).toBe(2)

    // Item total should include quantity multipliers.
    expect(summary.itemTotal).toBe(230)
    expect(summary.totalAmountFromItemPrices).toBe(230)

    // Shipping should include per-item shipment fee multiplied by quantity.
    expect(summary.shippingTotal).toBe(10)

    // Net total should reflect backend totalPrice when present.
    expect(summary.money.netTotal).toBe(240)
    expect(summary.money.tax).toBe(0)
  })

  it("derives tracking count and seller summary correctly", () => {
    const summary = buildBuyerOrderViewModel(orderFixture)

    expect(summary.trackingCount).toBe(1)
    expect(summary.sellerCount).toBe(1)
    expect(summary.sellerSummary.primarySeller).toBe("Acme Store")
    expect(summary.sellerSummary.moreCount).toBe(0)
  })

  it("returns zero tracking count when no tracking links exist", () => {
    const firstGroup = orderFixture.sellerGroups?.[0]
    const firstItem = firstGroup?.orderItems?.[0]
    if (!firstItem) {
      throw new Error("Fixture is missing its first order item")
    }
    const noTrackingOrder: BuyerOrder = {
      ...orderFixture,
      orderId: "order-fixture-2",
      sellerGroups: [
        {
          sellerId: "seller-2",
          sellerName: "Beta",
          sellerSurname: "Market",
          orderItems: [
            {
              ...firstItem,
              id: "item-3",
              userProductId: "up-3",
              productName: "Mouthwash",
              quantity: 1,
              price: 80,
              shipmentPrice: 0,
              shipmentFreeBySeller: true,
              trackingLinks: [],
            },
          ],
        },
      ],
    }

    const summary = buildBuyerOrderViewModel(noTrackingOrder)
    expect(summary.trackingCount).toBe(0)
  })
})

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
})
