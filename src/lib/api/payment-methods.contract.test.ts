import { HttpResponse, http } from "msw"
import { beforeEach, describe, expect, it } from "vitest"
import { server } from "@/mocks/server"
import { makeApiSavedCard, makeSetupIntentResponse } from "@/test/factories"
import { type ApiSavedCard, mapApiCard, paymentMethodsAPI } from "./payment-methods"

let capturedPath: string | null = null
let capturedBody: unknown = null
let capturedMethod: string | null = null

/**
 * These handlers capture the outgoing request so the assertions below can pin the exact wire
 * contract. They are registered per test because the global setup resets handlers after every
 * test case.
 */
beforeEach(() => {
  capturedPath = null
  capturedBody = null
  capturedMethod = null
})

async function capture(request: Request) {
  capturedPath = new URL(request.url).pathname
  capturedMethod = request.method
  const text = await request.text()
  capturedBody = text ? JSON.parse(text) : null
}

describe("mapApiCard normalisation", () => {
  it("maps a visa card onto the UI shape", () => {
    const mapped = mapApiCard(makeApiSavedCard())

    expect(mapped).toEqual({
      id: "pm-1",
      type: "visa",
      brandLabel: "Visa",
      nickname: "Main Clinic Card",
      last4: "4532",
      cardholder: "",
      expiryMonth: "09",
      expiryYear: "2028",
      billingAddress: "",
      status: "default",
      stripePaymentMethodId: "pm_1234567890",
      openToAutoPayment: true,
      autoOrderCard: true,
    })
  })

  it.each([
    ["visa", "visa"],
    ["Visa", "visa"],
    ["VISA", "visa"],
    ["mastercard", "mastercard"],
    ["MasterCard", "mastercard"],
    ["amex", "amex"],
    ["American Express", "amex"],
    ["discover", "bank"],
    ["", "bank"],
  ])("maps brand %s to type %s", (brand, expected) => {
    expect(mapApiCard(makeApiSavedCard({ brand })).type).toBe(expected)
  })

  it("only upper-cases the first character of the brand label", () => {
    expect(mapApiCard(makeApiSavedCard({ brand: "visa" })).brandLabel).toBe("Visa")
    expect(mapApiCard(makeApiSavedCard({ brand: "Visa" })).brandLabel).toBe("Visa")
    // Pinned as-is: an all-caps brand from Stripe stays all-caps in the label.
    expect(mapApiCard(makeApiSavedCard({ brand: "VISA" })).brandLabel).toBe("VISA")
    expect(mapApiCard(makeApiSavedCard({ brand: "" })).brandLabel).toBe("")
  })

  it.each([
    [1, "01"],
    [9, "09"],
    [10, "10"],
    [12, "12"],
  ])("left-pads expiry month %i to %s", (expMonth, expected) => {
    expect(mapApiCard(makeApiSavedCard({ expMonth })).expiryMonth).toBe(expected)
  })

  it("passes the expiry year through without padding or truncation", () => {
    expect(mapApiCard(makeApiSavedCard({ expYear: 2028 })).expiryYear).toBe("2028")
    // Pinned as-is: a two-digit year from the backend is not expanded to four digits.
    expect(mapApiCard(makeApiSavedCard({ expYear: 28 })).expiryYear).toBe("28")
  })

  it("marks a non-default card as active", () => {
    expect(mapApiCard(makeApiSavedCard({ isDefault: true })).status).toBe("default")
    expect(mapApiCard(makeApiSavedCard({ isDefault: false })).status).toBe("active")
  })

  it("coerces the auto payment flags to booleans", () => {
    const missingFlags = { ...makeApiSavedCard(), openToAutoPayment: undefined, autoOrderCard: undefined }
    const mapped = mapApiCard(missingFlags as unknown as ApiSavedCard)

    expect(mapped.openToAutoPayment).toBe(false)
    expect(mapped.autoOrderCard).toBe(false)
  })

  it("carries openToAutoPayment through independently of autoOrderCard", () => {
    const mapped = mapApiCard(makeApiSavedCard({ openToAutoPayment: true, autoOrderCard: false }))

    expect(mapped.openToAutoPayment).toBe(true)
    expect(mapped.autoOrderCard).toBe(false)
  })

  it("passes a missing last4 through untouched rather than substituting a placeholder", () => {
    const withoutLast4 = { ...makeApiSavedCard(), last4: undefined }

    // Pinned as-is: `last4` is typed as a string but is not defended, so the UI receives
    // `undefined` when the backend omits it.
    expect(mapApiCard(withoutLast4 as unknown as ApiSavedCard).last4).toBeUndefined()
  })
})

