import userEvent from "@testing-library/user-event"
import { HttpResponse, http } from "msw"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { StripeConfigProvider } from "@/components/providers/StripeConfigProvider"
import { server } from "@/mocks/server"
import { useCheckoutStore } from "@/stores/checkoutStore"
import { makeApiSavedCard } from "@/test/factories"
import { render, screen } from "@/test/render"

vi.mock("@stripe/stripe-js", () => ({ loadStripe: vi.fn(() => Promise.resolve({})) }))
vi.mock("@stripe/react-stripe-js", async () => {
  const { reactStripeMock } = await import("@/test/mocks/stripe")
  return reactStripeMock()
})

import BillingInformation from "./BillingInformation"

const serveSavedCards = (cards: ReturnType<typeof makeApiSavedCard>[] = []) => {
  server.use(http.get("*/backend-api/orders/saved-cards", () => HttpResponse.json({ cards, total: cards.length })))
}

let previousKey: string | undefined

beforeEach(() => {
  previousKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  delete process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  serveSavedCards([])
})

afterEach(() => {
  if (previousKey === undefined) {
    delete process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  } else {
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = previousKey
  }
})

describe("BillingInformation — no Stripe key configured", () => {
  it("shows the missing-key notice instead of a payment form", () => {
    render(<BillingInformation />)

    expect(screen.getByRole("heading", { name: "Billing Information" })).toBeInTheDocument()
    expect(screen.getByText(/NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY/)).toBeInTheDocument()
    expect(screen.queryByRole("radio")).not.toBeInTheDocument()
    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument()
    expect(screen.queryByRole("button", { name: /Continue to Review/ })).not.toBeInTheDocument()
  })
})

describe("BillingInformation — Stripe key present", () => {
  beforeEach(() => {
    useCheckoutStore.setState({ paymentMethod: { type: "card" } })
  })

  const renderWithKey = () =>
    render(
      <StripeConfigProvider publishableKey="pk_test_x">
        <BillingInformation />
      </StripeConfigProvider>,
    )

  it("renders the payment method section, the card section, agreements and navigation", async () => {
    renderWithKey()

    expect(await screen.findByRole("radio", { name: /Credit\/Debit Card/ })).toBeInTheDocument()
    expect(screen.getByText("Use a new card")).toBeInTheDocument() // FinalReviewPaymentSection (card type)
    expect(screen.getByLabelText(/I agree to the/)).toBeInTheDocument() // BillingAgreementsSection
    expect(screen.getByRole("button", { name: "Continue to Review" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /Back to Shipping/ })).toBeInTheDocument()
  })

  it("keeps Continue disabled until the agreement is checked, then enables it", async () => {
    const user = userEvent.setup()
    useCheckoutStore.setState({ termsAgreed: false })
    renderWithKey()

    const continueButton = await screen.findByRole("button", { name: "Continue to Review" })
    expect(continueButton).toBeDisabled()

    await user.click(screen.getByLabelText(/I agree to the/))

    expect(continueButton).toBeEnabled()
    expect(useCheckoutStore.getState().termsAgreed).toBe(true)
  })

  it("calls the store's previousStep when Back is clicked", async () => {
    const user = userEvent.setup()
    useCheckoutStore.setState({ currentStep: 3 })
    renderWithKey()

    await user.click(await screen.findByRole("button", { name: /Back to Shipping/ }))

    expect(useCheckoutStore.getState().currentStep).toBe(2)
  })

  it("does not render the card section for a non-card payment method", async () => {
    useCheckoutStore.setState({ paymentMethod: { type: "wire" } })
    renderWithKey()

    await screen.findByRole("button", { name: "Continue to Review" })
    expect(screen.queryByText("Use a new card")).not.toBeInTheDocument()
    expect(screen.queryByText("Saved Cards")).not.toBeInTheDocument()
  })

  it("shows the buyer's saved cards from the backend", async () => {
    serveSavedCards([makeApiSavedCard({ brand: "visa", last4: "4532" })])
    renderWithKey()

    expect(await screen.findByText("VISA •••• 4532")).toBeInTheDocument()
  })
})
