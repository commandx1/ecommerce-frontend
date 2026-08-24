import userEvent from "@testing-library/user-event"
import { HttpResponse, http } from "msw"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { server } from "@/mocks/server"
import { makeApiSavedCard } from "@/test/factories"
import { createFakeStripe, stripeError, stripeSetupIntent } from "@/test/mocks/stripe"
import { render, screen, waitFor, within } from "@/test/render"
import BuyerPaymentMethodsPage from "./BuyerPaymentMethodsPage"

/**
 * `stripePromise` is built at module scope from `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, so the key
 * has to exist before the page module is evaluated — `vi.hoisted` runs ahead of every import.
 */
const { toastSpies, stripeRef } = vi.hoisted(() => {
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = "pk_test_dentypro"
  return {
    stripeRef: { current: null as unknown as ReturnType<typeof createFakeStripe> },
    toastSpies: {
      success: vi.fn(),
      error: vi.fn(),
      warning: vi.fn(),
      info: vi.fn(),
      love: vi.fn(),
      loading: vi.fn(),
    },
  }
})

vi.mock("@/components/ui/Toast", () => ({ showToast: toastSpies }))
vi.mock("@stripe/stripe-js", () => ({ loadStripe: vi.fn(() => Promise.resolve({})) }))
vi.mock("@stripe/react-stripe-js", async () => {
  const actual = await import("@/test/mocks/stripe")
  return {
    ...actual.reactStripeMock(),
    useStripe: () => stripeRef.current,
    useElements: () => actual.createElementsMock(),
  }
})

const serveCards = (...cards: ReturnType<typeof makeApiSavedCard>[]) => {
  server.use(http.get("*/backend-api/cards", () => HttpResponse.json({ cards, total: cards.length })))
}

const twoCards = () => [
  makeApiSavedCard({
    id: "pm-1",
    name: "Main Clinic Card",
    last4: "4532",
    isDefault: true,
    autoOrderCard: true,
    openToAutoPayment: true,
  }),
  makeApiSavedCard({
    id: "pm-2",
    name: "Procurement Backup",
    brand: "mastercard",
    last4: "8888",
    isDefault: false,
    autoOrderCard: false,
    openToAutoPayment: false,
  }),
]

beforeEach(() => {
  vi.restoreAllMocks()
  stripeRef.current = createFakeStripe()
  for (const spy of Object.values(toastSpies)) {
    spy.mockClear()
  }
})

