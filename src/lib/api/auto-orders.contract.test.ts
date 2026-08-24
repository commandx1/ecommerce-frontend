import { HttpResponse, http } from "msw"
import { beforeEach, describe, expect, it } from "vitest"
import { server } from "@/mocks/server"
import { makeAutoOrder, makeAutoOrdersResponse } from "@/test/factories"
import { autoOrdersAPI, type UpdateAutoOrderPayload } from "./auto-orders"

const mockListResponse = makeAutoOrdersResponse({
  autoOrders: [
    makeAutoOrder({
      id: "584aa69c-10b5-4911-952a-4d33d298f23d",
      productName: "New POLO RED by Ralph Lauren - Type: Fragrances",
      period: "TWO_MONTHS",
      nextOrderDate: "2026-10-14T18:06:14.835534",
      sellerName: "Enis Atay",
    }),
    makeAutoOrder({
      id: "523f26c3-4d1a-4323-b88e-2c5453c30020",
      userProductId: "4361aad4-8050-423f-a248-3e4acfe8f29a",
      productId: "6c4c4a0b-0352-4430-b5fe-c40e3f31a163",
      productCoverPhotoPath: "https://nobledentalsupplies.imgix.net/content/images/thumbs/0005834.png",
      price: 56,
      period: "TWO_WEEKS",
      nextOrderDate: "2026-08-30T18:06:14.835534",
      sellerName: "Mustafa Enis Atay",
    }),
  ],
  total: 2,
})

const mockUpdateResponse = makeAutoOrder({
  id: "3b948d0f-7401-41e9-93d5-74fc0c58bb10",
  quantity: 10,
  period: "TWO_WEEKS",
  nextOrderDate: "2026-08-31T09:47:37.9055",
  active: false,
  updatedDate: "2026-08-15T18:48:42.708851",
})

let capturedUpdatePayload: UpdateAutoOrderPayload | null = null
let capturedDeleteUrl: string | null = null

/**
 * These handlers capture the outgoing request so the assertions below can pin the exact wire
 * contract. They are registered per test because the global setup resets handlers after every
 * test case.
 */
beforeEach(() => {
  capturedUpdatePayload = null
  capturedDeleteUrl = null

  server.use(
    http.get("*/backend-api/auto-orders", () => HttpResponse.json(mockListResponse)),
    http.patch("*/backend-api/auto-orders/:autoOrderId", async ({ request }) => {
      capturedUpdatePayload = (await request.json()) as UpdateAutoOrderPayload
      return HttpResponse.json(mockUpdateResponse)
    }),
    http.delete("*/backend-api/auto-orders/:autoOrderId", ({ request }) => {
      capturedDeleteUrl = request.url
      return new HttpResponse(null, { status: 204 })
    }),
  )
})

describe("autoOrdersAPI contract", () => {
  it("returns the typed auto order list", async () => {
    const response = await autoOrdersAPI.getAutoOrders()

    expect(response.total).toBe(2)
    expect(response.autoOrders).toHaveLength(2)
    expect(response.autoOrders[0]?.period).toBe("TWO_MONTHS")
    expect(response.autoOrders[0]?.active).toBe(true)
    expect(response.autoOrders[1]?.productCoverPhotoPath).toContain("https://")
  })

  it("sends only the fields being changed and returns the updated auto order", async () => {
    const payload: UpdateAutoOrderPayload = { quantity: 10, active: false, period: "TWO_WEEKS" }
    const response = await autoOrdersAPI.updateAutoOrder("3b948d0f-7401-41e9-93d5-74fc0c58bb10", payload)

    expect(capturedUpdatePayload).toEqual(payload)
    expect(response.quantity).toBe(10)
    expect(response.active).toBe(false)
    expect(response.period).toBe("TWO_WEEKS")
    // Changing the period restarts the countdown from now
    expect(response.nextOrderDate).toBe("2026-08-31T09:47:37.9055")
  })

  it("supports a partial update", async () => {
    await autoOrdersAPI.updateAutoOrder("3b948d0f-7401-41e9-93d5-74fc0c58bb10", { active: true })

    expect(capturedUpdatePayload).toEqual({ active: true })
  })

  it("deletes by id", async () => {
    await autoOrdersAPI.deleteAutoOrder("584aa69c-10b5-4911-952a-4d33d298f23d")

    expect(capturedDeleteUrl).toContain("/auto-orders/584aa69c-10b5-4911-952a-4d33d298f23d")
  })

  it("rejects when the backend returns an error status", async () => {
    server.use(
      http.patch("*/backend-api/auto-orders/:autoOrderId", () =>
        HttpResponse.json(
          {
            message:
              "You need a saved card that is selected for auto orders and open to automatic payments before activating an auto order.",
          },
          { status: 400 },
        ),
      ),
    )

    await expect(autoOrdersAPI.updateAutoOrder("any-id", { active: true })).rejects.toBeDefined()
  })
})

