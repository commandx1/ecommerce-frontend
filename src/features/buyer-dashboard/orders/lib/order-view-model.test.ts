import { describe, expect, it } from "vitest"
import type { BuyerOrder, BuyerOrderItem, BuyerOrderSellerGroup } from "@/lib/api/buyer-orders"
import {
  buildBuyerOrderViewModel,
  getAddressSummary,
  getOrderItems,
  getOrderSellerGroups,
  getOrderStatusBadgeClasses,
  getOrderStatusLabel,
  getPaymentViewStatusClasses,
  getPaymentViewStatusLabel,
  getSellerSummary,
  resolveOrderItemProductId,
  resolveOrderViewStatus,
  resolvePaymentSummary,
  resolvePaymentViewStatus,
} from "./order-view-model"

const orderFixture: BuyerOrder = {
  orderId: "order-fixture-1",
  totalPrice: 235,
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

    // `shipmentPrice` is already the LINE TOTAL from the backend - it must NOT be multiplied
    // by quantity again (item-1: shipmentPrice 5, item-2: shipmentPrice 0 -> total 5).
    expect(summary.shippingTotal).toBe(5)

    // Net total should reflect backend totalPrice when present.
    expect(summary.money.netTotal).toBe(235)
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

// C axis: `sellerGroups` and `orderItems` are List<T> fields on the backend DTOs -
// nullable Java references, not DB-constrained columns - so a malformed 200 body can
// plausibly omit or null them. The nested `group.orderItems` list is the same shape
// of bug the vendor side hit in F46/F77 (TEST-FINDINGS.md): a missing/non-array nested
// list must degrade to "no items", not throw.
/**
 * The string form of infra note #26. Callers map over every order, so one malformed record used to
 * throw inside `.toUpperCase()` and unmount the whole list - a single bad row blanked the page for
 * everyone. Guarded at the source here rather than at each component boundary.
 */
describe("status resolution survives a non-string status", () => {
  it.each([
    ["null", null],
    ["undefined", undefined],
    ["a number", 7],
    ["an object", {}],
  ])("resolveOrderViewStatus tolerates an order status that is %s", (_label, orderStatus) => {
    const order = { ...orderFixture, orderStatus } as unknown as BuyerOrder

    expect(() => resolveOrderViewStatus(order, [])).not.toThrow()
  })

  it.each([
    ["null", null],
    ["undefined", undefined],
    ["a number", 7],
  ])("resolveOrderViewStatus tolerates an item status that is %s", (_label, status) => {
    const items = [{ ...orderFixture.orderItems?.[0], status }] as unknown as BuyerOrderItem[]

    expect(() => resolveOrderViewStatus(orderFixture, items)).not.toThrow()
  })

  it("resolveOrderViewStatus tolerates a non-array item list", () => {
    expect(() => resolveOrderViewStatus(orderFixture, {} as unknown as BuyerOrderItem[])).not.toThrow()
  })
})

describe("getOrderItems / getOrderSellerGroups survive malformed nested data", () => {
  const minimalOrder: BuyerOrder = {
    orderId: "order-malformed",
    totalPrice: 0,
    orderStatus: "PAID",
    createdDate: "2026-05-20T10:30:00Z",
    addressTitle: "Home",
    addressFormattedAddress: "Address",
  }

  it.each([
    { name: "no sellerGroups and no orderItems", order: minimalOrder },
    { name: "sellerGroups is an empty array", order: { ...minimalOrder, sellerGroups: [] } },
    // biome-ignore lint/suspicious/noExplicitAny: deliberately malformed to mirror a bad 200 body
    { name: "sellerGroups is null", order: { ...minimalOrder, sellerGroups: null as any } },
    {
      name: "a seller group's orderItems is missing",
      order: {
        ...minimalOrder,
        sellerGroups: [
          // biome-ignore lint/suspicious/noExplicitAny: deliberately malformed to mirror a bad 200 body
          { sellerId: "s1", sellerName: "Acme", sellerSurname: "Store" } as any,
        ],
      },
    },
    {
      name: "a seller group's orderItems is null",
      order: {
        ...minimalOrder,
        sellerGroups: [
          // biome-ignore lint/suspicious/noExplicitAny: deliberately malformed to mirror a bad 200 body
          { sellerId: "s1", sellerName: "Acme", sellerSurname: "Store", orderItems: null as any },
        ],
      },
    },
  ])("$name -> empty items, no throw", ({ order }) => {
    expect(() => getOrderItems(order)).not.toThrow()
    expect(getOrderItems(order)).toEqual([])

    expect(() => getOrderSellerGroups(order)).not.toThrow()

    expect(() => buildBuyerOrderViewModel(order)).not.toThrow()
    const summary = buildBuyerOrderViewModel(order)
    expect(summary.orderItems).toEqual([])
    expect(summary.totalQuantity).toBe(0)
    expect(summary.lineItemCount).toBe(0)
  })

  it("normalizes a seller group's non-array orderItems to an empty list instead of dropping the group", () => {
    const order: BuyerOrder = {
      ...minimalOrder,
      sellerGroups: [
        {
          sellerId: "s1",
          sellerName: "Acme",
          sellerSurname: "Store",
          // biome-ignore lint/suspicious/noExplicitAny: deliberately malformed to mirror a bad 200 body
          orderItems: "not-an-array" as any,
        },
      ],
    }

    const groups = getOrderSellerGroups(order)
    expect(groups).toHaveLength(1)
    expect(groups[0]!.orderItems).toEqual([])
  })
})

// QA DB proof: order.totalPrice = Sum(price*qty) + Sum(shipmentPrice) + Sum(takedHeavyShipmentFee)
// + Sum(taxPrice). Example: qty 2 x 55.30, shipmentPrice 12.99, heavy 50, tax 0 -> totalPrice 173.59.
describe("buildBuyerOrderViewModel - heavy shipment fee and tax totals", () => {
  const order: BuyerOrder = {
    orderId: "order-heavy-1",
    totalPrice: 173.59,
    orderStatus: "PAID",
    createdDate: "2026-05-20T10:30:00Z",
    addressTitle: "Home",
    addressFormattedAddress: "Address",
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
            productName: "Heavy Dental Chair",
            price: 55.3,
            quantity: 2,
            status: "WAITING_FOR_SHIPMENT",
            productCoverPhotoPath: null,
            sellerName: "Acme",
            sellerSurname: "Store",
            shipmentPrice: 12.99,
            takedHeavyShipmentFee: 50,
            taxPrice: 0,
            updatedDate: "2026-05-20T11:00:00Z",
          },
        ],
      },
    ],
  }

  it("sums heavyShipmentTotal and taxTotal, and the backend total (net) reflects them", () => {
    const summary = buildBuyerOrderViewModel(order)
    expect(summary.itemTotal).toBe(110.6)
    expect(summary.shippingTotal).toBe(12.99)
    expect(summary.heavyShipmentTotal).toBe(50)
    expect(summary.taxTotal).toBe(0)
    expect(summary.money.netTotal).toBeCloseTo(173.59, 10)
  })
})

