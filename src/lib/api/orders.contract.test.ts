import { HttpResponse, http } from "msw"
import { beforeEach, describe, expect, it } from "vitest"
import { server } from "@/mocks/server"
import { makeApiSavedCard } from "@/test/factories"
import { type GetPaymentStatusResponse, ordersAPI, type PlaceOrderPayload, type PlaceOrderResponse } from "./orders"

const placedOrder: PlaceOrderResponse = {
  orderId: "order-1",
  totalPrice: 248.5,
  status: "PENDING_PAYMENT",
  paymentStatus: "requires_confirmation",
  createdDate: "2026-05-20T10:30:00Z",
  clientSecret: "pi_123_secret_abc",
  orderItems: [
    {
      id: "item-1",
      userProductId: "up-1",
      productId: "p-1",
      productName: "Dental Kit",
      productCoverPhotoPath: "/uploads/kit.png",
      price: 100,
      quantity: 2,
      status: "WAITING_FOR_SHIPMENT",
      shippingLink: [],
      trackingLink: [],
      updatedDate: null,
    },
  ],
}

let capturedPlaceOrderBody: Record<string, unknown> | null = null

/**
 * These handlers capture the outgoing request bodies so the assertions below can pin the exact
 * wire contract. They are registered per test because the global setup resets handlers after
 * every test case.
 */
beforeEach(() => {
  capturedPlaceOrderBody = null

  server.use(
    http.post("*/backend-api/orders", async ({ request }) => {
      capturedPlaceOrderBody = (await request.json()) as Record<string, unknown>
      return HttpResponse.json(placedOrder)
    }),
  )
})

