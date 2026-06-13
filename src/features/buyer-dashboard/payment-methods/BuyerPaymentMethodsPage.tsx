"use client"

import { CardCvcElement, CardExpiryElement, CardNumberElement, Elements, useElements, useStripe } from "@stripe/react-stripe-js"
import { loadStripe } from "@stripe/stripe-js"
import { CheckCircle2, CreditCard, Edit3, Loader2, LoaderCircle, Plus, Trash2 } from "lucide-react"
import { useTheme } from "next-themes"
import React, { useCallback, useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import Modal from "@/components/ui/Modal"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { showToast } from "@/components/ui/Toast"
import { cn } from "@/lib/utils"
import { paymentMethodsAPI } from "@/lib/api/payment-methods"
import { type SavedPaymentMethod } from "./paymentMethodsData"

const stripePublishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? ""
const stripePromise = stripePublishableKey ? loadStripe(stripePublishableKey) : null

// ── Modal state types ────────────────────────────────────────────────────────

type ModalMode = "add" | "rename" | null

interface RenameState {
  cardId: string
  currentNickname: string
  newNickname: string
}

// ── Brand → CSS tone map ─────────────────────────────────────────────────────

const methodToneMap: Record<SavedPaymentMethod["type"], string> = {
  visa: "bg-brand/15 text-brand",
  mastercard: "bg-warning/18 text-warning",
  amex: "bg-success/15 text-success",
  bank: "bg-surface-muted text-text-secondary",
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

  // Add-card form
  const [nickname, setNickname] = useState("")
  const [makeDefault, setMakeDefault] = useState(false)

  // Rename form
  const [renameState, setRenameState] = useState<RenameState | null>(null)

  // Stripe Elements appearance (mirrors checkout styling)
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])
  const isDark = mounted && resolvedTheme === "dark"

  const cardElementOptions = useMemo(() => ({
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
  }), [isDark])

  // ── Data fetching ──────────────────────────────────────────────────────────

  useEffect(() => {
    paymentMethodsAPI
      .getSavedCards()
      .then(setMethods)
      .catch(() => showToast.error("Failed to load", "Could not fetch payment methods."))
      .finally(() => setIsLoading(false))
  }, [])

  const defaultMethod = methods.find((m) => m.status === "default") ?? null

  // ── Add card (SetupIntent flow) ────────────────────────────────────────────

  const openAddModal = () => {
    setNickname("")
    setMakeDefault(methods.length === 0)
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
      // 1. Backend creates a SetupIntent — card data never touches our server
      const { clientSecret } = await paymentMethodsAPI.createSetupIntent()

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
      })

      setMethods((current) => {
        const normalised = makeDefault
          ? current.map((m) => (m.status === "default" ? { ...m, status: "active" as const } : m))
          : current
        return [saved, ...normalised]
      })

      showToast.success("Card added", `${saved.brandLabel} •••• ${saved.last4} saved.`)
      setModalMode(null)
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status
      if (status === 409) {
        showToast.error("Card already saved", "This card is already linked to your account.")
      } else {
        showToast.error("Failed to add card", "Please try again.")
      }
    } finally {
      setIsSaving(false)
    }
  }, [stripe, elements, nickname, makeDefault])

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
      setMethods((current) => {
        const remaining = current.filter((m) => m.id !== method.id)
        if (method.status === "default" && remaining.length > 0) {
          return [{ ...remaining[0], status: "default" }, ...remaining.slice(1)]
        }
        return remaining
      })
      showToast.success("Card removed")
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-brand" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header + KPIs */}
      <section className="rounded-[1.25rem] border border-border-soft bg-surface-elevated p-6 shadow-soft">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-text-primary">Payment Methods</h1>
            <p className="mt-2 max-w-3xl text-text-secondary">
              Manage cards used for invoice settlement. Cards are stored securely by Stripe — we only hold the last 4 digits and expiry.
            </p>
          </div>
          <Button type="button" onClick={openAddModal} disabled={!stripePromise}>
            <Plus className="h-4 w-4" />
            Add New Card
          </Button>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
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
        </div>
      </section>

      {/* Card list */}
      <section className="rounded-[1.25rem] border border-border-soft bg-surface p-6 shadow-soft">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-text-primary">Saved Cards</h2>
          <span className="text-sm text-text-muted">{methods.length} cards</span>
        </div>

        {methods.length === 0 ? (
          <p className="py-8 text-center text-sm text-text-muted">
            No saved cards yet. Add a card to get started.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            {[...methods]
              .sort((a, b) => {
                if (a.status === "default") return -1
                if (b.status === "default") return 1
                return a.nickname.localeCompare(b.nickname)
              })
              .map((method) => (
              <article key={method.id} className={cn("rounded-xl border bg-surface-elevated p-5", method.status === "default" ? "border-success" : "border-border-soft")}>
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={cn("rounded-full px-2.5 py-1 text-xs font-semibold", methodToneMap[method.type])}>
                        {method.brandLabel}
                      </span>
                      <StatusTag status={method.status} />
                    </div>
                    <h3 className="mt-2 text-lg font-semibold text-text-primary">{method.nickname}</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <IconButton label="Rename" onClick={() => openRenameModal(method)} icon={<Edit3 className="h-4 w-4" />} />
                    <Popover
                      open={deletePopoverOpenId === method.id}
                      onOpenChange={(open) => setDeletePopoverOpenId(open ? method.id : null)}
                    >
                      <PopoverTrigger asChild>
                        <IconButton label="Remove" onClick={() => {}} icon={<Trash2 className="h-4 w-4" />} />
                      </PopoverTrigger>
                      <PopoverContent side="top" className="w-60 p-4">
                        <p className="text-sm font-semibold text-text-primary">Remove card?</p>
                        <p className="mt-1 text-xs text-text-secondary">
                          {method.brandLabel} •••• {method.last4} will be permanently deleted.
                        </p>
                        <div className="mt-3 flex justify-end gap-2">
                          <Button
                            type="button"
                            variant="quiet"
                            size="sm"
                            disabled={deletingId === method.id}
                            onClick={() => setDeletePopoverOpenId(null)}
                          >
                            Cancel
                          </Button>
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            disabled={deletingId === method.id}
                            onClick={() => { void removeMethod(method) }}
                            className={cn(
                              "relative transition-[padding] duration-200",
                              deletingId === method.id && "pl-7",
                            )}
                          >
                            <div
                              className={cn(
                                "absolute left-2.5 transition-all duration-200 ease-in-out opacity-0 -translate-x-2",
                                deletingId === method.id && "opacity-100 translate-x-0",
                              )}
                            >
                              <LoaderCircle className="animate-spin" size={12} strokeWidth={2} aria-hidden="true" />
                            </div>
                            Remove
                          </Button>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <Meta label="Card" value={`•••• ${method.last4}`} />
                  <Meta label="Expiry" value={`${method.expiryMonth}/${method.expiryYear}`} />
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {method.status !== "default" ? (
                    <Popover
                      open={defaultPopoverOpenId === method.id}
                      onOpenChange={(open) => setDefaultPopoverOpenId(open ? method.id : null)}
                    >
                      <PopoverTrigger asChild>
                        <Button type="button" variant="outline" size="sm">
                          Set as Default
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent side="top" className="w-64 p-4">
                        <p className="text-sm font-semibold text-text-primary">Set as default?</p>
                        <p className="mt-1 text-xs text-text-secondary">
                          {method.brandLabel} •••• {method.last4} will be used for all future invoices.
                        </p>
                        <div className="mt-3 flex justify-end gap-2">
                          <Button
                            type="button"
                            variant="quiet"
                            size="sm"
                            disabled={settingDefaultId === method.id}
                            onClick={() => setDefaultPopoverOpenId(null)}
                          >
                            Cancel
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            disabled={settingDefaultId === method.id}
                            onClick={() => { void setAsDefault(method) }}
                            className={cn(
                              "relative transition-[padding] duration-200",
                              settingDefaultId === method.id && "pl-7",
                            )}
                          >
                            <div
                              className={cn(
                                "absolute left-2.5 transition-all duration-200 ease-in-out opacity-0 -translate-x-2",
                                settingDefaultId === method.id && "opacity-100 translate-x-0",
                              )}
                            >
                              <LoaderCircle className="animate-spin" size={12} strokeWidth={2} aria-hidden="true" />
                            </div>
                            OK
                          </Button>
                        </div>
                      </PopoverContent>
                    </Popover>
                  ) : (
                    <Button type="button" variant="outline" size="sm" disabled>
                      Default Card
                    </Button>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* Add card modal */}
      <Modal
        isOpen={modalMode === "add"}
        onClose={() => setModalMode(null)}
        title="Add Payment Card"
        maxWidthClassName="max-w-xl"
      >
        <div className="p-6">
          <h3 className="text-xl font-semibold text-text-primary">Add new card</h3>
          <p className="mt-1 text-sm text-text-secondary">
            Card details are collected securely by Stripe and never stored on our servers.
          </p>

          <div className="mt-5 space-y-4">
            <FormField label="Card nickname">
              <Input
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="e.g. Main Clinic Card"
                disabled={isSaving}
              />
            </FormField>

            <FormField label="Card number">
              <div className="rounded-md border border-border-soft bg-surface px-3 py-3">
                <CardNumberElement options={cardElementOptions} />
              </div>
            </FormField>

            <div className="grid grid-cols-2 gap-4">
              <FormField label="Expiry date">
                <div className="rounded-md border border-border-soft bg-surface px-3 py-3">
                  <CardExpiryElement options={cardElementOptions} />
                </div>
              </FormField>
              <FormField label="CVC">
                <div className="rounded-md border border-border-soft bg-surface px-3 py-3">
                  <CardCvcElement options={cardElementOptions} />
                </div>
              </FormField>
            </div>
          </div>

          <div className="mt-4 inline-flex items-center gap-2 text-sm text-text-secondary">
            <Checkbox
              checked={makeDefault}
              onChange={(e) => setMakeDefault(e.target.checked)}
              disabled={isSaving}
            />
            Set as my default payment card
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => setModalMode(null)} disabled={isSaving}>
              Cancel
            </Button>
            <Button
              type="button"
              disabled={isSaving}
              onClick={() => { void handleAddCard() }}
              className={cn(
                "relative transition-[padding] duration-200",
                isSaving && "pl-7",
              )}
            >
              <div
                className={cn(
                  "absolute left-2.5 transition-all duration-200 ease-in-out opacity-0 -translate-x-2",
                  isSaving && "opacity-100 translate-x-0",
                )}
              >
                <LoaderCircle className="animate-spin" size={12} strokeWidth={2} aria-hidden="true" />
              </div>
              Save Card
            </Button>
          </div>
        </div>
      </Modal>

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
                onChange={(e) =>
                  setRenameState((s) => (s ? { ...s, newNickname: e.target.value } : s))
                }
                placeholder="e.g. Backup Card"
                disabled={isSaving}
              />
            </FormField>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => setModalMode(null)} disabled={isSaving}>
              Cancel
            </Button>
            <Button type="button" onClick={() => { void handleRename() }} disabled={isSaving}>
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
            </Button>
          </div>
        </div>
      </Modal>

    </div>
  )
}

// ── Outer wrapper — provides Stripe context ───────────────────────────────────

export default function BuyerPaymentMethodsPage() {
  if (!stripePromise) {
    return (
      <div className="rounded-[1.25rem] border border-border-soft bg-surface-elevated p-8 text-center text-sm text-text-secondary shadow-soft">
        Stripe publishable key is missing. Set <code>NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY</code>.
      </div>
    )
  }

  return (
    <Elements stripe={stripePromise}>
      <PaymentMethodsContent />
    </Elements>
  )
}

// ── Small presentational components ─────────────────────────────────────────

function KpiCard({ icon, label, value, hint }: { icon: React.ReactNode; label: string; value: string; hint: string }) {
  return (
    <article className="rounded-xl border border-border-soft bg-surface p-4">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-surface-muted">{icon}</div>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-text-muted">{label}</p>
      <p className="mt-1 text-xl font-semibold text-text-primary">{value}</p>
      <p className="mt-1 text-xs text-text-secondary">{hint}</p>
    </article>
  )
}

function StatusTag({ status }: { status: SavedPaymentMethod["status"] }) {
  const tone =
    status === "default"
      ? "bg-success/15 text-success"
      : status === "backup"
        ? "bg-warning/15 text-warning"
        : "bg-surface-muted text-text-secondary"

  return (
    <span className={cn("rounded-full px-2.5 py-1 text-xs font-semibold capitalize", tone)}>
      {status === "default" ? "Default" : status === "backup" ? "Backup" : "Active"}
    </span>
  )
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-text-muted">{label}</p>
      <p className="mt-1 text-sm text-text-secondary">{value}</p>
    </div>
  )
}

const IconButton = React.forwardRef<
  HTMLButtonElement,
  { icon: React.ReactNode; onClick: () => void; label: string }
>(({ icon, onClick, label }, ref) => (
  <button
    ref={ref}
    type="button"
    onClick={onClick}
    aria-label={label}
    className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border-soft text-text-muted transition-colors hover:text-brand"
  >
    {icon}
  </button>
))

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-text-muted">{label}</p>
      {children}
    </div>
  )
}
