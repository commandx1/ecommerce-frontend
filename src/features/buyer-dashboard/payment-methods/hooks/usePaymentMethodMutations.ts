"use client"

import { useStripe } from "@stripe/react-stripe-js"
import { useState } from "react"
import { showToast } from "@/components/ui/Toast"
import { paymentMethodsCommands } from "../api/payment-methods-commands"
import type { SavedPaymentMethod } from "../paymentMethodsData"

interface RenameState {
  cardId: string
  currentNickname: string
  newNickname: string
}

export interface UsePaymentMethodMutationsResult {
  deletingId: string | null
  settingDefaultId: string | null
  upgradingId: string | null
  autoOrderCardActionId: string | null
  defaultPopoverOpenId: string | null
  deletePopoverOpenId: string | null
  setDefaultPopoverOpenId: (id: string | null) => void
  setDeletePopoverOpenId: (id: string | null) => void
  stopAutoOrdersFor: SavedPaymentMethod | null
  requestStopAutoOrders: (method: SavedPaymentMethod | null) => void
  confirmStopAutoOrders: () => void
  renameState: RenameState | null
  isRenaming: boolean
  openRenameModal: (method: SavedPaymentMethod) => void
  closeRenameModal: () => void
  setRenameNickname: (value: string) => void
  submitRename: () => void
  removeMethod: (method: SavedPaymentMethod) => void
  setAsDefault: (method: SavedPaymentMethod) => void
  enableAutomaticPayments: (method: SavedPaymentMethod) => void
  useForAutoOrders: (method: SavedPaymentMethod) => void
}

/**
 * Every action on an existing card: rename/set-default patch the cache (no GET), the rest
 * invalidate it (one GET). `methodCount` gates the "can't remove the last card" guard, the only
 * validation that is not the backend's.
 */
export function usePaymentMethodMutations(methodCount: number): UsePaymentMethodMutationsResult {
  const stripe = useStripe()

  const [settingDefaultId, setSettingDefaultId] = useState<string | null>(null)
  const [defaultPopoverOpenId, setDefaultPopoverOpenId] = useState<string | null>(null)
  const [deletePopoverOpenId, setDeletePopoverOpenId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [upgradingId, setUpgradingId] = useState<string | null>(null)
  const [autoOrderCardActionId, setAutoOrderCardActionId] = useState<string | null>(null)
  const [stopAutoOrdersFor, setStopAutoOrdersFor] = useState<SavedPaymentMethod | null>(null)
  const [renameState, setRenameState] = useState<RenameState | null>(null)
  const [isRenaming, setIsRenaming] = useState(false)

  const openRenameModal = (method: SavedPaymentMethod) => {
    setRenameState({ cardId: method.id, currentNickname: method.nickname, newNickname: method.nickname })
  }

  const closeRenameModal = () => setRenameState(null)

  const setRenameNickname = (value: string) => {
    setRenameState((current) => (current ? { ...current, newNickname: value } : current))
  }

  const submitRename = () => {
    if (!renameState) return
    if (!renameState.newNickname.trim()) {
      showToast.error("Nickname required", "Please enter a name for the card.")
      return
    }

    setIsRenaming(true)
    void paymentMethodsCommands
      .renameCard(renameState.cardId, renameState.newNickname.trim())
      .then(() => {
        showToast.success("Card renamed")
        setRenameState(null)
      })
      .catch(() => showToast.error("Failed to rename card"))
      .finally(() => setIsRenaming(false))
  }

  const removeMethod = (method: SavedPaymentMethod) => {
    if (methodCount === 1) {
      showToast.warning("Cannot remove", "At least one payment method must remain.")
      setDeletePopoverOpenId(null)
      return
    }

    setDeletingId(method.id)
    void paymentMethodsCommands
      .deleteCard(method.id)
      .then(() => {
        if (method.autoOrderCard) {
          showToast.success("Card removed", "Your auto orders are paused until you choose another card.")
        } else {
          showToast.success("Card removed")
        }
      })
      .catch(() => showToast.error("Failed to remove card"))
      .finally(() => {
        setDeletingId(null)
        setDeletePopoverOpenId(null)
      })
  }

  const setAsDefault = (method: SavedPaymentMethod) => {
    setSettingDefaultId(method.id)
    void paymentMethodsCommands
      .setDefaultCard(method.id)
      .then(() => showToast.success("Default updated", "Primary payment method changed."))
      .catch(() => showToast.error("Failed to update default"))
      .finally(() => {
        setSettingDefaultId(null)
        setDefaultPopoverOpenId(null)
      })
  }

  const enableAutomaticPayments = (method: SavedPaymentMethod) => {
    if (!stripe) {
      showToast.error("Stripe not ready", "Please refresh and try again.")
      return
    }

    setUpgradingId(method.id)
    void (async () => {
      try {
        const { clientSecret, setupIntentId } = await paymentMethodsCommands.createAutoPaymentUpgradeSetupIntent(
          method.id,
        )

        // The payment method is already attached to this SetupIntent — confirming
        // it only re-authorises the card and may prompt for 3D Secure.
        const { setupIntent, error } = await stripe.confirmCardSetup(clientSecret)
        if (error || setupIntent?.status !== "succeeded") {
          showToast.error("Could not authorise the card", error?.message ?? "Your bank did not approve the request.")
          return
        }

        await paymentMethodsCommands.confirmAutoPaymentUpgrade(method.id, setupIntentId)
        showToast.success("Automatic payments enabled", `${method.brandLabel} •••• ${method.last4} is ready.`)
      } catch {
        showToast.error("Could not enable automatic payments", "Please try again.")
      } finally {
        setUpgradingId(null)
      }
    })()
  }

  const useForAutoOrders = (method: SavedPaymentMethod) => {
    setAutoOrderCardActionId(method.id)
    void paymentMethodsCommands
      .setAutoOrderCard(method.id, true)
      .then(() =>
        showToast.success(
          "Auto order card updated",
          `${method.brandLabel} •••• ${method.last4} will pay for auto orders.`,
        ),
      )
      .catch((err: unknown) => {
        const status = (err as { response?: { status?: number } })?.response?.status
        if (status === 409) {
          showToast.error("Automatic payments required", "Enable automatic payments for this card first.")
        } else {
          showToast.error("Could not update auto order card", "Please try again.")
        }
      })
      .finally(() => setAutoOrderCardActionId(null))
  }

  const requestStopAutoOrders = (method: SavedPaymentMethod | null) => setStopAutoOrdersFor(method)

  const confirmStopAutoOrders = () => {
    if (!stopAutoOrdersFor) return

    const method = stopAutoOrdersFor
    setAutoOrderCardActionId(method.id)
    void paymentMethodsCommands
      .setAutoOrderCard(method.id, false)
      .then(() => {
        showToast.success("Auto orders paused", "Choose another card to start them again.")
        setStopAutoOrdersFor(null)
      })
      .catch(() => showToast.error("Could not update auto order card", "Please try again."))
      .finally(() => setAutoOrderCardActionId(null))
  }

  return {
    deletingId,
    settingDefaultId,
    upgradingId,
    autoOrderCardActionId,
    defaultPopoverOpenId,
    deletePopoverOpenId,
    setDefaultPopoverOpenId,
    setDeletePopoverOpenId,
    stopAutoOrdersFor,
    requestStopAutoOrders,
    confirmStopAutoOrders,
    renameState,
    isRenaming,
    openRenameModal,
    closeRenameModal,
    setRenameNickname,
    submitRename,
    removeMethod,
    setAsDefault,
    enableAutomaticPayments,
    useForAutoOrders,
  }
}