describe("BuyerPaymentMethodsPage", () => {
  it("summarises the default card and the auto order card", async () => {
    serveCards(...twoCards())

    render(<BuyerPaymentMethodsPage />)

    expect(await screen.findByRole("heading", { name: "Payment Methods" })).toBeInTheDocument()
    const defaultTile = screen.getByText("Default Method").closest("article") as HTMLElement
    expect(within(defaultTile).getByText("Visa •••• 4532")).toBeInTheDocument()

    const autoOrderTile = screen.getByText("Auto Order Card").closest("article") as HTMLElement
    expect(within(autoOrderTile).getByText("Visa •••• 4532")).toBeInTheDocument()
    expect(within(autoOrderTile).getByRole("link", { name: "Manage auto orders" })).toHaveAttribute(
      "href",
      "/buyer-dashboard/auto-orders",
    )
  })

  it("tells the buyer when no card runs auto orders yet", async () => {
    serveCards(makeApiSavedCard({ id: "pm-1", autoOrderCard: false, openToAutoPayment: false }))

    render(<BuyerPaymentMethodsPage />)

    const autoOrderTile = (await screen.findByText("Auto Order Card")).closest("article") as HTMLElement
    expect(within(autoOrderTile).getByText("Not set")).toBeInTheDocument()
    expect(within(autoOrderTile).getByText("Pick a card to run repeat orders")).toBeInTheDocument()
  })

  it("promotes another card to default and demotes the previous one", async () => {
    const user = userEvent.setup()
    serveCards(...twoCards())
    server.use(
      http.patch("*/backend-api/cards/:cardId/default", ({ params }) =>
        HttpResponse.json(
          makeApiSavedCard({
            id: String(params.cardId),
            name: "Procurement Backup",
            brand: "mastercard",
            last4: "8888",
            isDefault: true,
            openToAutoPayment: false,
            autoOrderCard: false,
          }),
        ),
      ),
    )

    render(<BuyerPaymentMethodsPage />)

    await user.click(await screen.findByRole("button", { name: "Set as Default" }))
    const popover = (await screen.findByText("Set as default?")).closest("div") as HTMLElement
    await user.click(within(popover).getByRole("button", { name: "OK" }))

    await waitFor(() =>
      expect(toastSpies.success).toHaveBeenCalledWith("Default updated", "Primary payment method changed."),
    )
    // Both cards can no longer claim the default slot
    await waitFor(() => expect(screen.getAllByRole("button", { name: "Default Card" })).toHaveLength(1))
  })

  it("refuses to delete the buyer's only card", async () => {
    const user = userEvent.setup()
    serveCards(makeApiSavedCard({ id: "pm-1", autoOrderCard: true, openToAutoPayment: true }))
    const deleted = vi.fn()
    server.use(
      http.delete("*/backend-api/cards/:cardId", () => {
        deleted()
        return new HttpResponse(null, { status: 200 })
      }),
    )

    render(<BuyerPaymentMethodsPage />)

    await user.click(await screen.findByRole("button", { name: "Remove" }))
    const popover = (await screen.findByText("Remove card?")).closest("div") as HTMLElement
    await user.click(within(popover).getByRole("button", { name: "Remove" }))

    await waitFor(() =>
      expect(toastSpies.warning).toHaveBeenCalledWith("Cannot remove", "At least one payment method must remain."),
    )
    expect(deleted).not.toHaveBeenCalled()
  })

  it("warns that auto orders pause when the auto order card is deleted", async () => {
    const user = userEvent.setup()
    const cards = twoCards()
    serveCards(...cards)

    render(<BuyerPaymentMethodsPage />)

    await screen.findByRole("heading", { name: "Main Clinic Card" })
    const autoOrderCardArticle = screen
      .getByRole("heading", { name: "Main Clinic Card" })
      .closest("article") as HTMLElement
    await user.click(within(autoOrderCardArticle).getByRole("button", { name: "Remove" }))

    const popover = (await screen.findByText("Remove card?")).closest("div") as HTMLElement
    // Once removed the server only returns the surviving card
    serveCards(cards[1] as ReturnType<typeof makeApiSavedCard>)
    await user.click(within(popover).getByRole("button", { name: "Remove" }))

    await waitFor(() =>
      expect(toastSpies.success).toHaveBeenCalledWith(
        "Card removed",
        "Your auto orders are paused until you choose another card.",
      ),
    )
  })

  it("saves a new card through a SetupIntent and never posts raw card data", async () => {
    const user = userEvent.setup()
    serveCards(...twoCards())

    let setupIntentPath = ""
    let savePayload: Record<string, unknown> | null = null
    server.use(
      http.post("*/backend-api/cards/setup-intent/:openToAutoPayment", ({ params }) => {
        setupIntentPath = String(params.openToAutoPayment)
        return HttpResponse.json({ setupIntentId: "seti_1", clientSecret: "seti_1_secret" })
      }),
      http.post("*/backend-api/cards", async ({ request }) => {
        savePayload = (await request.json()) as Record<string, unknown>
        return HttpResponse.json(makeApiSavedCard({ id: "pm-3", name: "Travel Card", last4: "1111" }))
      }),
    )
    stripeRef.current.confirmCardSetup.mockResolvedValue({
      setupIntent: { ...stripeSetupIntent().setupIntent, payment_method: "pm_stripe_123" },
    })

    render(<BuyerPaymentMethodsPage />)

    await user.click(await screen.findByRole("button", { name: "Add New Card" }))
    await user.type(await screen.findByPlaceholderText("e.g. Main Clinic Card"), "Travel Card")
    await user.click(screen.getByRole("button", { name: "Save Card" }))

    await waitFor(() => expect(toastSpies.success).toHaveBeenCalledWith("Card added", expect.stringContaining("1111")))
    expect(setupIntentPath).toBe("true")
    expect(savePayload).toMatchObject({
      paymentMethodId: "pm_stripe_123",
      nickname: "Travel Card",
      openToAutoPayment: true,
    })
    expect(savePayload).not.toHaveProperty("cardNumber")
  })

  it("refuses to submit a card without a nickname", async () => {
    const user = userEvent.setup()
    serveCards(...twoCards())

    render(<BuyerPaymentMethodsPage />)

    await user.click(await screen.findByRole("button", { name: "Add New Card" }))
    await user.click(await screen.findByRole("button", { name: "Save Card" }))

    await waitFor(() =>
      expect(toastSpies.error).toHaveBeenCalledWith("Nickname required", "Please give this card a name."),
    )
    expect(stripeRef.current.confirmCardSetup).not.toHaveBeenCalled()
  })

  it("surfaces a Stripe decline instead of saving the card", async () => {
    const user = userEvent.setup()
    serveCards(...twoCards())
    const saved = vi.fn()
    server.use(
      http.post("*/backend-api/cards", () => {
        saved()
        return HttpResponse.json(makeApiSavedCard())
      }),
    )
    stripeRef.current.confirmCardSetup.mockResolvedValue(stripeError("Your card was declined."))

    render(<BuyerPaymentMethodsPage />)

    await user.click(await screen.findByRole("button", { name: "Add New Card" }))
    await user.type(await screen.findByPlaceholderText("e.g. Main Clinic Card"), "Declined Card")
    await user.click(screen.getByRole("button", { name: "Save Card" }))

    await waitFor(() => expect(toastSpies.error).toHaveBeenCalledWith("Card declined", "Your card was declined."))
    expect(saved).not.toHaveBeenCalled()
  })

  it("explains a 409 from the backend as an already-linked card", async () => {
    const user = userEvent.setup()
    serveCards(...twoCards())
    server.use(http.post("*/backend-api/cards", () => new HttpResponse(null, { status: 409 })))
    stripeRef.current.confirmCardSetup.mockResolvedValue({
      setupIntent: { ...stripeSetupIntent().setupIntent, payment_method: "pm_stripe_123" },
    })

    render(<BuyerPaymentMethodsPage />)

    await user.click(await screen.findByRole("button", { name: "Add New Card" }))
    await user.type(await screen.findByPlaceholderText("e.g. Main Clinic Card"), "Duplicate")
    await user.click(screen.getByRole("button", { name: "Save Card" }))

    await waitFor(() =>
      expect(toastSpies.error).toHaveBeenCalledWith(
        "Card not saved",
        "This card is already linked to your account, or it can't be used here.",
      ),
    )
  })

  it("creates the SetupIntent on-session when automatic payments are declined", async () => {
    const user = userEvent.setup()
    serveCards(...twoCards())

    let setupIntentPath = ""
    server.use(
      http.post("*/backend-api/cards/setup-intent/:openToAutoPayment", ({ params }) => {
        setupIntentPath = String(params.openToAutoPayment)
        return HttpResponse.json({ setupIntentId: "seti_1", clientSecret: "seti_1_secret" })
      }),
    )
    stripeRef.current.confirmCardSetup.mockResolvedValue({
      setupIntent: { ...stripeSetupIntent().setupIntent, payment_method: "pm_stripe_123" },
    })

    render(<BuyerPaymentMethodsPage />)

    await user.click(await screen.findByRole("button", { name: "Add New Card" }))
    await user.type(await screen.findByPlaceholderText("e.g. Main Clinic Card"), "On session")
    await user.click(screen.getByLabelText(/Allow automatic payments for repeat orders/))
    await user.click(screen.getByRole("button", { name: "Save Card" }))

    await waitFor(() => expect(setupIntentPath).toBe("false"))
  })

  it("upgrades an on-session card to automatic payments in two steps", async () => {
    const user = userEvent.setup()
    serveCards(...twoCards())
    let confirmedSetupIntentId: unknown = null
    server.use(
      http.post("*/backend-api/cards/:cardId/auto-payment-upgrade/setup-intent", () =>
        HttpResponse.json({ setupIntentId: "seti_upgrade", clientSecret: "seti_upgrade_secret" }),
      ),
      http.post("*/backend-api/cards/:cardId/auto-payment-upgrade/confirm", async ({ request }) => {
        confirmedSetupIntentId = ((await request.json()) as { setupIntentId?: string }).setupIntentId
        return HttpResponse.json(makeApiSavedCard({ id: "pm-2", openToAutoPayment: true }))
      }),
    )

    render(<BuyerPaymentMethodsPage />)

    await user.click(await screen.findByRole("button", { name: "Enable automatic payments" }))

    await waitFor(() =>
      expect(toastSpies.success).toHaveBeenCalledWith("Automatic payments enabled", expect.any(String)),
    )
    expect(stripeRef.current.confirmCardSetup).toHaveBeenCalledWith("seti_upgrade_secret")
    expect(confirmedSetupIntentId).toBe("seti_upgrade")
  })

  it("does not tell the backend the card is upgraded when the bank rejects the mandate", async () => {
    const user = userEvent.setup()
    serveCards(...twoCards())
    const confirmed = vi.fn()
    server.use(
      http.post("*/backend-api/cards/:cardId/auto-payment-upgrade/setup-intent", () =>
        HttpResponse.json({ setupIntentId: "seti_upgrade", clientSecret: "seti_upgrade_secret" }),
      ),
      http.post("*/backend-api/cards/:cardId/auto-payment-upgrade/confirm", () => {
        confirmed()
        return HttpResponse.json(makeApiSavedCard())
      }),
    )
    stripeRef.current.confirmCardSetup.mockResolvedValue(stripeError("Authentication failed."))

    render(<BuyerPaymentMethodsPage />)

    await user.click(await screen.findByRole("button", { name: "Enable automatic payments" }))

    await waitFor(() =>
      expect(toastSpies.error).toHaveBeenCalledWith("Could not authorise the card", "Authentication failed."),
    )
    expect(confirmed).not.toHaveBeenCalled()
  })

  it("asks before it stops using a card for auto orders", async () => {
    const user = userEvent.setup()
    serveCards(...twoCards())
    const stopped = vi.fn()
    server.use(
      http.patch("*/backend-api/cards/:cardId/auto-order-card", () => {
        stopped()
        return HttpResponse.json(makeApiSavedCard({ id: "pm-1", autoOrderCard: false }))
      }),
    )

    render(<BuyerPaymentMethodsPage />)

    await user.click(await screen.findByRole("button", { name: "Stop using for auto orders" }))

    const dialog = await screen.findByRole("dialog")
    expect(
      within(dialog).getByRole("heading", { level: 3, name: "Stop using this card for auto orders?" }),
    ).toBeInTheDocument()
    expect(stopped).not.toHaveBeenCalled()

    await user.click(within(dialog).getByRole("button", { name: "Stop auto orders" }))
    await waitFor(() =>
      expect(toastSpies.success).toHaveBeenCalledWith("Auto orders paused", "Choose another card to start them again."),
    )
    expect(stopped).toHaveBeenCalledTimes(1)
  })

  it("explains a 409 when a card without automatic payments is picked for auto orders", async () => {
    const user = userEvent.setup()
    serveCards(
      makeApiSavedCard({ id: "pm-1", isDefault: true, autoOrderCard: false, openToAutoPayment: true }),
      makeApiSavedCard({ id: "pm-2", name: "Backup", isDefault: false, autoOrderCard: false, openToAutoPayment: true }),
    )
    server.use(http.patch("*/backend-api/cards/:cardId/auto-order-card", () => new HttpResponse(null, { status: 409 })))

    render(<BuyerPaymentMethodsPage />)

    const buttons = await screen.findAllByRole("button", { name: "Use for auto orders" })
    await user.click(buttons[0] as HTMLElement)

    await waitFor(() =>
      expect(toastSpies.error).toHaveBeenCalledWith(
        "Automatic payments required",
        "Enable automatic payments for this card first.",
      ),
    )
  })

  it("renames a card without touching the rest of the list", async () => {
    const user = userEvent.setup()
    serveCards(...twoCards())
    server.use(
      http.patch("*/backend-api/cards/:cardId/nickname", ({ params }) =>
        HttpResponse.json(makeApiSavedCard({ id: String(params.cardId), name: "Renamed Card" })),
      ),
    )

    render(<BuyerPaymentMethodsPage />)

    const article = (await screen.findByRole("heading", { name: "Main Clinic Card" })).closest("article") as HTMLElement
    await user.click(within(article).getByRole("button", { name: "Rename" }))

    const input = await screen.findByPlaceholderText("e.g. Backup Card")
    await user.clear(input)
    await user.type(input, "Renamed Card")
    await user.click(screen.getByRole("button", { name: "Save" }))

    await waitFor(() => expect(toastSpies.success).toHaveBeenCalledWith("Card renamed"))
    expect(await screen.findByRole("heading", { name: "Renamed Card" })).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: "Procurement Backup" })).toBeInTheDocument()
  })

  it("reports a failed load rather than showing an empty card list as fact", async () => {
    server.use(http.get("*/backend-api/cards", () => new HttpResponse(null, { status: 500 })))

    render(<BuyerPaymentMethodsPage />)

    await waitFor(() =>
      expect(toastSpies.error).toHaveBeenCalledWith("Failed to load", "Could not fetch payment methods."),
    )
    expect(await screen.findByText("No saved cards yet. Add a card to get started.")).toBeInTheDocument()
  })
})
