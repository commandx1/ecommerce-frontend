"use client"

import { CardCvcElement, CardExpiryElement, CardNumberElement } from "@stripe/react-stripe-js"
import { Repeat } from "lucide-react"
import { useTheme } from "next-themes"
import { useEffect, useId, useMemo, useState } from "react"
import type { SavedCard } from "@/lib/api/orders"

interface FinalReviewPaymentSectionProps {
  cardName: string
  isLoadingCards: boolean
  paymentType: "card" | "net30" | "wire" | "financing"
  saveCard: boolean
  savedCards: SavedCard[]
  selectedSavedCardId: string
  setCardName: (value: string) => void
  setSaveCard: (value: boolean) => void
  setSelectedSavedCardId: (value: string) => void
  /** True when the cart contains at least one item set to repeat. */
  hasAutoOrderItems: boolean
  autoOrderConsent: boolean
  setAutoOrderConsent: (value: boolean) => void
  newCardAutoPaymentConsent: boolean
  setNewCardAutoPaymentConsent: (value: boolean) => void
}

function CardBadge({ label, tone }: { label: string; tone: "brand" | "success" | "neutral" }) {
  const toneClass =
    tone === "brand"
      ? "bg-brand/15 text-brand"
      : tone === "success"
        ? "bg-success/15 text-success"
        : "bg-surface-muted text-text-muted"

  return <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${toneClass}`}>{label}</span>
}

export default function FinalReviewPaymentSection({
  cardName,
  isLoadingCards,
  paymentType,
  saveCard,
  savedCards,
  selectedSavedCardId,
  setCardName,
  setSaveCard,
  setSelectedSavedCardId,
  hasAutoOrderItems,
  autoOrderConsent,
  setAutoOrderConsent,
  newCardAutoPaymentConsent,
  setNewCardAutoPaymentConsent,
}: FinalReviewPaymentSectionProps) {
  const { resolvedTheme } = useTheme()
  const id = useId()
  const [mounted, setMounted] = useState(false)
  const isNonCardSelected = paymentType !== "card"
  const isNewCard = selectedSavedCardId === ""

  useEffect(() => {
    setMounted(true)
  }, [])

  const isDark = mounted && resolvedTheme === "dark"

  const selectedCard = useMemo(
    () => savedCards.find((card) => card.stripeCardId === selectedSavedCardId),
    [savedCards, selectedSavedCardId],
  )

  // A card that already carries an off-session mandate can cover auto orders as
  // is; one that does not needs the buyer to allow future automatic charges.
  const needsSavedCardConsent = hasAutoOrderItems && !isNewCard && !selectedCard?.openToAutoPayment
  const savedCardAlreadyOpen = hasAutoOrderItems && !isNewCard && Boolean(selectedCard?.openToAutoPayment)

  const cardElementOptions = useMemo(
    () => ({
      disableLink: true,
      style: {
        base: {
          fontFamily: "Manrope, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
          fontSize: "16px",
          color: isDark ? "#F4F1EA" : "#1F2937",
          iconColor: isDark ? "#F4F1EA" : "#475569",
          "::placeholder": {
            color: isDark ? "#A8B0BD" : "#94A3B8",
          },
        },
        invalid: {
          color: "#DC2626",
          iconColor: "#DC2626",
        },
      },
    }),
    [isDark],
  )

  return (
    <div className="rounded-xl border border-border-soft bg-surface p-6">
      <h3 className="mb-4 text-lg font-semibold text-text-primary">Payment Method</h3>
      <div className="text-sm text-text-secondary">
        <div className="space-y-4">
          {isNonCardSelected ? (
            <div className="rounded-lg border border-warning/30 bg-warning/10 px-3 py-2 text-xs text-warning">
              Only card payments are supported for checkout.
            </div>
          ) : null}

          {hasAutoOrderItems ? (
            <div className="flex items-start gap-2 rounded-lg border border-brand/25 bg-brand/5 px-3 py-2">
              <Repeat className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
              <p className="text-xs text-text-secondary">
                <span className="font-semibold text-text-primary">This order includes repeat items.</span> The card you
                use here becomes your auto order card and will be charged automatically for future deliveries.
              </p>
            </div>
          ) : null}

          <div className="font-medium text-text-primary">Credit/Debit Card</div>
          {isLoadingCards ? (
            <div className="text-xs text-text-muted">Loading saved cards...</div>
          ) : (
            <>
              {savedCards.length > 0 ? (
                <div className="space-y-2">
                  <div className="text-xs font-medium text-text-muted">Saved Cards</div>
                  <div className="space-y-2">
                    {savedCards.map((card) => (
                      <label
                        key={card.id}
                        className={`flex cursor-pointer items-center justify-between rounded-lg border p-3 transition-colors ${
                          selectedSavedCardId === card.stripeCardId
                            ? "border-brand bg-accent"
                            : "border-border-soft bg-surface-elevated"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            name="saved-card"
                            checked={selectedSavedCardId === card.stripeCardId}
                            onChange={() => {
                              setSelectedSavedCardId(card.stripeCardId)
                              setSaveCard(false)
                              setAutoOrderConsent(false)
                            }}
                            className="h-4 w-4 border-border-strong text-brand focus:ring-brand"
                          />
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-sm font-medium text-text-primary">
                                {card.brand?.toUpperCase()} •••• {card.last4}
                              </span>
                              {card.isDefault ? <CardBadge label="Default" tone="neutral" /> : null}
                              {card.autoOrderCard ? <CardBadge label="Auto order card" tone="brand" /> : null}
                              {card.openToAutoPayment ? <CardBadge label="Auto payments on" tone="success" /> : null}
                            </div>
                            <div className="text-xs text-text-muted">
                              Expires {card.expMonth}/{card.expYear}
                            </div>
                          </div>
                        </div>
                        <span className="text-xs text-text-muted">{card.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ) : null}

              <div className="space-y-3">
                <label
                  className={`flex cursor-pointer items-center rounded-lg border p-3 transition-colors ${
                    isNewCard ? "border-brand bg-accent" : "border-border-soft bg-surface-elevated"
                  }`}
                >
                  <input
                    type="radio"
                    name="saved-card"
                    checked={isNewCard}
                    onChange={() => {
                      setSelectedSavedCardId("")
                      setAutoOrderConsent(false)
                    }}
                    className="h-4 w-4 border-border-strong text-brand focus:ring-brand"
                  />
                  <span className="ml-3 text-sm font-medium text-text-primary">Use a new card</span>
                </label>
                {isNewCard ? (
                  <div className="space-y-3">
                    <div>
                      <div className="mb-1 text-xs font-medium text-text-secondary">Card Number</div>
                      <div className="rounded-lg border border-border-soft bg-surface-elevated px-4 py-3">
                        <CardNumberElement options={cardElementOptions} />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div>
                        <div className="mb-1 text-xs font-medium text-text-secondary">Expiry Date</div>
                        <div className="rounded-lg border border-border-soft bg-surface-elevated px-4 py-3">
                          <CardExpiryElement options={cardElementOptions} />
                        </div>
                      </div>
                      <div>
                        <div className="mb-1 text-xs font-medium text-text-secondary">CVC</div>
                        <div className="rounded-lg border border-border-soft bg-surface-elevated px-4 py-3">
                          <CardCvcElement options={cardElementOptions} />
                        </div>
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>

              {savedCardAlreadyOpen ? (
                <div className="rounded-lg border border-border-soft bg-surface-elevated px-3 py-2 text-xs text-text-secondary">
                  This card is already set up for automatic payments and will become your auto order card.
                </div>
              ) : null}

              {needsSavedCardConsent ? (
                <div className="rounded-lg border border-warning/40 bg-warning/10 p-3">
                  <label className="flex cursor-pointer items-start gap-2 text-sm text-text-primary">
                    <input
                      type="checkbox"
                      checked={autoOrderConsent}
                      onChange={(event) => setAutoOrderConsent(event.target.checked)}
                      className="mt-0.5 h-4 w-4 rounded border-border-strong text-brand focus:ring-brand"
                    />
                    <span>
                      Allow this card to be charged automatically for my repeat orders, even when I'm not on the site.
                      <span className="mt-1 block text-xs text-text-secondary">
                        Required to place this order. You can withdraw it anytime from Payment Methods.
                      </span>
                    </span>
                  </label>
                </div>
              ) : null}

              {isNewCard ? (
                <div className="space-y-3">
                  <label className="flex items-start gap-2 text-sm text-text-secondary">
                    <input
                      type="checkbox"
                      checked={hasAutoOrderItems ? true : saveCard}
                      disabled={hasAutoOrderItems}
                      onChange={(event) => setSaveCard(event.target.checked)}
                      className="mt-0.5 h-4 w-4 rounded border-border-strong text-brand focus:ring-brand disabled:opacity-60"
                    />
                    <span>
                      Save this card for future purchases.
                      {hasAutoOrderItems ? (
                        <span className="mt-1 block text-xs text-text-secondary">
                          Required for repeat items — we need a saved card to charge for future deliveries.
                        </span>
                      ) : null}
                    </span>
                  </label>

                  {hasAutoOrderItems || saveCard ? (
                    <div>
                      <label htmlFor={`${id}-card-name`} className="mb-1 block text-xs font-medium text-text-secondary">
                        Card Name
                      </label>
                      <input
                        id={`${id}-card-name`}
                        type="text"
                        value={cardName}
                        onChange={(event) => setCardName(event.target.value)}
                        className="w-full rounded-lg border border-border-soft bg-surface-elevated px-3 py-2 text-sm text-text-primary focus:border-transparent focus:outline-none focus:ring-2 focus:ring-brand/25"
                        placeholder="e.g. Office Visa"
                      />
                    </div>
                  ) : null}

                  {hasAutoOrderItems ? (
                    <p className="rounded-lg border border-border-soft bg-surface-elevated px-3 py-2 text-xs text-text-secondary">
                      By placing this order you allow us to charge this card automatically for your repeat items. It
                      becomes your auto order card and replaces any card you had chosen before.
                    </p>
                  ) : saveCard ? (
                    <label className="flex items-start gap-2 text-sm text-text-secondary">
                      <input
                        type="checkbox"
                        checked={newCardAutoPaymentConsent}
                        onChange={(event) => setNewCardAutoPaymentConsent(event.target.checked)}
                        className="mt-0.5 h-4 w-4 rounded border-border-strong text-brand focus:ring-brand"
                      />
                      <span>
                        Also allow this card for automatic orders.
                        <span className="mt-1 block text-xs text-text-secondary">
                          Makes it your auto order card, so future repeat items can be charged without you being here.
                        </span>
                      </span>
                    </label>
                  ) : null}
                </div>
              ) : null}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