describe("paymentMethodsAPI.getSavedCards contract", () => {
  it("returns every card mapped onto the UI shape", async () => {
    server.use(
      http.get("*/backend-api/cards", () =>
        HttpResponse.json({
          cards: [
            makeApiSavedCard({ id: "card-1", isDefault: true }),
            makeApiSavedCard({ id: "card-2", brand: "mastercard", expMonth: 1, isDefault: false }),
          ],
          total: 2,
        }),
      ),
    )

    const cards = await paymentMethodsAPI.getSavedCards()

    expect(cards).toHaveLength(2)
    expect(cards[0]?.status).toBe("default")
    expect(cards[1]?.type).toBe("mastercard")
    expect(cards[1]?.expiryMonth).toBe("01")
    expect(cards[1]?.status).toBe("active")
  })

  it("returns an empty array for an empty wallet", async () => {
    server.use(http.get("*/backend-api/cards", () => HttpResponse.json({ cards: [], total: 0 })))

    await expect(paymentMethodsAPI.getSavedCards()).resolves.toEqual([])
  })

  it("rejects when the wallet cannot be read", async () => {
    server.use(http.get("*/backend-api/cards", () => HttpResponse.json({ message: "Boom" }, { status: 500 })))

    await expect(paymentMethodsAPI.getSavedCards()).rejects.toMatchObject({ response: { status: 500 } })
  })

  it("flags a 401 as auth-handled", async () => {
    server.use(http.get("*/backend-api/cards", () => HttpResponse.json({ message: "Expired" }, { status: 401 })))

    const error = await paymentMethodsAPI.getSavedCards().catch((caught: unknown) => caught)

    expect((error as { authHandled?: boolean }).authHandled).toBe(true)
  })
})

describe("paymentMethodsAPI SetupIntent flow", () => {
  it.each([true, false])("puts openToAutoPayment=%s in the path, not the query string", async (flag) => {
    server.use(
      http.post("*/backend-api/cards/setup-intent/:openToAutoPayment", async ({ request }) => {
        await capture(request)
        return HttpResponse.json(makeSetupIntentResponse())
      }),
    )

    const response = await paymentMethodsAPI.createSetupIntent(flag)

    expect(capturedPath).toBe(`/backend-api/cards/setup-intent/${flag}`)
    expect(capturedBody).toBeNull()
    expect(response).toEqual({
      setupIntentId: "seti_1234567890",
      clientSecret: "seti_1234567890_secret_abc123",
    })
  })

  it("sends the full save-card payload and maps the created card back", async () => {
    server.use(
      http.post("*/backend-api/cards", async ({ request }) => {
        await capture(request)
        return HttpResponse.json(makeApiSavedCard({ id: "card-new", isDefault: true }))
      }),
    )

    const saved = await paymentMethodsAPI.saveCard({
      paymentMethodId: "pm_stripe_1",
      nickname: "Clinic Card",
      makeDefault: true,
      openToAutoPayment: true,
      autoOrderCard: true,
    })

    expect(capturedBody).toEqual({
      paymentMethodId: "pm_stripe_1",
      nickname: "Clinic Card",
      makeDefault: true,
      openToAutoPayment: true,
      autoOrderCard: true,
    })
    expect(saved.id).toBe("card-new")
    expect(saved.status).toBe("default")
  })

  it("rejects with 409 when autoOrderCard is sent without an off-session mandate", async () => {
    server.use(
      http.post("*/backend-api/cards", () =>
        HttpResponse.json({ message: "autoOrderCard requires openToAutoPayment" }, { status: 409 }),
      ),
    )

    await expect(
      paymentMethodsAPI.saveCard({
        paymentMethodId: "pm_stripe_1",
        nickname: "Clinic Card",
        makeDefault: false,
        openToAutoPayment: false,
        autoOrderCard: true,
      }),
    ).rejects.toMatchObject({
      response: { status: 409, data: { message: "autoOrderCard requires openToAutoPayment" } },
    })
  })

  it("rejects with 400 when Stripe refuses the payment method", async () => {
    server.use(http.post("*/backend-api/cards", () => HttpResponse.json({ message: "Card declined" }, { status: 400 })))

    await expect(
      paymentMethodsAPI.saveCard({
        paymentMethodId: "pm_bad",
        nickname: "",
        makeDefault: false,
        openToAutoPayment: false,
        autoOrderCard: false,
      }),
    ).rejects.toMatchObject({ response: { status: 400 } })
  })

  it("rejects on a network failure while creating the SetupIntent", async () => {
    server.use(http.post("*/backend-api/cards/setup-intent/:flag", () => HttpResponse.error()))

    await expect(paymentMethodsAPI.createSetupIntent(true)).rejects.toThrow()
  })
})

