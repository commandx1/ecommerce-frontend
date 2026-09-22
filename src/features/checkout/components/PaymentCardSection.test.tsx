import userEvent from "@testing-library/user-event"
import type { ComponentProps } from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import type { SavedCard } from "@/lib/api/orders"
import type { PendingNewCard } from "@/stores/checkoutStore"
import { render, screen } from "@/test/render"

vi.mock("@stripe/react-stripe-js", async () => {
  const { reactStripeMock } = await import("@/test/mocks/stripe")
  return reactStripeMock()
})
vi.mock("motion/react", async () => {
  const { motionMock } = await import("@/test/mocks/motion")
  return motionMock()
})

import PaymentCardSection from "./PaymentCardSection"

type PaymentCardSectionProps = ComponentProps<typeof PaymentCardSection>

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

const pendingCard = (overrides: Partial<PendingNewCard> = {}): PendingNewCard => ({
  paymentMethodId: "pm_new_1",
  brand: "mastercard",
  last4: "1881",
  expMonth: 5,
  expYear: 2030,
  ...overrides,
})

const defaultProps = (): PaymentCardSectionProps => ({
  cardName: "",
  isLoadingCards: false,
  isSubmitting: false,
  saveCard: false,
  savedCards: [] as SavedCard[],
  selectedSavedCardId: "",
  pendingNewCard: null,
  showInlineNewCardForm: true,
  setCardName: vi.fn(),
  setSaveCard: vi.fn(),
  setSelectedSavedCardId: vi.fn(),
  hasAutoOrderItems: false,
  autoOrderConsent: false,
  setAutoOrderConsent: vi.fn(),
  newCardAutoPaymentConsent: false,
  setNewCardAutoPaymentConsent: vi.fn(),
  setPendingNewCard: vi.fn(),
})

const renderSection = (overrides: Partial<PaymentCardSectionProps> = {}) =>
  render(<PaymentCardSection {...defaultProps()} {...overrides} />)

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

