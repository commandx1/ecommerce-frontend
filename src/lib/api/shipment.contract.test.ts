import { HttpResponse, http } from "msw"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { server } from "@/mocks/server"
import { type ShipmentRatesPayload, type ShipmentRatesResponse, shipmentAPI } from "./shipment"

/**
 * `getRates` is called once per vendor from the checkout screen. It keeps a module-level 2s
 * dedup cache keyed by address + user + cart + parcels, so every test below uses a unique cartId
 * to stay isolated from its neighbours; the cache itself is exercised deliberately at the end.
 */
let cartCounter = 0

function makePayload(overrides: Partial<ShipmentRatesPayload> = {}): ShipmentRatesPayload {
  cartCounter += 1
  return {
    addressId: "addr-1",
    userId: "seller-1",
    cartId: `cart-${cartCounter}-${Date.now()}`,
    parcels: [{ userProductId: "up-1", quantity: 2 }],
    ...overrides,
  }
}

function makeShippoRate(overrides: Partial<ShipmentRatesResponse["shippoRates"][number]> = {}) {
  return {
    objectId: "rate-1",
    provider: "USPS",
    providerImage75: "https://shippo-static.s3.amazonaws.com/providers/75/USPS.png",
    providerImage200: "https://shippo-static.s3.amazonaws.com/providers/200/USPS.png",
    amount: "8.50",
    currency: "USD",
    amountLocal: "8.50",
    currencyLocal: "USD",
    arrivesBy: null,
    durationTerms: "Estimated 2-3 business days.",
    estimatedDays: 3,
    attributes: ["CHEAPEST"],
    servicelevel: {
      name: "Priority Mail",
      token: "usps_priority",
      terms: "",
      extendedToken: "usps_priority",
      parentServicelevel: null,
    },
    test: true,
    ...overrides,
  }
}

function makeUberQuote(overrides: Partial<NonNullable<ShipmentRatesResponse["uberQuote"]>> = {}) {
  return {
    kind: "delivery_quote",
    id: "dqt_uber_1",
    created: "2026-05-20T10:00:00Z",
    expires: "2026-05-20T10:15:00Z",
    fee: 1299,
    currency: "usd",
    currency_type: "USD",
    dropoff_eta: "2026-05-20T11:00:00Z",
    duration: 35,
    pickup_duration: 10,
    dropoff_deadline: "2026-05-20T11:30:00Z",
    ...overrides,
  }
}

let capturedBody: unknown = null
let requestCount = 0

beforeEach(() => {
  capturedBody = null
  requestCount = 0
})

afterEach(() => {
  vi.restoreAllMocks()
})

function useRatesHandler(respond: () => Response) {
  server.use(
    http.post("*/backend-api/shipment/rates", async ({ request }) => {
      requestCount += 1
      capturedBody = await request.json()
      return respond()
    }),
  )
}

