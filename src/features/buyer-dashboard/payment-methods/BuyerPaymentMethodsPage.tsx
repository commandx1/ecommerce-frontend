"use client"

import { CardNumberElement, Elements, useElements, useStripe } from "@stripe/react-stripe-js"
import { CheckCircle2, CreditCard, Loader2, Plus, Repeat } from "lucide-react"
import Link from "next/link"
import { useTheme } from "next-themes"
import type React from "react"
import { useCallback, useEffect, useMemo, useState } from "react"
import ConfirmationModal from "@/components/feedback/ConfirmationModal"
import SectionHeading from "@/components/layout/SectionHeading"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Modal from "@/components/ui/Modal"
import SurfaceCard from "@/components/ui/SurfaceCard"
import Skeleton from "@/components/ui/skeleton"
import { showToast } from "@/components/ui/Toast"
import { useStripePromise } from "@/hooks/useStripePromise"
import { paymentMethodsAPI } from "@/lib/api/payment-methods"
import { cn } from "@/lib/utils"
import AddCardModal from "./components/AddCardModal"
import FormField from "./components/FormField"
import PaymentMethodCard from "./components/PaymentMethodCard"
import type { SavedPaymentMethod } from "./paymentMethodsData"

// ── Modal state types ────────────────────────────────────────────────────────

type ModalMode = "add" | "rename" | null

interface RenameState {
  cardId: string
  currentNickname: string
  newNickname: string
}

// ── Inner page (must be inside <Elements>) ───────────────────────────────────