// ---------------------------------------------------------------------------
// Priority 2: order + payment status.
//
// Backend contract check (order/enums/OrderStatus.java, order/enums/OrderItemStatus.java,
// order/service/OrderService.java, OrderCreationService.java): the Order-level `orderStatus`
// is ONLY ever set to PENDING_PAYMENT, PAYMENT_FAILED, PAYMENT_SUCCESS, PAYMENT_ERROR_by_STRIPE,
// or SHIPMENT_ERROR by the running code (`OrderService.java:275,283,287,301` / `OrderCreationService`).
// The enum also declares PROCESSING/ON_WAY/DELIVERED/CANCELLED/REFUNDED, but nothing in the
// service layer ever assigns them to an Order (the enum's own source comment even flags
// ON_WAY/DELIVERED/CANCELLED as "gerek yok bence çıkarılabilir" - not needed). Item-level
// `status` (OrderItemStatus) is what actually carries WAITING_FOR_SHIPMENT/PROCESSING/ON_WAY/
// DELIVERED/CANCELLED/etc.
//
// Consequence verified below: `resolveOrderViewStatus`'s "shipped" branch (order status
// includes "SHIPPED", or item status includes SHIPPED/IN_TRANSIT/OUT_FOR_DELIVERY/DELIVERY)
// is UNREACHABLE with real backend data today - no enum value on either side contains those
// tokens. Only "processing" (default), "shipping" (item ON_WAY), and "delivered" (item/order
// DELIVERED) are reachable. Tested here as documented, intentional pattern-matching (not as a
// "this happens in prod" scenario) so a future regression in the matching logic itself is still
// caught; the dead branch is reported to the user rather than deleted (source is out of scope).
// ---------------------------------------------------------------------------
describe("resolveOrderViewStatus", () => {
  const item = (status: string, extra: Partial<BuyerOrderItem> = {}): BuyerOrderItem => ({
    id: `item-${status}`,
    userProductId: `up-${status}`,
    productId: "product-x",
    productName: "Item",
    price: 10,
    quantity: 1,
    status,
    productCoverPhotoPath: null,
    sellerName: "Acme",
    sellerSurname: "Store",
    updatedDate: "2026-05-20T11:00:00Z",
    ...extra,
  })

  const order = (orderStatus: string): BuyerOrder => ({
    orderId: "order-x",
    totalPrice: 10,
    orderStatus,
    createdDate: "2026-05-20T10:30:00Z",
    addressTitle: "Home",
    addressFormattedAddress: "Address",
  })

  it.each([
    {
      name: "no items, order PAYMENT_SUCCESS -> processing (default)",
      orderStatus: "PAYMENT_SUCCESS",
      items: [],
      expected: "processing",
    },
    {
      name: "no items, order PENDING_PAYMENT -> processing",
      orderStatus: "PENDING_PAYMENT",
      items: [],
      expected: "processing",
    },
    {
      name: "an item is DELIVERED -> delivered, even though order-level status never reaches DELIVERED in practice",
      orderStatus: "PAYMENT_SUCCESS",
      items: [item("WAITING_FOR_SHIPMENT"), item("DELIVERED")],
      expected: "delivered",
    },
    {
      name: "an item is ON_WAY (and none delivered) -> shipping",
      orderStatus: "PAYMENT_SUCCESS",
      items: [item("WAITING_FOR_SHIPMENT"), item("ON_WAY")],
      expected: "shipping",
    },
    {
      name: "DELIVERED wins over ON_WAY when both are present (delivered checked first)",
      orderStatus: "PAYMENT_SUCCESS",
      items: [item("ON_WAY"), item("DELIVERED")],
      expected: "delivered",
    },
    {
      name: "all items WAITING_FOR_SHIPMENT -> processing",
      orderStatus: "PAYMENT_SUCCESS",
      items: [item("WAITING_FOR_SHIPMENT"), item("WAITING_FOR_SHIPMENT")],
      expected: "processing",
    },
    {
      name: "an item is CANCELLED (no other progress) -> processing (there is no dedicated cancelled view status)",
      orderStatus: "PAYMENT_SUCCESS",
      items: [item("CANCELLED")],
      expected: "processing",
    },
    {
      name: "order-level orderStatus alone being ON_WAY does NOT produce shipping without an ON_WAY item",
      orderStatus: "ON_WAY",
      items: [item("WAITING_FOR_SHIPMENT")],
      expected: "processing",
    },
    {
      name: "order-level orderStatus DELIVERED alone (no items) does drive delivered",
      orderStatus: "DELIVERED",
      items: [],
      expected: "delivered",
    },
  ])("$name", ({ orderStatus, items, expected }) => {
    expect(resolveOrderViewStatus(order(orderStatus), items)).toBe(expected)
  })
})