describe("autoOrdersAPI request shapes", () => {
  it("fetches the list with no query params at all", async () => {
    let capturedListQuery: string | null = null
    server.use(
      http.get("*/backend-api/auto-orders", ({ request }) => {
        capturedListQuery = new URL(request.url).search
        return HttpResponse.json(mockListResponse)
      }),
    )

    await autoOrdersAPI.getAutoOrders()

    // The endpoint is unpaginated — it returns the buyer's whole schedule list in one shot.
    expect(capturedListQuery).toBe("")
  })

  it("aborts in flight when the caller's signal fires", async () => {
    const controller = new AbortController()
    const pending = autoOrdersAPI.getAutoOrders(controller.signal)
    controller.abort()

    const error = await pending.catch((caught: unknown) => caught)

    expect((error as { code?: string }).code).toBe("ERR_CANCELED")
  })

  it("sends an empty object when nothing is being changed", async () => {
    await autoOrdersAPI.updateAutoOrder("auto-1", {})

    expect(capturedUpdatePayload).toEqual({})
  })

  it("puts the id in the path and sends no body when deleting", async () => {
    let capturedDeletePath: string | null = null
    let capturedDeleteBody: string | null = null
    server.use(
      http.delete("*/backend-api/auto-orders/:autoOrderId", async ({ request }) => {
        capturedDeletePath = new URL(request.url).pathname
        capturedDeleteBody = await request.text()
        return new HttpResponse(null, { status: 204 })
      }),
    )

    await autoOrdersAPI.deleteAutoOrder("auto-1")

    expect(capturedDeletePath).toBe("/backend-api/auto-orders/auto-1")
    expect(capturedDeleteBody).toBe("")
  })
})

describe("autoOrdersAPI response tolerance", () => {
  it("returns an empty schedule list without throwing", async () => {
    server.use(
      http.get("*/backend-api/auto-orders", () =>
        HttpResponse.json(makeAutoOrdersResponse({ autoOrders: [], total: 0 })),
      ),
    )

    const response = await autoOrdersAPI.getAutoOrders()

    expect(response.autoOrders).toEqual([])
    expect(response.total).toBe(0)
  })

  it("keeps price and quantity numeric", async () => {
    const response = await autoOrdersAPI.getAutoOrders()

    expect(typeof response.autoOrders[0]?.price).toBe("number")
    expect(typeof response.autoOrders[0]?.quantity).toBe("number")
    expect(typeof response.total).toBe("number")
  })

  it("tolerates a delisted product with null product metadata", async () => {
    server.use(
      http.get("*/backend-api/auto-orders", () =>
        HttpResponse.json(
          makeAutoOrdersResponse({
            autoOrders: [
              makeAutoOrder({
                productId: null,
                productName: null,
                productCoverPhotoPath: null,
                sellerName: null,
                active: false,
              }),
            ],
            total: 1,
          }),
        ),
      ),
    )

    const response = await autoOrdersAPI.getAutoOrders()
    const autoOrder = response.autoOrders[0]

    expect(autoOrder?.productId).toBeNull()
    expect(autoOrder?.productName).toBeNull()
    expect(autoOrder?.productCoverPhotoPath).toBeNull()
    expect(autoOrder?.sellerName).toBeNull()
    expect(autoOrder?.active).toBe(false)
  })
})

describe("autoOrdersAPI error paths", () => {
  it("flags a 401 as auth-handled", async () => {
    server.use(http.get("*/backend-api/auto-orders", () => HttpResponse.json({ message: "Expired" }, { status: 401 })))

    const error = await autoOrdersAPI.getAutoOrders().catch((caught: unknown) => caught)

    expect((error as { authHandled?: boolean }).authHandled).toBe(true)
  })

  it("leaves a 403 for the caller to surface inline", async () => {
    server.use(
      http.patch("*/backend-api/auto-orders/:autoOrderId", () =>
        HttpResponse.json({ message: "Not your auto order" }, { status: 403 }),
      ),
    )

    const error = await autoOrdersAPI.updateAutoOrder("auto-other", { active: true }).catch((caught: unknown) => caught)

    expect((error as { response?: { status?: number } }).response?.status).toBe(403)
    expect((error as { authHandled?: boolean }).authHandled).toBeUndefined()
  })

  it.each([
    [404, "Auto order not found"],
    [409, "The auto order card is no longer open to automatic payments"],
    [500, "Internal server error"],
  ])("rejects an update on %i with the backend message", async (status, message) => {
    server.use(http.patch("*/backend-api/auto-orders/:autoOrderId", () => HttpResponse.json({ message }, { status })))

    await expect(autoOrdersAPI.updateAutoOrder("auto-1", { quantity: 2 })).rejects.toMatchObject({
      response: { status, data: { message } },
    })
  })

  it("rejects deleting an auto order that is already gone", async () => {
    server.use(
      http.delete("*/backend-api/auto-orders/:autoOrderId", () =>
        HttpResponse.json({ message: "Auto order not found" }, { status: 404 }),
      ),
    )

    await expect(autoOrdersAPI.deleteAutoOrder("auto-gone")).rejects.toMatchObject({ response: { status: 404 } })
  })

  it("rejects on a network failure", async () => {
    server.use(http.get("*/backend-api/auto-orders", () => HttpResponse.error()))

    await expect(autoOrdersAPI.getAutoOrders()).rejects.toThrow()
  })
})
