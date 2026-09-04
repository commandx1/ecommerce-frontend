import type { ComponentProps } from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import type { SavedCard } from "@/lib/api/orders"
import { render, screen } from "@/test/render"

vi.mock("@stripe/react-stripe-js", async () => {
  const { reactStripeMock } = await import("@/test/mocks/stripe")
  return reactStripeMock()
})

import FinalReviewPaymentSection from "./FinalReviewPaymentSection"

type FinalReviewPaymentSectionProps = ComponentProps<typeof FinalReviewPaymentSection>

const baseCard = (overrides: Partial<SavedCard> = {}): SavedCard => ({
  id: "card-1",
  name: "Office Visa",
  stripeCardId: "pm_123",
  brand: "visa",
  last4: "4242",
  expMonth: 8,
  expYear: 2028,
  isDefault: false,
  openToAutoPayment: false,
  autoOrderCard: false,
  createdDate: "2026-01-01T00:00:00Z",
  ...overrides,
})

const defaultProps = (): FinalReviewPaymentSectionProps => ({
  cardName: "",
  isLoadingCards: false,
  paymentType: "card",
  saveCard: false,
  savedCards: [] as SavedCard[],
  selectedSavedCardId: "",
  setCardName: vi.fn(),
  setSaveCard: vi.fn(),
  setSelectedSavedCardId: vi.fn(),
  hasAutoOrderItems: false,
  autoOrderConsent: false,
  setAutoOrderConsent: vi.fn(),
  newCardAutoPaymentConsent: false,
  setNewCardAutoPaymentConsent: vi.fn(),
})

const renderSection = (overrides: Partial<FinalReviewPaymentSectionProps> = {}) =>
  render(<FinalReviewPaymentSection {...defaultProps()} {...overrides} />)

// Any string rendered onto the page as the literal word "null"/"undefined" is a bug (F101) — this
// asserts the whole rendered tree never contains one, regardless of which field went bad. The
// `next-themes` no-flash script (injected by the shared `ThemeProvider` test wrapper) legitimately
// contains the token "null" in its own source, so it is stripped before comparing.
const expectNoRawNullText = (container: HTMLElement) => {
  const clone = container.cloneNode(true) as HTMLElement
  clone.querySelectorAll("script").forEach((node) => {
    node.remove()
  })
  expect(clone.textContent).not.toMatch(/\bnull\b/i)
  expect(clone.textContent).not.toMatch(/\bundefined\b/i)
  expect(clone.textContent).not.toMatch(/\bNaN\b/)
}

beforeEach(() => {
  vi.restoreAllMocks()
})

