"use client"

import { useId } from "react"
import StripeCardFields from "@/components/payments/StripeCardFields"

interface NewCardFormProps {
  cardName: string
  setCardName: (value: string) => void
  saveCard: boolean
  setSaveCard: (value: boolean) => void
  hasAutoOrderItems: boolean
  newCardAutoPaymentConsent: boolean
  setNewCardAutoPaymentConsent: (value: boolean) => void
}

export default function NewCardForm({
  cardName,
  setCardName,
  saveCard,
  setSaveCard,
  hasAutoOrderItems,
  newCardAutoPaymentConsent,
  setNewCardAutoPaymentConsent,
}: NewCardFormProps) {
  const id = useId()

  return (
    <div className="space-y-4">
      <StripeCardFields />

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
                Required for auto order items — we need a saved card to charge for future deliveries.
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
            By placing this order you allow us to charge this card automatically for your auto order items. It becomes
            your auto order card and replaces any card you had chosen before.
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
                Makes it your auto order card, so future auto order items can be charged without you being here.
              </span>
            </span>
          </label>
        ) : null}
      </div>
    </div>
  )
}