function PaymentMethodsContent() {
  const stripe = useStripe()
  const elements = useElements()
  const { resolvedTheme } = useTheme()

  const [methods, setMethods] = useState<SavedPaymentMethod[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [modalMode, setModalMode] = useState<ModalMode>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [settingDefaultId, setSettingDefaultId] = useState<string | null>(null)
  const [defaultPopoverOpenId, setDefaultPopoverOpenId] = useState<string | null>(null)
  const [deletePopoverOpenId, setDeletePopoverOpenId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Auto order card / off-session mandate
  const [upgradingId, setUpgradingId] = useState<string | null>(null)
  const [autoOrderCardActionId, setAutoOrderCardActionId] = useState<string | null>(null)
  const [stopAutoOrdersFor, setStopAutoOrdersFor] = useState<SavedPaymentMethod | null>(null)

  // Add-card form
  const [nickname, setNickname] = useState("")
  const [makeDefault, setMakeDefault] = useState(false)
  const [allowAutoPayments, setAllowAutoPayments] = useState(true)
  const [useForAutoOrders, setUseForAutoOrders] = useState(false)

  // Rename form
  const [renameState, setRenameState] = useState<RenameState | null>(null)

  // Stripe Elements appearance (mirrors checkout styling)
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    setMounted(true)
  }, [])
  const isDark = mounted && resolvedTheme === "dark"

  const cardElementOptions = useMemo(
    () => ({
      disableLink: true,
      style: {
        base: {
          fontFamily: "Manrope, ui-sans-serif, system-ui, sans-serif",
          fontSize: "16px",
          color: isDark ? "#F4F1EA" : "#1F2937",
          iconColor: isDark ? "#F4F1EA" : "#475569",
          "::placeholder": { color: isDark ? "#A8B0BD" : "#94A3B8" },
        },
        invalid: { color: "#DC2626", iconColor: "#DC2626" },
      },
    }),
    [isDark],
  )

  // ── Data fetching ──────────────────────────────────────────────────────────

  const refreshMethods = useCallback(async () => {
    const cards = await paymentMethodsAPI.getSavedCards()
    setMethods(cards)
  }, [])

  useEffect(() => {
    refreshMethods()
      .catch(() => showToast.error("Failed to load", "Could not fetch payment methods."))
      .finally(() => setIsLoading(false))
  }, [refreshMethods])

  const defaultMethod = methods.find((m) => m.status === "default") ?? null
  const autoOrderMethod = methods.find((m) => m.autoOrderCard) ?? null

  // ── Add card (SetupIntent flow) ────────────────────────────────────────────

  const openAddModal = () => {
    setNickname("")
    setMakeDefault(methods.length === 0)
    setAllowAutoPayments(true)
    setUseForAutoOrders(!autoOrderMethod)
    setModalMode("add")
  }

  const handleAddCard = useCallback(async () => {
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
      const { clientSecret } = await paymentMethodsAPI.createSetupIntent(allowAutoPayments)

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
      const saved = await paymentMethodsAPI.saveCard({
        paymentMethodId: setupIntent.payment_method as string,
        nickname: nickname.trim(),
        makeDefault,
        openToAutoPayment: allowAutoPayments,
        autoOrderCard: allowAutoPayments && useForAutoOrders,
      })

      // Saving can move the default and the auto order card off other cards, so
      // take the server's view rather than patching locally.
      await refreshMethods()

      showToast.success("Card added", `${saved.brandLabel} •••• ${saved.last4} saved.`)
      setModalMode(null)
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
  }, [stripe, elements, nickname, makeDefault, allowAutoPayments, useForAutoOrders, refreshMethods])

  // ── Upgrade an existing card to an off-session mandate ─────────────────────

  const handleEnableAutoPayments = useCallback(
    async (method: SavedPaymentMethod) => {
      if (!stripe) {
        showToast.error("Stripe not ready", "Please refresh and try again.")
        return
      }

      setUpgradingId(method.id)
      try {
        const { clientSecret, setupIntentId } = await paymentMethodsAPI.createAutoPaymentUpgradeSetupIntent(method.id)

        // The payment method is already attached to this SetupIntent — confirming
        // it only re-authorises the card and may prompt for 3D Secure.
        const { setupIntent, error } = await stripe.confirmCardSetup(clientSecret)
        if (error || setupIntent?.status !== "succeeded") {
          showToast.error("Could not authorise the card", error?.message ?? "Your bank did not approve the request.")
          return
        }

        await paymentMethodsAPI.confirmAutoPaymentUpgrade(method.id, setupIntentId)
        await refreshMethods()
        showToast.success("Automatic payments enabled", `${method.brandLabel} •••• ${method.last4} is ready.`)
      } catch {
        showToast.error("Could not enable automatic payments", "Please try again.")
      } finally {
        setUpgradingId(null)
      }
    },
    [stripe, refreshMethods],
  )

  // ── Auto order card ────────────────────────────────────────────────────────

  const handleUseForAutoOrders = useCallback(
    async (method: SavedPaymentMethod) => {
      setAutoOrderCardActionId(method.id)
      try {
        await paymentMethodsAPI.setAutoOrderCard(method.id, true)
        await refreshMethods()
        showToast.success(
          "Auto order card updated",
          `${method.brandLabel} •••• ${method.last4} will pay for auto orders.`,
        )
      } catch (err: unknown) {
        const status = (err as { response?: { status?: number } })?.response?.status
        if (status === 409) {
          showToast.error("Automatic payments required", "Enable automatic payments for this card first.")
        } else {
          showToast.error("Could not update auto order card", "Please try again.")
        }
      } finally {
        setAutoOrderCardActionId(null)
      }
    },
    [refreshMethods],
  )

  const handleStopAutoOrders = useCallback(async () => {
    if (!stopAutoOrdersFor) return

    setAutoOrderCardActionId(stopAutoOrdersFor.id)
    try {
      await paymentMethodsAPI.setAutoOrderCard(stopAutoOrdersFor.id, false)
      await refreshMethods()
      showToast.success("Auto orders paused", "Choose another card to start them again.")
      setStopAutoOrdersFor(null)
    } catch {
      showToast.error("Could not update auto order card", "Please try again.")
    } finally {
      setAutoOrderCardActionId(null)
    }
  }, [stopAutoOrdersFor, refreshMethods])

  // ── Rename ─────────────────────────────────────────────────────────────────

  const openRenameModal = (method: SavedPaymentMethod) => {
    setRenameState({ cardId: method.id, currentNickname: method.nickname, newNickname: method.nickname })
    setModalMode("rename")
  }

  const handleRename = async () => {
    if (!renameState) return
    if (!renameState.newNickname.trim()) {
      showToast.error("Nickname required", "Please enter a name for the card.")
      return
    }

    setIsSaving(true)
    try {
      const updated = await paymentMethodsAPI.updateNickname(renameState.cardId, {
        nickname: renameState.newNickname.trim(),
      })
      setMethods((current) => current.map((m) => (m.id === updated.id ? updated : m)))
      showToast.success("Card renamed")
      setModalMode(null)
    } catch {
      showToast.error("Failed to rename card")
    } finally {
      setIsSaving(false)
    }
  }

  // ── Delete ─────────────────────────────────────────────────────────────────

  const removeMethod = async (method: SavedPaymentMethod) => {
    if (methods.length === 1) {
      showToast.warning("Cannot remove", "At least one payment method must remain.")
      setDeletePopoverOpenId(null)
      return
    }

    setDeletingId(method.id)
    try {
      await paymentMethodsAPI.deleteCard(method.id)
      // Deleting can promote another card to default and pause auto orders, so
      // read the result back instead of guessing.
      await refreshMethods()
      if (method.autoOrderCard) {
        showToast.success("Card removed", "Your auto orders are paused until you choose another card.")
      } else {
        showToast.success("Card removed")
      }
    } catch {
      showToast.error("Failed to remove card")
    } finally {
      setDeletingId(null)
      setDeletePopoverOpenId(null)
    }
  }

  // ── Set default ────────────────────────────────────────────────────────────

  const setAsDefault = async (method: SavedPaymentMethod) => {
    setSettingDefaultId(method.id)
    try {
      const updated = await paymentMethodsAPI.setDefault(method.id)
      setMethods((current) =>
        current.map((m) => {
          if (m.id === updated.id) return updated
          if (m.status === "default") return { ...m, status: "active" }
          return m
        }),
      )
      showToast.success("Default updated", "Primary payment method changed.")
    } catch {
      showToast.error("Failed to update default")
    } finally {
      setSettingDefaultId(null)
      setDefaultPopoverOpenId(null)
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  const sortedMethods = [...methods].sort((a, b) => {
    if (a.status === "default") return -1
    if (b.status === "default") return 1
    return a.nickname.localeCompare(b.nickname)
  })

  return (
    <div className="space-y-6">
      {/* Header + KPIs */}
      <SurfaceCard as="section" variant="glass" className="p-6">
        <SectionHeading
          titleAs="h1"
          variant="technical"
          title="Payment Methods"
          description="Manage cards used for invoice settlement. Cards are stored securely by Stripe — we only hold the last 4 digits and expiry."
          actions={
            <Button type="button" onClick={openAddModal}>
              <Plus className="h-4 w-4" />
              Add New Card
            </Button>
          }
        />

        <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
          {isLoading ? (
            [0, 1, 2].map((i) => <Skeleton key={i} className="h-[8.5rem] rounded-xl" />)
          ) : (
            <>
              <KpiCard
                icon={<CreditCard className="h-5 w-5 text-brand" />}
                label="Saved Cards"
                value={String(methods.length)}
                hint="Ready for payments"
              />
              <KpiCard
                icon={<CheckCircle2 className="h-5 w-5 text-success" />}
                label="Default Method"
                value={defaultMethod ? `${defaultMethod.brandLabel} •••• ${defaultMethod.last4}` : "N/A"}
                hint={defaultMethod?.nickname ?? "Not set"}
              />
              <KpiCard
                icon={<Repeat className="h-5 w-5 text-brand" />}
                label="Auto Order Card"
                value={autoOrderMethod ? `${autoOrderMethod.brandLabel} •••• ${autoOrderMethod.last4}` : "Not set"}
                hint={
                  autoOrderMethod ? (
                    <Link
                      href="/buyer-dashboard/auto-orders"
                      className="font-semibold text-brand underline underline-offset-2 hover:text-brand-strong"
                    >
                      Manage auto orders
                    </Link>
                  ) : (
                    "Pick a card to run auto orders"
                  )
                }
              />
            </>
          )}
        </div>
      </SurfaceCard>

      {/* Card list */}
      <section className="rounded-[1.25rem] border border-border-soft bg-surface p-6 shadow-soft">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-text-primary">Saved Cards</h2>
          <span className="text-sm text-text-muted">
            {isLoading ? <Skeleton className="h-4 w-14" /> : `${methods.length} cards`}
          </span>
        </div>

        {isLoading ? (
          <div aria-busy="true" className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <span className="sr-only">Loading payment methods...</span>
            {[0, 1].map((i) => (
              <article key={i} className="rounded-xl border border-border-soft bg-surface-elevated p-5">
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Skeleton className="h-6 w-16 rounded-full" />
                    <Skeleton className="h-6 w-16 rounded-full" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-8 w-8 rounded-lg" />
                    <Skeleton className="h-8 w-8 rounded-lg" />
                  </div>
                </div>
                <Skeleton className="h-6 w-40" />
                <div className="mt-4 grid grid-cols-2 gap-3">
                  {[0, 1, 2, 3].map((j) => (
                    <div key={j} className="space-y-1">
                      <Skeleton className="h-3 w-16" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex gap-2">
                  {[0, 1, 2].map((k) => (
                    <Skeleton key={k} className="h-8 w-28 rounded-lg" />
                  ))}
                </div>
              </article>
            ))}
          </div>
        ) : methods.length === 0 ? (
          <p className="py-8 text-center text-sm text-text-muted">No saved cards yet. Add a card to get started.</p>
        ) : (
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            {sortedMethods.map((method) => (
              <PaymentMethodCard
                key={method.id}
                method={method}
                deletingId={deletingId}
                settingDefaultId={settingDefaultId}
                upgradingId={upgradingId}
                autoOrderCardActionId={autoOrderCardActionId}
                deletePopoverOpenId={deletePopoverOpenId}
                defaultPopoverOpenId={defaultPopoverOpenId}
                setDeletePopoverOpenId={setDeletePopoverOpenId}
                setDefaultPopoverOpenId={setDefaultPopoverOpenId}
                onRename={openRenameModal}
                onRemove={(m) => {
                  void removeMethod(m)
                }}
                onSetDefault={(m) => {
                  void setAsDefault(m)
                }}
                onEnableAutoPayments={(m) => {
                  void handleEnableAutoPayments(m)
                }}
                onUseForAutoOrders={(m) => {
                  void handleUseForAutoOrders(m)
                }}
                onRequestStopAutoOrders={setStopAutoOrdersFor}
              />
            ))}
          </div>
        )}
      </section>

      <AddCardModal
        isOpen={modalMode === "add"}
        isSaving={isSaving}
        nickname={nickname}
        makeDefault={makeDefault}
        allowAutoPayments={allowAutoPayments}
        useForAutoOrders={useForAutoOrders}
        hasExistingAutoOrderCard={Boolean(autoOrderMethod)}
        cardElementOptions={cardElementOptions}
        onNicknameChange={setNickname}
        onMakeDefaultChange={setMakeDefault}
        onAllowAutoPaymentsChange={setAllowAutoPayments}
        onUseForAutoOrdersChange={setUseForAutoOrders}
        onClose={() => setModalMode(null)}
        onSubmit={() => {
          void handleAddCard()
        }}
      />

      {/* Rename modal */}
      <Modal
        isOpen={modalMode === "rename"}
        onClose={() => setModalMode(null)}
        title="Rename Card"
        maxWidthClassName="max-w-sm"
      >
        <div className="p-6">
          <h3 className="text-xl font-semibold text-text-primary">Rename card</h3>
          <p className="mt-1 text-sm text-text-secondary">Update the display name for this card.</p>

          <div className="mt-5">
            <FormField label="New nickname">
              <Input
                value={renameState?.newNickname ?? ""}
                onChange={(e) => setRenameState((s) => (s ? { ...s, newNickname: e.target.value } : s))}
                placeholder="e.g. Backup Card"
                disabled={isSaving}
              />
            </FormField>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => setModalMode(null)} disabled={isSaving}>
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => {
                void handleRename()
              }}
              disabled={isSaving}
            >
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmationModal
        isOpen={Boolean(stopAutoOrdersFor)}
        onClose={() => setStopAutoOrdersFor(null)}
        onConfirm={() => {
          void handleStopAutoOrders()
        }}
        title="Stop using this card for auto orders?"
        description="All of your active auto orders will be paused until you pick another card. Your schedules are kept, so you can resume them later."
        confirmText="Stop auto orders"
        cancelText="Keep using it"
        isDanger
        isLoading={autoOrderCardActionId === stopAutoOrdersFor?.id}
      />
    </div>
  )
}

// ── Outer wrapper — provides Stripe context ───────────────────────────────────

export default function BuyerPaymentMethodsPage() {
  const stripePromise = useStripePromise()

  if (!stripePromise) {
    return (
      <SurfaceCard variant="glass" className="p-8 text-center text-sm text-text-secondary">
        Stripe publishable key is missing. Set <code>NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY</code>.
      </SurfaceCard>
    )
  }

  return (
    <Elements stripe={stripePromise}>
      <PaymentMethodsContent />
    </Elements>
  )
}

// ── Small presentational components ─────────────────────────────────────────

function KpiCard({
  icon,
  label,
  value,
  hint,
}: {
  icon: React.ReactNode
  label: string
  value: string
  hint: React.ReactNode
}) {
  return (
    <article className={cn("rounded-xl border border-border-soft bg-surface p-4")}>
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-surface-muted">{icon}</div>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-text-muted">{label}</p>
      <p className="mt-1 text-xl font-semibold text-text-primary">{value}</p>
      <p className="mt-1 text-xs text-text-secondary">{hint}</p>
    </article>
  )
}
