import { HttpResponse, http } from "msw"
import { describe, expect, it } from "vitest"
import { server } from "@/mocks/server"
import { makeStripeAccountLink, makeStripeConnectStatus, makeStripeLoginLink } from "@/test/factories"
import { ApiRequestError } from "./request"
import { createStripeAccountLink, getStripeConnectStatus, getStripeLoginLink } from "./stripe-connect"

describe("getStripeConnectStatus contract", () => {
  it("returns the typed payout account status", async () => {
    server.use(http.get("*/backend-api/stripe/connect/status", () => HttpResponse.json(makeStripeConnectStatus())))

    const status = await getStripeConnectStatus()

    expect(status).toEqual({ connected: true, enabled: true, stripeAccountId: "acct_1234567890" })
    expect(typeof status.connected).toBe("boolean")
    expect(typeof status.enabled).toBe("boolean")
  })

  it("reports a vendor with no Stripe account at all", async () => {
    server.use(
      http.get("*/backend-api/stripe/connect/status", () =>
        HttpResponse.json(makeStripeConnectStatus({ connected: false, enabled: false, stripeAccountId: null })),
      ),
    )

    const status = await getStripeConnectStatus()

    expect(status.connected).toBe(false)
    expect(status.enabled).toBe(false)
    expect(status.stripeAccountId).toBeNull()
  })

  it("reports an account that exists but has not finished onboarding", async () => {
    server.use(
      http.get("*/backend-api/stripe/connect/status", () =>
        HttpResponse.json(makeStripeConnectStatus({ connected: true, enabled: false })),
      ),
    )

    const status = await getStripeConnectStatus()

    expect(status.connected).toBe(true)
    expect(status.enabled).toBe(false)
  })

  it("uses the endpoint's message when the backend supplies one", async () => {
    server.use(
      http.get("*/backend-api/stripe/connect/status", () =>
        HttpResponse.json({ message: "Company profile is incomplete" }, { status: 400 }),
      ),
    )

    const error = await getStripeConnectStatus().catch((caught: unknown) => caught)

    expect(error).toBeInstanceOf(ApiRequestError)
    expect((error as ApiRequestError).message).toBe("Company profile is incomplete")
    expect((error as ApiRequestError).status).toBe(400)
  })

  it("falls back to the module's own message on a bodyless 500", async () => {
    server.use(http.get("*/backend-api/stripe/connect/status", () => new HttpResponse(null, { status: 500 })))

    const error = await getStripeConnectStatus().catch((caught: unknown) => caught)

    expect((error as ApiRequestError).message).toBe("Failed to fetch payout account status")
    expect((error as ApiRequestError).status).toBe(500)
  })

  it("flags a 401 as auth-handled and leaves 403 for the caller", async () => {
    server.use(
      http.get("*/backend-api/stripe/connect/status", () => HttpResponse.json({ message: "Nope" }, { status: 401 })),
    )
    expect(((await getStripeConnectStatus().catch((e: unknown) => e)) as ApiRequestError).authHandled).toBe(true)

    server.use(
      http.get("*/backend-api/stripe/connect/status", () =>
        HttpResponse.json({ message: "Not a vendor" }, { status: 403 }),
      ),
    )
    expect(((await getStripeConnectStatus().catch((e: unknown) => e)) as ApiRequestError).authHandled).toBe(false)
  })

  it("rejects on a network failure", async () => {
    server.use(http.get("*/backend-api/stripe/connect/status", () => HttpResponse.error()))

    await expect(getStripeConnectStatus()).rejects.toBeInstanceOf(ApiRequestError)
  })
})

describe("createStripeAccountLink contract", () => {
  it("POSTs with no body and returns a fresh onboarding link", async () => {
    let capturedMethod: string | null = null
    let capturedBody: string | null = null
    server.use(
      http.post("*/backend-api/stripe/connect/account", async ({ request }) => {
        capturedMethod = request.method
        capturedBody = await request.text()
        return HttpResponse.json(makeStripeAccountLink())
      }),
    )

    const link = await createStripeAccountLink()

    expect(capturedMethod).toBe("POST")
    expect(capturedBody).toBe("")
    expect(link).toEqual({
      stripeAccountId: "acct_1234567890",
      onboardingUrl: "https://connect.stripe.com/setup/acct_1234567890",
      stripeAccountEnabled: false,
    })
  })

  it("reports an already-enabled account on a repeat onboarding request", async () => {
    server.use(
      http.post("*/backend-api/stripe/connect/account", () =>
        HttpResponse.json(makeStripeAccountLink({ stripeAccountEnabled: true })),
      ),
    )

    await expect(createStripeAccountLink()).resolves.toMatchObject({ stripeAccountEnabled: true })
  })

  it.each([
    [400, "Vendor company is missing a country"],
    [409, "Onboarding is already in progress"],
    [500, "Stripe is unavailable"],
  ])("rejects on %i with the backend message", async (status, message) => {
    server.use(http.post("*/backend-api/stripe/connect/account", () => HttpResponse.json({ message }, { status })))

    const error = await createStripeAccountLink().catch((caught: unknown) => caught)

    expect((error as ApiRequestError).status).toBe(status)
    expect((error as ApiRequestError).message).toBe(message)
  })

  it("falls back to its own message when the error body has no message field", async () => {
    server.use(
      http.post("*/backend-api/stripe/connect/account", () => HttpResponse.json({ code: "x" }, { status: 500 })),
    )

    await expect(createStripeAccountLink()).rejects.toMatchObject({
      message: "Failed to start payout account setup",
    })
  })
})

describe("getStripeLoginLink contract", () => {
  it("returns the express dashboard url", async () => {
    server.use(http.get("*/backend-api/stripe/connect/login-link", () => HttpResponse.json(makeStripeLoginLink())))

    await expect(getStripeLoginLink()).resolves.toEqual({
      url: "https://connect.stripe.com/express/acct_1234567890",
    })
  })

  it("rejects with 404 when the vendor has no Stripe account yet", async () => {
    server.use(
      http.get("*/backend-api/stripe/connect/login-link", () =>
        HttpResponse.json({ message: "No payout account" }, { status: 404 }),
      ),
    )

    const error = await getStripeLoginLink().catch((caught: unknown) => caught)

    expect((error as ApiRequestError).status).toBe(404)
    expect((error as ApiRequestError).message).toBe("No payout account")
  })

  it("reads the `error` field when the backend uses it instead of `message`", async () => {
    server.use(
      http.get("*/backend-api/stripe/connect/login-link", () =>
        HttpResponse.json({ error: "Account not enabled" }, { status: 409 }),
      ),
    )

    await expect(getStripeLoginLink()).rejects.toMatchObject({ message: "Account not enabled", status: 409 })
  })

  it("tolerates an empty url string", async () => {
    server.use(
      http.get("*/backend-api/stripe/connect/login-link", () => HttpResponse.json(makeStripeLoginLink({ url: "" }))),
    )

    await expect(getStripeLoginLink()).resolves.toEqual({ url: "" })
  })
})
