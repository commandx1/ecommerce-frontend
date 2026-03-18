"use client"

import { useEffect, useState } from "react"
import { ArrowLeft, ArrowRight, CheckCircle } from "lucide-react"
import { toast } from "sonner"
import { useCheckoutStore } from "@/stores/checkoutStore"
import { ordersAPI, type SavedCard } from "@/lib/api/orders"
import { CardElement, Elements, useElements, useStripe } from "@stripe/react-stripe-js"
import { loadStripe } from "@stripe/stripe-js"

const stripePublishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ""
const stripePromise = stripePublishableKey ? loadStripe(stripePublishableKey) : null

const cardElementStyles = {
  style: {
    base: {
      fontSize: "16px",
      color: "#111827",
      fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
      "::placeholder": {
        color: "#9CA3AF",
      },
    },
    invalid: {
      color: "#DC2626",
    },
  },
}

const FinalReviewContent = () => {
  const {
    shippingAddress,
    billingAddress,
    paymentMethod,
    previousStep,
    nextStep,
    orderPayload,
    setOrderResult,
    saveCard,
    setSaveCard,
    cardName,
    setCardName,
  } = useCheckoutStore()
  const stripe = useStripe()
  const elements = useElements()
  const [isPlacingOrder, setIsPlacingOrder] = useState(false)
  const [savedCards, setSavedCards] = useState<SavedCard[]>([])
  const [isLoadingCards, setIsLoadingCards] = useState(false)
  const [selectedSavedCardId, setSelectedSavedCardId] = useState<string>("")

  useEffect(() => {
    if (paymentMethod.type !== "card") return
    let isMounted = true
    setIsLoadingCards(true)
    ordersAPI
      .getSavedCards()
      .then((response) => {
        if (!isMounted) return
        setSavedCards(response.cards || [])
      })
      .catch((error: any) => {
        if (!isMounted) return
        const message = error?.response?.data?.message
        if (message && message.includes("No active cards")) {
          setSavedCards([])
          return
        }
        toast.error("Failed to load saved cards.")
      })
      .finally(() => {
        if (isMounted) setIsLoadingCards(false)
      })

    return () => {
      isMounted = false
    }
  }, [paymentMethod.type])

  const handlePlaceOrder = async () => {
    if (!orderPayload) {
      toast.error("Order information is missing. Please go back and review your shipping details.")
      return
    }

    try {
      setIsPlacingOrder(true)
      const payload = {
        ...orderPayload,
        ...(paymentMethod.type === "card" && saveCard
          ? { cardSave: 1, cardName: cardName.trim() || "Card" }
          : {}),
      }
      const response = await ordersAPI.placeOrder(payload)

      if (paymentMethod.type === "card") {
        if (!stripe || !elements) {
          toast.error("Stripe is not ready. Please refresh and try again.")
          return
        }
        if (!response.clientSecret) {
          toast.error("Payment could not be initiated. Missing client secret.")
          return
        }

        let confirmResult
        if (selectedSavedCardId) {
          confirmResult = await stripe.confirmCardPayment(
            response.clientSecret,
            { payment_method: selectedSavedCardId },
            { redirect: "if_required" },
          )
        } else {
          const cardElement = elements.getElement(CardElement)
          if (!cardElement) {
            toast.error("Please enter your card details.")
            return
          }
          confirmResult = await stripe.confirmCardPayment(
            response.clientSecret,
            {
              payment_method: {
                card: cardElement,
                billing_details: {
                  name: `${shippingAddress.firstName} ${shippingAddress.lastName}`.trim() || undefined,
                },
              },
            },
            { redirect: "if_required" },
          )
        }

        if (confirmResult?.error) {
          toast.error(confirmResult.error.message || "Payment failed. Please try again.")
          return
        }
      }

      toast.success(`Order placed successfully. Order ID: ${response.orderId}`)
      setOrderResult(response)
      nextStep()
    } catch (error: any) {
      const message = error?.response?.data?.message || "Failed to place order. Please try again."
      toast.error(message)
    } finally {
      setIsPlacingOrder(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center">
          <div className="w-8 h-8 bg-steel-blue rounded-full flex items-center justify-center mr-4">
            <span className="text-white text-sm font-semibold">4</span>
          </div>
          <h2 className="text-2xl font-bold text-steel-blue">Final Review</h2>
        </div>
      </div>

      <div className="space-y-6 mb-8">
        <div className="p-6 bg-light-mint-gray rounded-xl">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Shipping Address</h3>
          <div className="text-sm text-gray-600">
            <div className="font-medium">
              {shippingAddress.firstName} {shippingAddress.lastName}
            </div>
            <div>{shippingAddress.company}</div>
            <div>{shippingAddress.street}</div>
            <div>
              {shippingAddress.city}, {shippingAddress.state} {shippingAddress.zipCode}
            </div>
            <div>{shippingAddress.phone}</div>
          </div>
        </div>

        <div className="p-6 bg-light-mint-gray rounded-xl">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Billing Address</h3>
          <div className="text-sm text-gray-600">
            {billingAddress.sameAsShipping ? (
              <div>Same as shipping address</div>
            ) : (
              <>
                <div className="font-medium">
                  {billingAddress.firstName} {billingAddress.lastName}
                </div>
                <div>{billingAddress.company}</div>
                <div>{billingAddress.street}</div>
                <div>
                  {billingAddress.city}, {billingAddress.state} {billingAddress.zipCode}
                </div>
                <div>{billingAddress.phone}</div>
              </>
            )}
          </div>
        </div>

        <div className="p-6 bg-light-mint-gray rounded-xl">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Method</h3>
          <div className="text-sm text-gray-600">
            {paymentMethod.type === "card" && (
              <div className="space-y-4">
                <div className="font-medium text-gray-900">Credit/Debit Card (Stripe)</div>
                {isLoadingCards ? (
                  <div className="text-xs text-gray-500">Loading saved cards...</div>
                ) : (
                  <>
                    {savedCards.length > 0 && (
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
                    )}
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
                      {selectedSavedCardId === "" && (
                        <div className="rounded-lg border border-gray-200 bg-white px-4 py-3">
                          <CardElement options={cardElementStyles} />
                        </div>
                      )}
                    </div>
                    {selectedSavedCardId === "" && (
                      <div className="space-y-3">
                        <label className="flex items-center gap-2 text-sm text-gray-600">
                          <input
                            type="checkbox"
                            checked={saveCard}
                            onChange={(e) => setSaveCard(e.target.checked)}
                            className="w-4 h-4 text-steel-blue focus:ring-steel-blue border-gray-300 rounded"
                          />
                          Save this card for future purchases.
                        </label>
                        {saveCard && (
                          <div>
                            <label htmlFor="card-name" className="block text-xs font-medium text-gray-600 mb-1">
                              Card Name
                            </label>
                            <input
                              id="card-name"
                              type="text"
                              value={cardName}
                              onChange={(e) => setCardName(e.target.value)}
                              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-steel-blue focus:border-transparent"
                              placeholder="e.g. Office Visa"
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
            {paymentMethod.type === "net30" && <div className="font-medium">Net 30 Terms</div>}
            {paymentMethod.type === "wire" && <div className="font-medium">Wire Transfer</div>}
            {paymentMethod.type === "financing" && <div className="font-medium">Equipment Financing</div>}
          </div>
        </div>
      </div>

      <div className="bg-green-50 border border-green-200 rounded-xl p-6 mb-8">
        <div className="flex items-center mb-2">
          <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
          <span className="text-sm font-medium text-green-800">Ready to Place Order</span>
        </div>
        <p className="text-xs text-green-700">
          Please review all information above. Once you place your order, you will receive a confirmation email.
        </p>
      </div>

      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={previousStep}
          className="flex items-center px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition-colors"
        >
          <ArrowLeft className="mr-2 w-5 h-5" />
          Back to Billing
        </button>
        <button
          type="button"
          onClick={handlePlaceOrder}
          disabled={
            isPlacingOrder ||
            (paymentMethod.type === "card" && !stripePublishableKey) ||
            (paymentMethod.type === "card" && !selectedSavedCardId && !elements?.getElement(CardElement))
          }
          className="flex items-center px-8 py-3 bg-steel-blue text-white rounded-lg hover:bg-opacity-90 font-semibold transition-colors disabled:opacity-60"
        >
          {isPlacingOrder ? "Placing Order..." : "Place Order"}
          <ArrowRight className="ml-2 w-5 h-5" />
        </button>
      </div>
    </div>
  )
}

const FinalReview = () => {
  if (!stripePromise) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-steel-blue rounded-full flex items-center justify-center mr-4">
              <span className="text-white text-sm font-semibold">4</span>
            </div>
            <h2 className="text-2xl font-bold text-steel-blue">Final Review</h2>
          </div>
        </div>
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Stripe publishable key is missing. Please set `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` to enable card payments.
        </div>
      </div>
    )
  }

  return (
    <Elements stripe={stripePromise}>
      <FinalReviewContent />
    </Elements>
  )
}

export default FinalReview