describe("FinalReviewPaymentSection", () => {
  describe("B axis — renders the real fields", () => {
    it("shows a loading state instead of the card form while saved cards are loading", () => {
      renderSection({ isLoadingCards: true })

      expect(screen.getByText("Loading saved cards...")).toBeInTheDocument()
      expect(screen.queryByLabelText("Card number")).not.toBeInTheDocument()
    })

    it("shows the new-card Stripe form when there are no saved cards", () => {
      renderSection({ savedCards: [] })

      expect(screen.getByLabelText("Card number")).toBeInTheDocument()
      expect(screen.getByLabelText("Expiration date")).toBeInTheDocument()
      expect(screen.getByLabelText("CVC")).toBeInTheDocument()
    })

    it("shows the saved card's brand, last four digits and expiry", () => {
      renderSection({ savedCards: [baseCard({ brand: "visa", last4: "4242", expMonth: 8, expYear: 2028 })] })

      expect(screen.getByText(/VISA •••• 4242/)).toBeInTheDocument()
      expect(screen.getByText("Expires 8/2028")).toBeInTheDocument()
    })

    it("hides the new-card Stripe form when a saved card is selected", () => {
      renderSection({
        savedCards: [baseCard({ stripeCardId: "pm_123" })],
        selectedSavedCardId: "pm_123",
      })

      expect(screen.queryByLabelText("Card number")).not.toBeInTheDocument()
    })

    it("shows the new-card Stripe form when 'Use a new card' is selected among saved cards", () => {
      renderSection({
        savedCards: [baseCard({ stripeCardId: "pm_123" })],
        selectedSavedCardId: "",
      })

      expect(screen.getByLabelText("Card number")).toBeInTheDocument()
      expect(screen.getByRole("radio", { name: /Use a new card/ })).toBeChecked()
    })

    it("shows the default/auto-order-card/auto-payments-on badges when the card carries them", () => {
      renderSection({
        savedCards: [baseCard({ isDefault: true, autoOrderCard: true, openToAutoPayment: true })],
      })

      expect(screen.getByText("Default")).toBeInTheDocument()
      expect(screen.getByText("Auto order card")).toBeInTheDocument()
      expect(screen.getByText("Auto payments on")).toBeInTheDocument()
    })

    it("warns that only card payments are supported when a non-card payment type is selected", () => {
      renderSection({ paymentType: "net30" })

      expect(screen.getByText(/Only card payments are supported/)).toBeInTheDocument()
    })

    it("does not show the non-card warning when card is selected", () => {
      renderSection({ paymentType: "card" })

      expect(screen.queryByText(/Only card payments are supported/)).not.toBeInTheDocument()
    })

    it("shows the repeat-items notice when the cart has auto order items", () => {
      renderSection({ hasAutoOrderItems: true })

      expect(screen.getByText(/This order includes auto order items/)).toBeInTheDocument()
    })

    it("asks for auto-order consent on a saved card that is not already open to auto payment", () => {
      renderSection({
        hasAutoOrderItems: true,
        savedCards: [baseCard({ stripeCardId: "pm_123", openToAutoPayment: false })],
        selectedSavedCardId: "pm_123",
      })

      expect(screen.getByText(/Allow this card to be charged automatically/)).toBeInTheDocument()
    })

    it("tells the buyer the card is already open to auto payment instead of asking for consent again", () => {
      renderSection({
        hasAutoOrderItems: true,
        savedCards: [baseCard({ stripeCardId: "pm_123", openToAutoPayment: true })],
        selectedSavedCardId: "pm_123",
      })

      expect(screen.getByText(/already set up for automatic payments/)).toBeInTheDocument()
      expect(screen.queryByText(/Allow this card to be charged automatically/)).not.toBeInTheDocument()
    })

    it("forces and locks 'save card' when the order has auto order items on a new card", () => {
      renderSection({ hasAutoOrderItems: true, savedCards: [] })

      const saveCardCheckbox = screen.getByRole("checkbox", { name: /Save this card for future purchases/ })
      expect(saveCardCheckbox).toBeChecked()
      expect(saveCardCheckbox).toBeDisabled()
    })

    it("shows the card-name field once 'save card' is checked for a non-auto-order new card", () => {
      renderSection({ hasAutoOrderItems: false, savedCards: [], saveCard: true })

      expect(screen.getByLabelText("Card Name")).toBeInTheDocument()
    })

    it("offers the 'also allow auto orders' checkbox for a saved new card, separate from the required auto-order consent", () => {
      renderSection({ hasAutoOrderItems: false, savedCards: [], saveCard: true })

      expect(screen.getByText(/Also allow this card for automatic orders/)).toBeInTheDocument()
    })
  })

  describe("C axis — hostile/malformed card and selection data", () => {
    it.each<{ name: string; savedCards: SavedCard[] }>([
      { name: "null instead of an array", savedCards: null as unknown as SavedCard[] },
      { name: "undefined instead of an array", savedCards: undefined as unknown as SavedCard[] },
      { name: "an object instead of an array", savedCards: { length: 1 } as unknown as SavedCard[] },
    ])("does not crash when savedCards is $name — falls back to the new-card form", ({ savedCards }) => {
      let container: HTMLElement | undefined
      expect(() => {
        ;({ container } = renderSection({ savedCards }))
      }).not.toThrow()

      expect(screen.getByLabelText("Card number")).toBeInTheDocument()
      expectNoRawNullText(container as HTMLElement)
    })

    it("drops null entries within the saved cards array instead of crashing (backend OrderMapper.toSavedCardResponse can emit null)", () => {
      const savedCards = [null, baseCard({ stripeCardId: "pm_good", last4: "9999" }), null] as unknown as SavedCard[]

      expect(() => renderSection({ savedCards })).not.toThrow()

      expect(screen.getAllByText(/9999/)).toHaveLength(1)
    })

    it.each<{ name: string; field: Partial<SavedCard> }>([
      { name: "brand missing", field: { brand: undefined as unknown as string } },
      { name: "brand null", field: { brand: null as unknown as string } },
      { name: "brand wrong type (number)", field: { brand: 4242 as unknown as string } },
      { name: "last4 missing", field: { last4: undefined as unknown as string } },
      { name: "last4 null", field: { last4: null as unknown as string } },
      { name: "last4 wrong type (number)", field: { last4: 4242 as unknown as string } },
      { name: "expMonth null", field: { expMonth: null as unknown as number } },
      { name: "expMonth missing", field: { expMonth: undefined as unknown as number } },
      { name: "expMonth NaN", field: { expMonth: Number.NaN } },
      { name: "expMonth negative", field: { expMonth: -1 } },
      { name: "expYear null", field: { expYear: null as unknown as number } },
      { name: "expYear missing", field: { expYear: undefined as unknown as number } },
      { name: "expYear NaN", field: { expYear: Number.NaN } },
      { name: "name missing", field: { name: undefined as unknown as string } },
      { name: "name null", field: { name: null as unknown as string } },
      {
        name: "isDefault/autoOrderCard/openToAutoPayment all missing",
        field: { isDefault: undefined, autoOrderCard: undefined, openToAutoPayment: undefined },
      },
    ])("does not crash and never prints raw null/undefined/NaN when $name", ({ field }) => {
      const savedCards = [baseCard(field)]

      let container: HTMLElement | undefined
      expect(() => {
        ;({ container } = renderSection({ savedCards }))
      }).not.toThrow()

      expectNoRawNullText(container as HTMLElement)
    })

    it("does not crash when the selected saved card id matches nothing in the list (stale selection)", () => {
      const savedCards = [baseCard({ stripeCardId: "pm_real" })]

      expect(() =>
        renderSection({ savedCards, selectedSavedCardId: "pm_does_not_exist", hasAutoOrderItems: true }),
      ).not.toThrow()
    })

    it("does not crash for an unexpected paymentType value outside the known union", () => {
      expect(() =>
        renderSection({ paymentType: "crypto" as unknown as ReturnType<typeof defaultProps>["paymentType"] }),
      ).not.toThrow()

      expect(screen.getByText(/Only card payments are supported/)).toBeInTheDocument()
    })

    it("does not crash when every callback prop is a no-op and every value field is at its worst case together", () => {
      const savedCards = [
        baseCard({
          brand: null as unknown as string,
          last4: null as unknown as string,
          expMonth: null as unknown as number,
          expYear: null as unknown as number,
          name: null as unknown as string,
        }),
        null,
      ] as unknown as SavedCard[]

      let container: HTMLElement | undefined
      expect(() => {
        ;({ container } = renderSection({
          savedCards,
          selectedSavedCardId: "",
          cardName: "",
          hasAutoOrderItems: true,
        }))
      }).not.toThrow()

      expectNoRawNullText(container as HTMLElement)
    })
  })
})