describe("paymentMethodsAPI card mutations", () => {
  it("deletes by id with no body", async () => {
    server.use(
      http.delete("*/backend-api/cards/:cardId", async ({ request }) => {
        await capture(request)
        return new HttpResponse(null, { status: 204 })
      }),
    )

    await paymentMethodsAPI.deleteCard("card-1")

    expect(capturedMethod).toBe("DELETE")
    expect(capturedPath).toBe("/backend-api/cards/card-1")
    expect(capturedBody).toBeNull()
  })

  it("rejects deleting the auto order card with 409", async () => {
    server.use(
      http.delete("*/backend-api/cards/:cardId", () =>
        HttpResponse.json({ message: "This card covers active auto orders" }, { status: 409 }),
      ),
    )

    await expect(paymentMethodsAPI.deleteCard("card-1")).rejects.toMatchObject({ response: { status: 409 } })
  })

  it("rejects deleting an unknown card with 404", async () => {
    server.use(
      http.delete("*/backend-api/cards/:cardId", () => HttpResponse.json({ message: "Not found" }, { status: 404 })),
    )

    await expect(paymentMethodsAPI.deleteCard("missing")).rejects.toMatchObject({ response: { status: 404 } })
  })

  it("sends only the nickname when renaming", async () => {
    server.use(
      http.patch("*/backend-api/cards/:cardId/nickname", async ({ request, params }) => {
        await capture(request)
        return HttpResponse.json(makeApiSavedCard({ id: String(params.cardId), name: "Renamed" }))
      }),
    )

    const updated = await paymentMethodsAPI.updateNickname("card-1", { nickname: "Renamed" })

    expect(capturedMethod).toBe("PATCH")
    expect(capturedPath).toBe("/backend-api/cards/card-1/nickname")
    expect(capturedBody).toEqual({ nickname: "Renamed" })
    expect(updated.nickname).toBe("Renamed")
  })

  it("sends no body when making a card the default", async () => {
    server.use(
      http.patch("*/backend-api/cards/:cardId/default", async ({ request, params }) => {
        await capture(request)
        return HttpResponse.json(makeApiSavedCard({ id: String(params.cardId), isDefault: true }))
      }),
    )

    const updated = await paymentMethodsAPI.setDefault("card-2")

    expect(capturedPath).toBe("/backend-api/cards/card-2/default")
    expect(capturedBody).toBeNull()
    expect(updated.id).toBe("card-2")
    expect(updated.status).toBe("default")
  })

  it.each([true, false])("sends autoOrderCard=%s as the only body field", async (autoOrderCard) => {
    server.use(
      http.patch("*/backend-api/cards/:cardId/auto-order-card", async ({ request, params }) => {
        await capture(request)
        return HttpResponse.json(makeApiSavedCard({ id: String(params.cardId), autoOrderCard }))
      }),
    )

    const updated = await paymentMethodsAPI.setAutoOrderCard("card-3", autoOrderCard)

    expect(capturedPath).toBe("/backend-api/cards/card-3/auto-order-card")
    expect(capturedBody).toEqual({ autoOrderCard })
    expect(updated.autoOrderCard).toBe(autoOrderCard)
  })
})

describe("paymentMethodsAPI auto payment upgrade", () => {
  it("creates the upgrade SetupIntent with no body", async () => {
    server.use(
      http.post("*/backend-api/cards/:cardId/auto-payment-upgrade/setup-intent", async ({ request }) => {
        await capture(request)
        return HttpResponse.json(makeSetupIntentResponse({ setupIntentId: "seti_upgrade" }))
      }),
    )

    const response = await paymentMethodsAPI.createAutoPaymentUpgradeSetupIntent("card-1")

    expect(capturedPath).toBe("/backend-api/cards/card-1/auto-payment-upgrade/setup-intent")
    expect(capturedBody).toBeNull()
    expect(response.setupIntentId).toBe("seti_upgrade")
  })

  it("confirms the upgrade with only the setup intent id and returns the flipped card", async () => {
    server.use(
      http.post("*/backend-api/cards/:cardId/auto-payment-upgrade/confirm", async ({ request, params }) => {
        await capture(request)
        return HttpResponse.json(makeApiSavedCard({ id: String(params.cardId), openToAutoPayment: true }))
      }),
    )

    const updated = await paymentMethodsAPI.confirmAutoPaymentUpgrade("card-1", "seti_upgrade")

    expect(capturedPath).toBe("/backend-api/cards/card-1/auto-payment-upgrade/confirm")
    expect(capturedBody).toEqual({ setupIntentId: "seti_upgrade" })
    expect(updated.openToAutoPayment).toBe(true)
  })

  it("rejects when Stripe has not actually confirmed the mandate", async () => {
    server.use(
      http.post("*/backend-api/cards/:cardId/auto-payment-upgrade/confirm", () =>
        HttpResponse.json({ message: "SetupIntent is not succeeded" }, { status: 400 }),
      ),
    )

    await expect(paymentMethodsAPI.confirmAutoPaymentUpgrade("card-1", "seti_pending")).rejects.toMatchObject({
      response: { status: 400 },
    })
  })

  it("rejects with 403 when the card belongs to someone else", async () => {
    server.use(
      http.post("*/backend-api/cards/:cardId/auto-payment-upgrade/setup-intent", () =>
        HttpResponse.json({ message: "Forbidden" }, { status: 403 }),
      ),
    )

    const error = await paymentMethodsAPI
      .createAutoPaymentUpgradeSetupIntent("card-other")
      .catch((caught: unknown) => caught)

    expect((error as { response?: { status?: number } }).response?.status).toBe(403)
    // 403 is a business-rule rejection, so the session is left alone.
    expect((error as { authHandled?: boolean }).authHandled).toBeUndefined()
  })
})