describe("getOrderStatusLabel / getOrderStatusBadgeClasses", () => {
  it.each([
    { status: "delivered", label: "Delivered", classToken: "success" },
    { status: "shipped", label: "Shipped", classToken: "brand" },
    { status: "shipping", label: "Shipping", classToken: "warning" },
    { status: "processing", label: "Processing", classToken: "warning" },
  ] as const)("$status -> label '$label', class contains '$classToken'", ({ status, label, classToken }) => {
    expect(getOrderStatusLabel(status)).toBe(label)
    expect(getOrderStatusBadgeClasses(status)).toContain(classToken)
  })
})

// Backend contract check (order/enums/OrderStatus.java): only PENDING_PAYMENT, PAYMENT_FAILED,
// PAYMENT_SUCCESS, PAYMENT_ERROR_by_STRIPE, and SHIPMENT_ERROR are ever assigned to an order.
describe("resolvePaymentViewStatus (real order-level OrderStatus values)", () => {
  it.each([
    { orderStatus: "PENDING_PAYMENT", expected: "pending" },
    { orderStatus: "PAYMENT_FAILED", expected: "failed" },
    { orderStatus: "PAYMENT_SUCCESS", expected: "paid" },
    { orderStatus: "PAYMENT_ERROR_by_STRIPE", expected: "unknown" },
    { orderStatus: "SHIPMENT_ERROR", expected: "unknown" },
  ])("$orderStatus -> $expected", ({ orderStatus, expected }) => {
    expect(resolvePaymentViewStatus(orderStatus)).toBe(expected)
  })

  // Defensive branches: declared on the enum but never assigned to an Order by the running
  // backend code today (see the block comment above `resolveOrderViewStatus`). Locking the
  // matching logic in case the backend contract changes; report flags these as currently dead.
  it.each([
    { orderStatus: "REFUNDED", expected: "refunded" },
    { orderStatus: "PROCESSING", expected: "pending" },
    { orderStatus: "SOME_UNRECOGNIZED_STATE", expected: "unknown" },
  ])("defensive: $orderStatus -> $expected", ({ orderStatus, expected }) => {
    expect(resolvePaymentViewStatus(orderStatus)).toBe(expected)
  })

  it("is case-insensitive", () => {
    expect(resolvePaymentViewStatus("payment_success")).toBe("paid")
  })
})

