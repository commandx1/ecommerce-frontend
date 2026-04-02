import { CardCvcElement, CardExpiryElement, CardNumberElement } from "@stripe/react-stripe-js"
import { useId } from "react"
import type { SavedCard } from "@/lib/api/orders"

const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
      fontSize: "16px",
      color: "#111827",
      "::placeholder": {
        color: "#9CA3AF",
      },
    },
    invalid: {
      color: "#DC2626",
    },
  },
}

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
  const id = useId()

  return (
    <div className="p-6 bg-gray-50 rounded-xl">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Method</h3>
      <div className="text-sm text-gray-600">
        {paymentType === "card" ? (
          <div className="space-y-4">
            <div className="font-medium text-gray-900">Credit/Debit Card (Stripe)</div>
            {isLoadingCards ? (
              <div className="text-xs text-gray-500">Loading saved cards...</div>
            ) : (
              <>
                {savedCards.length > 0 ? (
                  <div className="space-y-2">
                    <div className="text-xs font-medium text-gray-500">Saved Cards</div>
                    <div className="space-y-2">
                      {savedCards.map((card) => (
                        <label
                          key={card.id}
                          className={`flex items-center justify-between border rounded-lg p-3 cursor-pointer transition-colors ${
                            selectedSavedCardId === card.stripeCardId
                              ? "border-steel-blue bg-white"
                              : "border-gray-200 bg-white"
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
                              className="w-4 h-4 text-steel-blue focus:ring-steel-blue border-gray-300"
                            />
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {card.brand?.toUpperCase()} •••• {card.last4}
                              </div>
                              <div className="text-xs text-gray-500">
                                Expires {card.expMonth}/{card.expYear}
                              </div>
                            </div>
                          </div>
                          <span className="text-xs text-gray-500">{card.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ) : null}

                <div className="space-y-3">
                  <label
                    className={`flex items-center border rounded-lg p-3 cursor-pointer transition-colors ${
                      selectedSavedCardId === "" ? "border-steel-blue bg-white" : "border-gray-200 bg-white"
                    }`}
                  >
                    <input
                      type="radio"
                      name="saved-card"
                      checked={selectedSavedCardId === ""}
                      onChange={() => setSelectedSavedCardId("")}
                      className="w-4 h-4 text-steel-blue focus:ring-steel-blue border-gray-300"
                    />
                    <span className="ml-3 text-sm font-medium text-gray-900">Use a new card</span>
                  </label>
                  {selectedSavedCardId === "" ? (
                    <div className="space-y-3">
                      <div>
                        <div className="mb-1 text-xs font-medium text-gray-600">Card Number</div>
                        <div className="rounded-lg border border-gray-200 bg-white px-4 py-3">
                          <CardNumberElement options={CARD_ELEMENT_OPTIONS} />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div>
                          <div className="mb-1 text-xs font-medium text-gray-600">Expiry Date</div>
                          <div className="rounded-lg border border-gray-200 bg-white px-4 py-3">
                            <CardExpiryElement options={CARD_ELEMENT_OPTIONS} />
                          </div>
                        </div>
                        <div>
                          <div className="mb-1 text-xs font-medium text-gray-600">CVC</div>
                          <div className="rounded-lg border border-gray-200 bg-white px-4 py-3">
                            <CardCvcElement options={CARD_ELEMENT_OPTIONS} />
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>

                {selectedSavedCardId === "" ? (
                  <div className="space-y-3">
                    <label className="flex items-center gap-2 text-sm text-gray-600">
                      <input
                        type="checkbox"
                        checked={saveCard}
                        onChange={(event) => setSaveCard(event.target.checked)}
                        className="w-4 h-4 text-steel-blue focus:ring-steel-blue border-gray-300 rounded"
                      />
                      Save this card for future purchases.
                    </label>
                    {saveCard ? (
                      <div>
                        <label htmlFor={`${id}-card-name`} className="block text-xs font-medium text-gray-600 mb-1">
                          Card Name
                        </label>
                        <input
                          id={`${id}-card-name`}
                          type="text"
                          value={cardName}
                          onChange={(event) => setCardName(event.target.value)}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-steel-blue focus:border-transparent"
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