describe("shipmentAPI.getRates contract", () => {
  it("sends the payload verbatim and returns both carrier shapes", async () => {
    useRatesHandler(() =>
      HttpResponse.json({
        shippoRates: [makeShippoRate()],
        uberQuote: makeUberQuote(),
        defaultShipmentFee: 5,
      }),
    )

    const payload = makePayload({ parcels: [{ userProductId: "up-1", quantity: 2 }] })
    const response = await shipmentAPI.getRates(payload)

    expect(capturedBody).toEqual({
      addressId: payload.addressId,
      userId: payload.userId,
      cartId: payload.cartId,
      parcels: [{ userProductId: "up-1", quantity: 2 }],
    })

    // Shippo and Uber are two different schemas in one response.
    // Shippo prices arrive as decimal *dollar strings*; the estimate is a number.
    expect(response.shippoRates[0]?.amount).toBe("8.50")
    expect(typeof response.shippoRates[0]?.amount).toBe("string")
    expect(typeof response.shippoRates[0]?.estimatedDays).toBe("number")
    expect(response.shippoRates[0]?.servicelevel.token).toBe("usps_priority")
    expect(response.shippoRates[0]?.arrivesBy).toBeNull()

    // The Uber quote price is a *number in cents* — checkout divides `fee` by 100 to display it.
    expect(typeof response.uberQuote?.fee).toBe("number")
    expect(response.uberQuote?.fee).toBe(1299)
    expect((response.uberQuote?.fee ?? 0) / 100).toBe(12.99)
    expect(response.uberQuote?.id).toBe("dqt_uber_1")

    expect(response.defaultShipmentFee).toBe(5)
  })

  it("handles a vendor with no rates and no Uber coverage", async () => {
    useRatesHandler(() => HttpResponse.json({ shippoRates: [], uberQuote: null }))

    const response = await shipmentAPI.getRates(makePayload({ userId: "seller-no-rates" }))

    expect(response.shippoRates).toEqual([])
    expect(response.uberQuote).toBeNull()
    // `defaultShipmentFee` is optional — checkout falls back to the vendor's own fee when absent.
    expect(response.defaultShipmentFee).toBeUndefined()
  })

  it("handles a vendor with an Uber quote but no Shippo rates", async () => {
    useRatesHandler(() => HttpResponse.json({ shippoRates: [], uberQuote: makeUberQuote({ fee: 899 }) }))

    const response = await shipmentAPI.getRates(makePayload({ userId: "seller-uber-only" }))

    expect(response.shippoRates).toEqual([])
    expect(response.uberQuote?.fee).toBe(899)
  })

  it("returns multiple rates in the order the backend sent them", async () => {
    useRatesHandler(() =>
      HttpResponse.json({
        shippoRates: [
          makeShippoRate({ objectId: "rate-slow", amount: "12.00", estimatedDays: 5 }),
          makeShippoRate({ objectId: "rate-fast", amount: "24.99", estimatedDays: 1, provider: "UPS" }),
        ],
        uberQuote: null,
        defaultShipmentFee: 0,
      }),
    )

    const response = await shipmentAPI.getRates(makePayload())

    expect(response.shippoRates.map((rate) => rate.objectId)).toEqual(["rate-slow", "rate-fast"])
    expect(response.defaultShipmentFee).toBe(0)
  })

  it("sends every parcel line for a multi-item vendor", async () => {
    useRatesHandler(() => HttpResponse.json({ shippoRates: [makeShippoRate()], uberQuote: null }))

    await shipmentAPI.getRates(
      makePayload({
        parcels: [
          { userProductId: "up-1", quantity: 2 },
          { userProductId: "up-2", quantity: 7 },
        ],
      }),
    )

    expect((capturedBody as ShipmentRatesPayload).parcels).toEqual([
      { userProductId: "up-1", quantity: 2 },
      { userProductId: "up-2", quantity: 7 },
    ])
  })

  it.each([
    [400, "Parcel dimensions are missing"],
    [404, "Address not found"],
    [500, "Shippo is unavailable"],
  ])("rejects on %i", async (status, message) => {
    useRatesHandler(() => HttpResponse.json({ message }, { status }))

    await expect(shipmentAPI.getRates(makePayload())).rejects.toMatchObject({
      response: { status, data: { message } },
    })
  })

  it("flags a 401 as auth-handled", async () => {
    useRatesHandler(() => HttpResponse.json({ message: "Expired" }, { status: 401 }))

    const error = await shipmentAPI.getRates(makePayload()).catch((caught: unknown) => caught)

    expect((error as { authHandled?: boolean }).authHandled).toBe(true)
  })

  it("rejects on a network failure", async () => {
    useRatesHandler(() => HttpResponse.error())

    await expect(shipmentAPI.getRates(makePayload())).rejects.toThrow()
  })

  it("does not let one vendor's out-of-area Uber failure block the other vendors", async () => {
    server.use(
      http.post("*/backend-api/shipment/rates", async ({ request }) => {
        const body = (await request.json()) as ShipmentRatesPayload
        if (body.userId === "seller-out-of-area") {
          return HttpResponse.json({ message: "Delivery address is outside the Uber service area" }, { status: 400 })
        }
        return HttpResponse.json({ shippoRates: [makeShippoRate()], uberQuote: makeUberQuote() })
      }),
    )

    const results = await Promise.allSettled([
      shipmentAPI.getRates(makePayload({ userId: "seller-1" })),
      shipmentAPI.getRates(makePayload({ userId: "seller-out-of-area" })),
      shipmentAPI.getRates(makePayload({ userId: "seller-3" })),
    ])

    expect(results.map((result) => result.status)).toEqual(["fulfilled", "rejected", "fulfilled"])
    expect((results[0] as PromiseFulfilledResult<ShipmentRatesResponse>).value.shippoRates).toHaveLength(1)
    expect((results[2] as PromiseFulfilledResult<ShipmentRatesResponse>).value.uberQuote?.fee).toBe(1299)
  })

  it("does not cache a failed request", async () => {
    let attempt = 0
    server.use(
      http.post("*/backend-api/shipment/rates", () => {
        requestCount += 1
        attempt += 1
        if (attempt === 1) {
          return HttpResponse.json({ message: "Temporarily unavailable" }, { status: 500 })
        }
        return HttpResponse.json({ shippoRates: [makeShippoRate()], uberQuote: null })
      }),
    )

    const payload = makePayload({ userId: "seller-retry" })
    await expect(shipmentAPI.getRates(payload)).rejects.toBeDefined()
    await expect(shipmentAPI.getRates(payload)).resolves.toMatchObject({ uberQuote: null })
    expect(requestCount).toBe(2)
  })
})