describe("ordersAPI.placeOrder contract", () => {
  const basePayload: PlaceOrderPayload = {
    addressId: "addr-1",
    cartId: "cart-1",
    shippoRateOrders: [
      {
        shippoRateId: "rate-usps-1",
        userId: "seller-1",
        products: [{ userProductId: "up-1", quantity: 2, autoOrder: null }],
      },
    ],
    uberRateOrders: [],
  }

  it("returns a typed order with numeric money fields", async () => {
    const response = await ordersAPI.placeOrder(basePayload)

    expect(response.orderId).toBe("order-1")
    expect(typeof response.totalPrice).toBe("number")
    expect(response.totalPrice).toBe(248.5)
    expect(response.clientSecret).toBe("pi_123_secret_abc")
    expect(response.orderItems).toHaveLength(1)
    expect(typeof response.orderItems[0]?.price).toBe("number")
    expect(typeof response.orderItems[0]?.quantity).toBe("number")
    expect(response.orderItems[0]?.updatedDate).toBeNull()
  })

  it("sends the shipping selections split per carrier, one entry per vendor", async () => {
    await ordersAPI.placeOrder({
      addressId: "addr-1",
      cartId: "cart-1",
      shippoRateOrders: [
        {
          shippoRateId: "rate-usps-1",
          userId: "seller-1",
          products: [{ userProductId: "up-1", quantity: 2, autoOrder: null }],
        },
        {
          shippoRateId: "rate-ups-9",
          userId: "seller-2",
          products: [{ userProductId: "up-2", quantity: 1, autoOrder: "ONE_MONTH" }],
        },
      ],
      uberRateOrders: [
        {
          uberRateId: "uber-quote-7",
          userId: "seller-3",
          products: [{ userProductId: "up-3", quantity: 4, autoOrder: null }],
        },
      ],
    })

    // Shippo and Uber selections travel in two separate arrays keyed by vendor (`userId`);
    // a vendor never appears in both.
    expect(capturedPlaceOrderBody).toEqual({
      addressId: "addr-1",
      cartId: "cart-1",
      shippoRateOrders: [
        {
          shippoRateId: "rate-usps-1",
          userId: "seller-1",
          products: [{ userProductId: "up-1", quantity: 2, autoOrder: null }],
        },
        {
          shippoRateId: "rate-ups-9",
          userId: "seller-2",
          products: [{ userProductId: "up-2", quantity: 1, autoOrder: "ONE_MONTH" }],
        },
      ],
      uberRateOrders: [
        {
          uberRateId: "uber-quote-7",
          userId: "seller-3",
          products: [{ userProductId: "up-3", quantity: 4, autoOrder: null }],
        },
      ],
    })
  })

  it("omits every optional payment field when the caller does not set one", async () => {
    await ordersAPI.placeOrder(basePayload)

    const body = capturedPlaceOrderBody as Record<string, unknown>
    expect(Object.keys(body).sort()).toEqual(["addressId", "cartId", "shippoRateOrders", "uberRateOrders"])
    expect("paymentMethodId" in body).toBe(false)
    expect("cardSave" in body).toBe(false)
    expect("openToAutoOrder" in body).toBe(false)
    expect("cardOpenToAutoPayment" in body).toBe(false)
    expect("cardAutoOrderCard" in body).toBe(false)
  })

  it("sends the new-card save flags together with the payment method", async () => {
    await ordersAPI.placeOrder({
      ...basePayload,
      paymentMethodId: "pm_new_card",
      cardSave: true,
      cardName: "Clinic Amex",
      cardOpenToAutoPayment: true,
      cardAutoOrderCard: true,
    })

    expect(capturedPlaceOrderBody).toMatchObject({
      paymentMethodId: "pm_new_card",
      cardSave: true,
      cardName: "Clinic Amex",
      cardOpenToAutoPayment: true,
      cardAutoOrderCard: true,
    })
    // `openToAutoOrder` is the saved-card upgrade consent and must not ride along on a new card.
    expect("openToAutoOrder" in (capturedPlaceOrderBody as Record<string, unknown>)).toBe(false)
  })

  it("sends openToAutoOrder alone when an existing saved card is upgraded", async () => {
    await ordersAPI.placeOrder({
      ...basePayload,
      paymentMethodId: "pm_saved_card",
      cardSave: false,
      cardName: "",
      openToAutoOrder: true,
    })

    expect(capturedPlaceOrderBody).toMatchObject({
      paymentMethodId: "pm_saved_card",
      cardSave: false,
      cardName: "",
      openToAutoOrder: true,
    })
    // The card-save mandate flags are mutually exclusive with the saved-card upgrade path.
    const body = capturedPlaceOrderBody as Record<string, unknown>
    expect("cardOpenToAutoPayment" in body).toBe(false)
    expect("cardAutoOrderCard" in body).toBe(false)
  })

  it("keeps an explicit null autoOrder in the JSON instead of dropping the key", async () => {
    await ordersAPI.placeOrder(basePayload)

    const products = (capturedPlaceOrderBody as { shippoRateOrders: { products: Record<string, unknown>[] }[] })
      .shippoRateOrders[0]?.products
    expect(products?.[0]).toEqual({ userProductId: "up-1", quantity: 2, autoOrder: null })
    expect("autoOrder" in (products?.[0] ?? {})).toBe(true)
  })

  it("accepts an order with no shipping selections at all", async () => {
    server.use(
      http.post("*/backend-api/orders", async ({ request }) => {
        capturedPlaceOrderBody = (await request.json()) as Record<string, unknown>
        return HttpResponse.json({ ...placedOrder, orderItems: [], clientSecret: undefined, totalPrice: 0 })
      }),
    )

    const response = await ordersAPI.placeOrder({ addressId: "addr-1", shippoRateOrders: [], uberRateOrders: [] })

    expect(capturedPlaceOrderBody).toEqual({ addressId: "addr-1", shippoRateOrders: [], uberRateOrders: [] })
    expect(response.orderItems).toEqual([])
    expect(response.clientSecret).toBeUndefined()
  })

  it.each([
    [400, "Cart is empty"],
    [403, "Your account is not approved for ordering"],
    [404, "Address not found"],
    [409, "A product in your cart is out of stock"],
    [500, "Internal server error"],
  ])("rejects on %i", async (status, message) => {
    server.use(http.post("*/backend-api/orders", () => HttpResponse.json({ message }, { status })))

    await expect(ordersAPI.placeOrder(basePayload)).rejects.toMatchObject({
      response: { status, data: { message } },
    })
  })

  it("flags a 401 as auth-handled so callers stay quiet while the session is torn down", async () => {
    server.use(
      http.post("*/backend-api/orders", () => HttpResponse.json({ message: "Session expired" }, { status: 401 })),
    )

    const error = await ordersAPI.placeOrder(basePayload).catch((caught: unknown) => caught)

    expect((error as { authHandled?: boolean }).authHandled).toBe(true)
  })

  it("rejects on a network failure", async () => {
    server.use(http.post("*/backend-api/orders", () => HttpResponse.error()))

    await expect(ordersAPI.placeOrder(basePayload)).rejects.toThrow()
  })
})