describe("PaymentCardSection", () => {
  describe("B axis — renders the real fields", () => {
    it("shows a loading state instead of the card form while saved cards are loading", () => {
      renderSection({ isLoadingCards: true, showInlineNewCardForm: false })

      expect(screen.getByText("Loading saved cards...")).toBeInTheDocument()
      expect(screen.queryByLabelText("Card number")).not.toBeInTheDocument()
    })

    it("does not show the 'Add new method' button while loading", () => {
      renderSection({ isLoadingCards: true, showInlineNewCardForm: false })

      expect(screen.queryByRole("button", { name: /Add new method/ })).not.toBeInTheDocument()
    })

    it("shows the inline new-card Stripe form when there are no saved cards", () => {
      renderSection({ savedCards: [], showInlineNewCardForm: true })

      expect(screen.getByText("Add a card to continue.")).toBeInTheDocument()
      expect(screen.getByLabelText("Card number")).toBeInTheDocument()
      expect(screen.getByLabelText("Expiration date")).toBeInTheDocument()
      expect(screen.getByLabelText("CVC")).toBeInTheDocument()
      expect(screen.queryByRole("button", { name: /Add new method/ })).not.toBeInTheDocument()
    })

    it("never renders the literal 'Use a new card' text", () => {
      renderSection({ savedCards: [baseCard()], showInlineNewCardForm: false })

      expect(screen.queryByText("Use a new card")).not.toBeInTheDocument()
    })

    it("shows the saved card's brand, last four digits and expiry", () => {
      renderSection({
        savedCards: [baseCard({ brand: "visa", last4: "4242", expMonth: 8, expYear: 2028 })],
        showInlineNewCardForm: false,
      })

      expect(screen.getByText(/VISA •••• 4242/)).toBeInTheDocument()
      expect(screen.getByText(/Expires 8\/2028/)).toBeInTheDocument()
    })

    it("shows the default/auto-order-card/auto-payments-on badges when the card carries them", () => {
      renderSection({
        savedCards: [baseCard({ isDefault: true, autoOrderCard: true, openToAutoPayment: true })],
        showInlineNewCardForm: false,
      })

      expect(screen.getByText("Default")).toBeInTheDocument()
      expect(screen.getByText("Auto order card")).toBeInTheDocument()
      expect(screen.getByText("Auto payments on")).toBeInTheDocument()
    })

    it("shows an Expired badge and disables the radio for an expired card", () => {
      renderSection({
        savedCards: [baseCard({ expMonth: 1, expYear: 2000 })],
        showInlineNewCardForm: false,
      })

      expect(screen.getByText("Expired")).toBeInTheDocument()
      expect(screen.getByRole("radio")).toBeDisabled()
    })

    it("shows the repeat-items notice when the cart has auto order items", () => {
      renderSection({ hasAutoOrderItems: true, showInlineNewCardForm: false })

      expect(screen.getByText(/This order includes auto order items/)).toBeInTheDocument()
    })

    it("asks for auto-order consent on a saved card that is not already open to auto payment", () => {
      renderSection({
        hasAutoOrderItems: true,
        savedCards: [baseCard({ stripeCardId: "pm_123", openToAutoPayment: false })],
        selectedSavedCardId: "pm_123",
        showInlineNewCardForm: false,
      })

      expect(screen.getByText(/Allow this card to be charged automatically/)).toBeInTheDocument()
    })

    it("tells the buyer the card is already open to auto payment instead of asking for consent again", () => {
      renderSection({
        hasAutoOrderItems: true,
        savedCards: [baseCard({ stripeCardId: "pm_123", openToAutoPayment: true })],
        selectedSavedCardId: "pm_123",
        showInlineNewCardForm: false,
      })

      expect(screen.getByText(/already set up for automatic payments/)).toBeInTheDocument()
      expect(screen.queryByText(/Allow this card to be charged automatically/)).not.toBeInTheDocument()
    })

    it("selecting a saved card does not call setSaveCard", async () => {
      const user = userEvent.setup()
      const setSaveCard = vi.fn()
      renderSection({
        savedCards: [baseCard({ stripeCardId: "pm_123" })],
        selectedSavedCardId: "",
        setSaveCard,
        showInlineNewCardForm: false,
      })

      await user.click(screen.getByText(/VISA •••• 4242/))

      expect(setSaveCard).not.toHaveBeenCalled()
    })

    it("shows the pending new card row with a New badge and selects it via selectedSavedCardId === ''", () => {
      renderSection({
        savedCards: [baseCard({ stripeCardId: "pm_saved" })],
        selectedSavedCardId: "",
        pendingNewCard: pendingCard(),
        showInlineNewCardForm: false,
      })

      expect(screen.getByText(/MASTERCARD •••• 1881/)).toBeInTheDocument()
      expect(screen.getByText("New")).toBeInTheDocument()
    })

    it("forces and locks 'save card' when the order has auto order items on a new card", () => {
      renderSection({ hasAutoOrderItems: true, savedCards: [], showInlineNewCardForm: true })

      const saveCardCheckbox = screen.getByRole("checkbox", { name: /Save this card for future purchases/ })
      expect(saveCardCheckbox).toBeChecked()
      expect(saveCardCheckbox).toBeDisabled()
    })

    it("shows the card-name field once 'save card' is checked for a non-auto-order new card", () => {
      renderSection({ hasAutoOrderItems: false, savedCards: [], saveCard: true, showInlineNewCardForm: true })

      expect(screen.getByLabelText("Card Name")).toBeInTheDocument()
    })
  })

  describe("Add new method inline panel", () => {
    it("opens the inline panel when 'Add new method' is clicked, and the button becomes Cancel", async () => {
      const user = userEvent.setup()
      const setSelectedSavedCardId = vi.fn()
      const setPendingNewCard = vi.fn()
      renderSection({
        savedCards: [baseCard()],
        showInlineNewCardForm: false,
        setSelectedSavedCardId,
        setPendingNewCard,
      })

      const addButton = screen.getByRole("button", { name: /Add new method/ })
      expect(addButton).toHaveAttribute("aria-expanded", "false")

      await user.click(addButton)

      expect(await screen.findByLabelText("Card number")).toBeInTheDocument()
      const cancelButton = screen.getByRole("button", { name: "Cancel" })
      expect(cancelButton).toHaveAttribute("aria-expanded", "true")
      expect(setSelectedSavedCardId).toHaveBeenCalledWith("")
      expect(setPendingNewCard).toHaveBeenCalledWith(null)
    })

    it("Cancel closes the panel and restores the default saved card selection", async () => {
      const user = userEvent.setup()
      const setSelectedSavedCardId = vi.fn()
      const card = baseCard({ stripeCardId: "pm_123", isDefault: true })
      renderSection({
        savedCards: [card],
        showInlineNewCardForm: false,
        setSelectedSavedCardId,
      })

      await user.click(screen.getByRole("button", { name: /Add new method/ }))
      await user.click(screen.getByRole("button", { name: "Cancel" }))

      expect(screen.queryByLabelText("Card number")).not.toBeInTheDocument()
      expect(setSelectedSavedCardId).toHaveBeenLastCalledWith("pm_123")
    })

    it("clicking a saved card while the panel is open closes the panel", async () => {
      const user = userEvent.setup()
      renderSection({ savedCards: [baseCard({ stripeCardId: "pm_123" })], showInlineNewCardForm: false })

      await user.click(screen.getByRole("button", { name: /Add new method/ }))
      expect(screen.getByLabelText("Card number")).toBeInTheDocument()

      await user.click(screen.getByText(/VISA •••• 4242/))

      expect(screen.queryByLabelText("Card number")).not.toBeInTheDocument()
    })

    it("shows no 'Add new method' button and keeps the panel open when there are no saved cards", () => {
      renderSection({ savedCards: [], showInlineNewCardForm: true })

      expect(screen.queryByRole("button", { name: /Add new method/ })).not.toBeInTheDocument()
      expect(screen.getByLabelText("Card number")).toBeInTheDocument()
    })

    it("shows the 'Add new method' button (panel closed) when a pending new card already exists", () => {
      renderSection({
        savedCards: [baseCard()],
        pendingNewCard: pendingCard(),
        selectedSavedCardId: "",
        showInlineNewCardForm: false,
      })

      expect(screen.getByRole("button", { name: /Add new method/ })).toBeInTheDocument()
      expect(screen.queryByLabelText("Card number")).not.toBeInTheDocument()
    })

    it("never renders the old confirm button or a dialog role", async () => {
      const user = userEvent.setup()
      const removedConfirmButtonName = ["Use", "this", "card"].join(" ")
      renderSection({ savedCards: [baseCard()], showInlineNewCardForm: false })

      expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
      await user.click(screen.getByRole("button", { name: /Add new method/ }))

      expect(screen.queryByRole("button", { name: new RegExp(removedConfirmButtonName) })).not.toBeInTheDocument()
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
    })
  })

  describe("C axis — hostile/malformed card and selection data", () => {
    it.each<{ name: string; savedCards: SavedCard[] }>([
      { name: "null instead of an array", savedCards: null as unknown as SavedCard[] },
      { name: "undefined instead of an array", savedCards: undefined as unknown as SavedCard[] },
      { name: "an object instead of an array", savedCards: { length: 1 } as unknown as SavedCard[] },
    ])("does not crash when savedCards is $name — falls back to the inline new-card form", ({ savedCards }) => {
      let container: HTMLElement | undefined
      expect(() => {
        ;({ container } = renderSection({ savedCards, showInlineNewCardForm: true }))
      }).not.toThrow()

      expect(screen.getByLabelText("Card number")).toBeInTheDocument()
      expectNoRawNullText(container as HTMLElement)
    })

    it("drops null entries within the saved cards array instead of crashing (backend OrderMapper.toSavedCardResponse can emit null)", () => {
      const savedCards = [null, baseCard({ stripeCardId: "pm_good", last4: "9999" }), null] as unknown as SavedCard[]

      expect(() => renderSection({ savedCards, showInlineNewCardForm: false })).not.toThrow()

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
        ;({ container } = renderSection({ savedCards, showInlineNewCardForm: false }))
      }).not.toThrow()

      expectNoRawNullText(container as HTMLElement)
    })

    it("does not crash when the selected saved card id matches nothing in the list (stale selection)", () => {
      const savedCards = [baseCard({ stripeCardId: "pm_real" })]

      expect(() =>
        renderSection({
          savedCards,
          selectedSavedCardId: "pm_does_not_exist",
          hasAutoOrderItems: true,
          showInlineNewCardForm: false,
        }),
      ).not.toThrow()
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
          showInlineNewCardForm: false,
        }))
      }).not.toThrow()

      expectNoRawNullText(container as HTMLElement)
    })
  })
})
