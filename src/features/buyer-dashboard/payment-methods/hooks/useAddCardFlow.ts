"use client"

import { CardNumberElement, useElements, useStripe } from "@stripe/react-stripe-js"
import { useCallback, useState } from "react"
import { showToast } from "@/components/ui/Toast"
import { paymentMethodsCommands } from "../api/payment-methods-commands"

export interface UseAddCardFlowResult {
  isOpen: boolean
  isSaving: boolean
  nickname: string
  makeDefault: boolean
  allowAutoPayments: boolean
  useForAutoOrders: boolean
  open: () => void
  close: () => void
  setNickname: (value: string) => void
  setMakeDefault: (value: boolean) => void
  setAllowAutoPayments: (value: boolean) => void
  setUseForAutoOrders: (value: boolean) => void
  submit: () => void
}

/**
 * The 3-step SetupIntent add-card flow. Stripe stays imperative (`confirmCardSetup` has no
 * query-cache shape); only `paymentMethodsCommands.saveCard` touches the cache.
 */
export function useAddCardFlow({
  hasCards,
  hasAutoOrderCard,
}: {
  hasCards: boolean
  hasAutoOrderCard: boolean
}): UseAddCardFlowResult {
  const stripe = useStripe()
  const elements = useElements()

  const [isOpen, setIsOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [nickname, setNickname] = useState("")
  const [makeDefault, setMakeDefault] = useState(false)
  const [allowAutoPayments, setAllowAutoPayments] = useState(true)
  const [useForAutoOrders, setUseForAutoOrders] = useState(false)

  const open = useCallback(() => {
    setNickname("")
    setMakeDefault(!hasCards)
    setAllowAutoPayments(true)
    setUseForAutoOrders(!hasAutoOrderCard)
    setIsOpen(true)
  }, [hasCards, hasAutoOrderCard])

  const close = useCallback(() => setIsOpen(false), [])

  const submit = useCallback(() => {
    void (async () => {
      if (!stripe || !elements) {
        showToast.error("Stripe not ready", "Please refresh and try again.")
        return
      }
      if (!nickname.trim()) {
        showToast.error("Nickname required", "Please give this card a name.")
        return
      }

      setIsSaving(true)
      try {
        // 1. Backend creates a SetupIntent — card data never touches our server.
        //    The flag decides the Stripe mandate (off_session vs on_session).
        const { clientSecret } = await paymentMethodsCommands.createSetupIntent(allowAutoPayments)

        // 2. Stripe confirms the setup using the card details entered in CardNumberElement
        const cardElement = elements.getElement(CardNumberElement)
        if (!cardElement) {
          showToast.error("Card details missing", "Please enter your card details.")
          return
        }

        const { setupIntent, error } = await stripe.confirmCardSetup(clientSecret, {
          payment_method: { card: cardElement },
        })

        if (error || !setupIntent?.payment_method) {
          showToast.error("Card declined", error?.message ?? "Could not verify the card.")
          return
        }

        // 3. Tell our backend to retrieve & persist the PaymentMethod
        const saved = await paymentMethodsCommands.saveCard({
          paymentMethodId: setupIntent.payment_method as string,
          nickname: nickname.trim(),
          makeDefault,
          openToAutoPayment: allowAutoPayments,
          autoOrderCard: allowAutoPayments && useForAutoOrders,
        })

        showToast.success("Card added", `${saved.brandLabel} •••• ${saved.last4} saved.`)
        setIsOpen(false)
      } catch (err: unknown) {
        const status = (err as { response?: { status?: number } })?.response?.status
        if (status === 409) {
          showToast.error("Card not saved", "This card is already linked to your account, or it can't be used here.")
        } else {
          showToast.error("Failed to add card", "Please try again.")
        }
      } finally {
        setIsSaving(false)
      }
    })()
  }, [stripe, elements, nickname, makeDefault, allowAutoPayments, useForAutoOrders])

  return {
    isOpen,
    isSaving,
    nickname,
    makeDefault,
    allowAutoPayments,
    useForAutoOrders,
    open,
    close,
    setNickname,
    setMakeDefault,
    setAllowAutoPayments,
    setUseForAutoOrders,
    submit,
  }
}