describe("shipmentAPI.getRates deduplication", () => {
  it("collapses concurrent identical requests into a single round trip", async () => {
    useRatesHandler(() => HttpResponse.json({ shippoRates: [makeShippoRate()], uberQuote: null }))

    const payload = makePayload({ userId: "seller-concurrent" })
    const [first, second] = await Promise.all([shipmentAPI.getRates(payload), shipmentAPI.getRates({ ...payload })])

    expect(requestCount).toBe(1)
    expect(first).toBe(second)
  })

  it("treats parcels in a different order as the same request", async () => {
    useRatesHandler(() => HttpResponse.json({ shippoRates: [makeShippoRate()], uberQuote: null }))

    const payload = makePayload({
      userId: "seller-unordered",
      parcels: [
        { userProductId: "up-b", quantity: 1 },
        { userProductId: "up-a", quantity: 3 },
      ],
    })
    await shipmentAPI.getRates(payload)
    await shipmentAPI.getRates({
      ...payload,
      parcels: [
        { userProductId: "up-a", quantity: 3 },
        { userProductId: "up-b", quantity: 1 },
      ],
    })

    expect(requestCount).toBe(1)
  })

  it("refetches when a quantity changes", async () => {
    useRatesHandler(() => HttpResponse.json({ shippoRates: [makeShippoRate()], uberQuote: null }))

    const payload = makePayload({ userId: "seller-qty" })
    await shipmentAPI.getRates(payload)
    await shipmentAPI.getRates({ ...payload, parcels: [{ userProductId: "up-1", quantity: 3 }] })

    expect(requestCount).toBe(2)
  })

  it("refetches once the 2s dedup window has elapsed", async () => {
    useRatesHandler(() => HttpResponse.json({ shippoRates: [makeShippoRate()], uberQuote: null }))

    const start = Date.now()
    const nowSpy = vi.spyOn(Date, "now").mockReturnValue(start)

    const payload = makePayload({ userId: "seller-window" })
    await shipmentAPI.getRates(payload)
    await shipmentAPI.getRates({ ...payload })
    expect(requestCount).toBe(1)

    nowSpy.mockReturnValue(start + 2001)
    await shipmentAPI.getRates({ ...payload })
    expect(requestCount).toBe(2)
  })
})