describe("ordersAPI.getPaymentStatus contract", () => {
  function makePaymentStatus(overrides: Partial<GetPaymentStatusResponse> = {}): GetPaymentStatusResponse {
    return {
      paymentIntentId: "pi_123",
      status: "requires_confirmation",
      amount: 24850,
      currency: "usd",
      clientSecret: "pi_123_secret_abc",
      error: null,
      ...overrides,
    }
  }

  it("returns the typed payment intent snapshot", async () => {
    server.use(
      http.get("*/backend-api/orders/payment/:paymentIntentId", ({ params }) =>
        HttpResponse.json(makePaymentStatus({ paymentIntentId: String(params.paymentIntentId) })),
      ),
    )

    const response = await ordersAPI.getPaymentStatus("pi_123")

    expect(response.paymentIntentId).toBe("pi_123")
    expect(response.status).toBe("requires_confirmation")
    // Stripe reports the amount in the currency's minor unit (cents), not dollars.
    expect(typeof response.amount).toBe("number")
    expect(response.amount).toBe(24850)
    expect(response.currency).toBe("usd")
    expect(response.error).toBeNull()
  })

  it("puts the payment intent id in the path, not a query param", async () => {
    let capturedPath: string | null = null
    let capturedQuery: string | null = null
    server.use(
      http.get("*/backend-api/orders/payment/:paymentIntentId", ({ request }) => {
        const url = new URL(request.url)
        capturedPath = url.pathname
        capturedQuery = url.search
        return HttpResponse.json(makePaymentStatus())
      }),
    )

    await ordersAPI.getPaymentStatus("pi_abc_XYZ-1")

    expect(capturedPath).toBe("/backend-api/orders/payment/pi_abc_XYZ-1")
    expect(capturedQuery).toBe("")
  })

  it("surfaces a PENDING -> PENDING -> SUCCEEDED progression across repeated polls", async () => {
    const statuses = ["processing", "processing", "succeeded"]
    let calls = 0
    server.use(
      http.get("*/backend-api/orders/payment/:paymentIntentId", () => {
        const status = statuses[Math.min(calls, statuses.length - 1)] ?? "succeeded"
        calls += 1
        return HttpResponse.json(makePaymentStatus({ status }))
      }),
    )

    // orders.ts is a plain request-per-call client: the retry loop and the 3s wait live in
    // `useFinalReview`, so a caller sees exactly one HTTP round trip per invocation.
    const first = await ordersAPI.getPaymentStatus("pi_123")
    const second = await ordersAPI.getPaymentStatus("pi_123")
    const third = await ordersAPI.getPaymentStatus("pi_123")

    expect([first.status, second.status, third.status]).toEqual(["processing", "processing", "succeeded"])
    expect(calls).toBe(3)
  })

  it("reports a terminal failure with the error message attached", async () => {
    server.use(
      http.get("*/backend-api/orders/payment/:paymentIntentId", () =>
        HttpResponse.json(makePaymentStatus({ status: "canceled", error: "Your card was declined." })),
      ),
    )

    const response = await ordersAPI.getPaymentStatus("pi_123")

    expect(response.status).toBe("canceled")
    expect(response.error).toBe("Your card was declined.")
  })

  it("tolerates a status string outside the documented union", async () => {
    server.use(
      http.get("*/backend-api/orders/payment/:paymentIntentId", () =>
        HttpResponse.json(makePaymentStatus({ status: "requires_action" })),
      ),
    )

    await expect(ordersAPI.getPaymentStatus("pi_123")).resolves.toMatchObject({ status: "requires_action" })
  })

  it("rejects when the payment intent is unknown", async () => {
    server.use(
      http.get("*/backend-api/orders/payment/:paymentIntentId", () =>
        HttpResponse.json({ message: "Payment intent not found" }, { status: 404 }),
      ),
    )

    await expect(ordersAPI.getPaymentStatus("pi_missing")).rejects.toMatchObject({ response: { status: 404 } })
  })

  it("rejects on a network failure so the polling loop can retry", async () => {
    server.use(http.get("*/backend-api/orders/payment/:paymentIntentId", () => HttpResponse.error()))

    await expect(ordersAPI.getPaymentStatus("pi_123")).rejects.toThrow()
  })
})

describe("ordersAPI.getSavedCards contract", () => {
  it("returns the raw saved cards list with numeric expiry fields", async () => {
    server.use(
      http.get("*/backend-api/orders/saved-cards", () =>
        HttpResponse.json({
          cards: [makeApiSavedCard({ id: "card-1", expMonth: 9, expYear: 2028 })],
          total: 1,
        }),
      ),
    )

    const response = await ordersAPI.getSavedCards()

    expect(response.total).toBe(1)
    expect(response.cards).toHaveLength(1)
    expect(response.cards[0]?.id).toBe("card-1")
    expect(typeof response.cards[0]?.expMonth).toBe("number")
    expect(typeof response.cards[0]?.expYear).toBe("number")
    // This endpoint is unmapped — unlike `/cards`, it hands the Java DTO straight through.
    expect(response.cards[0]?.openToAutoPayment).toBe(true)
  })

  it("handles an empty wallet", async () => {
    server.use(http.get("*/backend-api/orders/saved-cards", () => HttpResponse.json({ cards: [], total: 0 })))

    const response = await ordersAPI.getSavedCards()

    expect(response.cards).toEqual([])
    expect(response.total).toBe(0)
  })

  it("rejects when the wallet cannot be read", async () => {
    server.use(
      http.get("*/backend-api/orders/saved-cards", () =>
        HttpResponse.json({ message: "Stripe unavailable" }, { status: 500 }),
      ),
    )

    await expect(ordersAPI.getSavedCards()).rejects.toMatchObject({ response: { status: 500 } })
  })
})
