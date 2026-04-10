"use client"

import { CardCvcElement, CardExpiryElement, CardNumberElement } from "@stripe/react-stripe-js"
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
}: FinalReviewPaymentSectionProps) {
  const { resolvedTheme } = useTheme()
  const id = useId()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const isDark = mounted && resolvedTheme === "dark"

  const cardElementOptions = useMemo(
    () => ({
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
        {paymentType === "card" ? (
          <div className="space-y-4">
            <div className="font-medium text-text-primary">Credit/Debit Card (Stripe)</div>
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
                              }}
                              className="h-4 w-4 border-border-strong text-brand focus:ring-brand"
                            />
                            <div>
                              <div className="text-sm font-medium text-text-primary">
                                {card.brand?.toUpperCase()} •••• {card.last4}
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
                      selectedSavedCardId === "" ? "border-brand bg-accent" : "border-border-soft bg-surface-elevated"
                    }`}
                  >
                    <input
                      type="radio"
                      name="saved-card"
                      checked={selectedSavedCardId === ""}
                      onChange={() => setSelectedSavedCardId("")}
                      className="h-4 w-4 border-border-strong text-brand focus:ring-brand"
                    />
                    <span className="ml-3 text-sm font-medium text-text-primary">Use a new card</span>
                  </label>
                  {selectedSavedCardId === "" ? (
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

                {selectedSavedCardId === "" ? (
                  <div className="space-y-3">
                    <label className="flex items-center gap-2 text-sm text-text-secondary">
                      <input
                        type="checkbox"
                        checked={saveCard}
                        onChange={(event) => setSaveCard(event.target.checked)}
                        className="h-4 w-4 rounded border-border-strong text-brand focus:ring-brand"
                      />
                      Save this card for future purchases.
                    </label>
                    {saveCard ? (
                      <div>
                        <label
                          htmlFor={`${id}-card-name`}
                          className="mb-1 block text-xs font-medium text-text-secondary"
                        >
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
                  </div>
                ) : null}
              </>
            )}
          </div>
        ) : null}
        {paymentType === "net30" ? <div className="font-medium">Net 30 Terms</div> : null}
        {paymentType === "wire" ? <div className="font-medium">Wire Transfer</div> : null}
        {paymentType === "financing" ? <div className="font-medium">Equipment Financing</div> : null}
      </div>
    </div>
  )
}