describe("getPaymentViewStatusLabel / getPaymentViewStatusClasses", () => {
  it.each([
    { status: "paid", label: "Paid", classToken: "success" },
    { status: "pending", label: "Pending", classToken: "warning" },
    { status: "failed", label: "Failed", classToken: "danger" },
    { status: "refunded", label: "Refunded", classToken: "brand" },
    { status: "unknown", label: "Unknown", classToken: "text-muted" },
  ] as const)("$status -> label '$label', class contains '$classToken'", ({ status, label, classToken }) => {
    expect(getPaymentViewStatusLabel(status)).toBe(label)
    expect(getPaymentViewStatusClasses(status)).toContain(classToken)
  })
})

// ---------------------------------------------------------------------------
// Priority 3: per-item fulfillment timeline (processing / shipping / delivered dots).
// Backend contract: OrderItemStatus real values are WAITING_FOR_SHIPMENT,
// WAITING_FOR_UBER_DIRECT, SHIPMENT_ERROR, UBER_ERROR, PAYMENT_FAILED, PROCESSING, ON_WAY,
// DELIVERED, CANCELLED, CANCELLATION_PENDING, CANCELLED_ONLY_ITEMS, REFUNDED, RETURNED,
// SELLER_REJECTED_RETURN (order/enums/OrderItemStatus.java). None of them contain "SHIPPED",
// "IN_TRANSIT", "OUT_FOR_DELIVERY" or "DELIVERY" as a substring (note: "DELIVERED" does NOT
// contain "DELIVERY"), so the extra token list backing `isShipped` is unreachable with real
// item statuses; only ON_WAY reaches the "shipping" step. Reported, not removed (out of scope).
// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
// Priority 5: `resolveOrderItemProductId` field-name fallback chain.
// The backend DTO (`BuyerOrderItemResponse.java`) only ever serializes `productId` (Jackson
// camelCase from the Java field). `productID`/`product_id`/nested `product.id` are defensive
// fallbacks for shapes the frontend type doesn't actually see from this endpoint today; still
// worth locking since the function explicitly encodes a priority order and a whitespace guard.
// ---------------------------------------------------------------------------
describe("resolveOrderItemProductId", () => {
  const base: BuyerOrderItem = {
    id: "item-pid",
    userProductId: "up-pid",
    productName: "Item",
    price: 1,
    quantity: 1,
    status: "PROCESSING",
    productCoverPhotoPath: null,
    sellerName: "Acme",
    sellerSurname: "Store",
    updatedDate: "2026-05-20T11:00:00Z",
  }

  it("prefers productId over productID, product_id, and nested product.id", () => {
    const item = {
      ...base,
      productId: "from-productId",
      productID: "from-productID",
      product_id: "from-product_id",
      product: { id: "from-nested" },
    } as unknown as BuyerOrderItem
    expect(resolveOrderItemProductId(item)).toBe("from-productId")
  })

  it("falls back to productID when productId is absent", () => {
    const item = { ...base, productID: "from-productID", product_id: "from-product_id" } as unknown as BuyerOrderItem
    expect(resolveOrderItemProductId(item)).toBe("from-productID")
  })

  it("falls back to product_id when productId and productID are absent", () => {
    const item = { ...base, product_id: "from-product_id" } as unknown as BuyerOrderItem
    expect(resolveOrderItemProductId(item)).toBe("from-product_id")
  })

  it("falls back to nested product.id when no direct field matches", () => {
    const item = { ...base, product: { id: "nested-id" } } as unknown as BuyerOrderItem
    expect(resolveOrderItemProductId(item)).toBe("nested-id")
  })

  it("skips a whitespace-only productId and uses the next candidate", () => {
    const item = { ...base, productId: "   ", productID: "from-productID" } as unknown as BuyerOrderItem
    expect(resolveOrderItemProductId(item)).toBe("from-productID")
  })

  it("skips a whitespace-only nested product.id and returns null", () => {
    const item = { ...base, product: { id: "  " } } as unknown as BuyerOrderItem
    expect(resolveOrderItemProductId(item)).toBeNull()
  })

  it("ignores a non-string productId (e.g. a number) and falls through", () => {
    const item = { ...base, productId: 12345, productID: "from-productID" } as unknown as BuyerOrderItem
    expect(resolveOrderItemProductId(item)).toBe("from-productID")
  })

  it("returns null when no candidate field is present anywhere", () => {
    expect(resolveOrderItemProductId(base)).toBeNull()
  })

  it("returns null when a nested product exists but is not an object with an id", () => {
    const item = { ...base, product: "not-an-object" } as unknown as BuyerOrderItem
    expect(resolveOrderItemProductId(item)).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// Priority 6
// ---------------------------------------------------------------------------
describe("getAddressSummary", () => {
  it("uses the address's own title and formattedAddress when present", () => {
    expect(
      getAddressSummary(
        {
          title: "Home",
          fullName: "Jane Doe",
          phoneNumber: "555",
          country: "TR",
          city: "Istanbul",
          district: "Kadikoy",
          postalCode: "34000",
          addressLine: "Line 1",
          formattedAddress: "Formatted Line 1, Kadikoy",
          latitude: 0,
          longitude: 0,
          placeId: "p1",
        },
        "fallback title",
        "fallback line",
      ),
    ).toEqual({ title: "Home", line: "Formatted Line 1, Kadikoy" })
  })

  it("falls back to addressLine when formattedAddress is empty", () => {
    expect(
      getAddressSummary({
        title: "Home",
        fullName: "Jane Doe",
        phoneNumber: "555",
        country: "TR",
        city: "Istanbul",
        district: "Kadikoy",
        postalCode: "34000",
        addressLine: "Line 1 only",
        formattedAddress: "",
        latitude: 0,
        longitude: 0,
        placeId: "p1",
      }),
    ).toEqual({ title: "Home", line: "Line 1 only" })
  })

  it("falls back to '-' when the address's own title/formattedAddress/addressLine are all empty", () => {
    expect(
      getAddressSummary({
        title: "",
        fullName: "Jane Doe",
        phoneNumber: "555",
        country: "TR",
        city: "Istanbul",
        district: "Kadikoy",
        postalCode: "34000",
        addressLine: "",
        formattedAddress: "",
        latitude: 0,
        longitude: 0,
        placeId: "p1",
      }),
    ).toEqual({ title: "-", line: "-" })
  })

  it("uses fallbackTitle/fallbackLine when there is no address object at all", () => {
    expect(getAddressSummary(undefined, "Fallback Title", "Fallback Line")).toEqual({
      title: "Fallback Title",
      line: "Fallback Line",
    })
  })

  it("uses '-' when there is no address and no fallbacks", () => {
    expect(getAddressSummary(undefined)).toEqual({ title: "-", line: "-" })
  })
})

describe("getSellerSummary", () => {
  const group = (overrides: Partial<BuyerOrderSellerGroup>): BuyerOrderSellerGroup => ({
    sellerId: "s1",
    sellerName: "Acme",
    sellerSurname: "Store",
    orderItems: [],
    ...overrides,
  })

  it("returns 'Unknown Seller' with moreCount 0 when there are no seller groups", () => {
    expect(getSellerSummary([])).toEqual({ primarySeller: "Unknown Seller", moreCount: 0 })
  })

  it("joins sellerName and sellerSurname for a single seller, moreCount 0", () => {
    expect(getSellerSummary([group({ sellerName: "Acme", sellerSurname: "Store" })])).toEqual({
      primarySeller: "Acme Store",
      moreCount: 0,
    })
  })

  it("counts remaining sellers as moreCount, using only the FIRST seller for primarySeller", () => {
    expect(
      getSellerSummary([
        group({ sellerId: "s1", sellerName: "Acme", sellerSurname: "Store" }),
        group({ sellerId: "s2", sellerName: "Beta", sellerSurname: "Market" }),
        group({ sellerId: "s3", sellerName: "Gamma", sellerSurname: "Shop" }),
      ]),
    ).toEqual({ primarySeller: "Acme Store", moreCount: 2 })
  })

  it("falls back to 'Seller' when the first seller has no name or surname", () => {
    expect(getSellerSummary([group({ sellerName: "", sellerSurname: "" })])).toEqual({
      primarySeller: "Seller",
      moreCount: 0,
    })
  })

  it("trims a trailing space when only sellerName is present", () => {
    expect(getSellerSummary([group({ sellerName: "Acme", sellerSurname: "" })])).toEqual({
      primarySeller: "Acme",
      moreCount: 0,
    })
  })
})

describe("resolvePaymentSummary", () => {
  const baseOrder: BuyerOrder = {
    orderId: "order-x",
    totalPrice: 100,
    orderStatus: "PAYMENT_SUCCESS",
    createdDate: "2026-05-20T10:30:00Z",
    addressTitle: "Home",
    addressFormattedAddress: "Address",
  }

  it("uses card brand + last4 as the title, uppercasing the brand", () => {
    const result = resolvePaymentSummary({ ...baseOrder, cardBrand: "visa", cardLast4: "4242" })
    expect(result.title).toBe("VISA •••• 4242")
  })

  it("includes name and expiration in the detail when both are present", () => {
    const result = resolvePaymentSummary({
      ...baseOrder,
      cardBrand: "visa",
      cardLast4: "4242",
      cardName: "Jane Doe",
      cardExpMonth: 3,
      cardExpYear: 2030,
    })
    expect(result.detail).toBe("Jane Doe • Exp 03/2030")
  })

  it("pads a single-digit expiration month with a leading zero", () => {
    const result = resolvePaymentSummary({
      ...baseOrder,
      cardBrand: "visa",
      cardLast4: "4242",
      cardExpMonth: 3,
      cardExpYear: 2030,
    })
    expect(result.detail).toContain("Exp 03/2030")
  })

  it("omits the expiration segment when either cardExpMonth or cardExpYear is missing", () => {
    const result = resolvePaymentSummary({
      ...baseOrder,
      cardBrand: "visa",
      cardLast4: "4242",
      cardName: "Jane Doe",
      cardExpMonth: null,
      cardExpYear: 2030,
    })
    expect(result.detail).toBe("Jane Doe")
  })

  it("falls back detail to 'Card payment' when there is a card but no name and no expiration", () => {
    const result = resolvePaymentSummary({ ...baseOrder, cardBrand: "visa", cardLast4: "4242" })
    expect(result.detail).toBe("Card payment")
  })

  it("uses cardName alone (no brand/last4) as the title with a generic 'Card payment' detail", () => {
    const result = resolvePaymentSummary({ ...baseOrder, cardName: "Jane Doe" })
    expect(result).toEqual({ title: "Jane Doe", detail: "Card payment" })
  })

  it("returns a placeholder when there is no card info at all", () => {
    expect(resolvePaymentSummary(baseOrder)).toEqual({ title: "-", detail: "" })
  })
})
