"use client"

import { Elements } from "@stripe/react-stripe-js"
import { CheckCircle2, CreditCard, Loader2, Plus, Repeat } from "lucide-react"
import Link from "next/link"
import type React from "react"
import ConfirmationModal from "@/components/feedback/ConfirmationModal"
import SectionHeading from "@/components/layout/SectionHeading"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Modal from "@/components/ui/Modal"
import SurfaceCard from "@/components/ui/SurfaceCard"
import { Skeleton } from "@/components/ui/skeleton"
import { useStripePromise } from "@/hooks/useStripePromise"
import { cn } from "@/lib/utils"
import AddCardModal from "./components/AddCardModal"
import FormField from "./components/FormField"
import PaymentMethodCard from "./components/PaymentMethodCard"
import { usePaymentMethodsPage } from "./hooks/usePaymentMethodsPage"

// ── Inner page (must be inside <Elements>) ───────────────────────────────────

function PaymentMethodsContent() {
  const {
    methods,
    sortedMethods,
    isLoading,
    defaultMethod,
    autoOrderMethod,
    cardElementOptions,
    addCardFlow,
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
  } = usePaymentMethodsPage()

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
            <Button type="button" onClick={addCardFlow.open}>
              <Plus className="h-4 w-4" />
              Add New Card
            </Button>
          }
        />

        <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
          {isLoading ? (
            // Mirrors KpiCard's shell and its four rows (icon tile, label, value, hint) rather
            // than standing in as one flat block: the card border and the text baselines are
            // already in place when the numbers land, so nothing jumps.
            [0, 1, 2].map((i) => (
              <article key={i} className="rounded-xl border border-border-soft bg-surface p-4">
                <Skeleton className="mb-3 h-10 w-10 rounded-lg" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="mt-1 h-7 w-32" />
                <Skeleton className="mt-1 h-4 w-28" />
              </article>
            ))
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
                onRemove={removeMethod}
                onSetDefault={setAsDefault}
                onEnableAutoPayments={enableAutomaticPayments}
                onUseForAutoOrders={useForAutoOrders}
                onRequestStopAutoOrders={requestStopAutoOrders}
              />
            ))}
          </div>
        )}
      </section>

      <AddCardModal
        isOpen={addCardFlow.isOpen}
        isSaving={addCardFlow.isSaving}
        nickname={addCardFlow.nickname}
        makeDefault={addCardFlow.makeDefault}
        allowAutoPayments={addCardFlow.allowAutoPayments}
        useForAutoOrders={addCardFlow.useForAutoOrders}
        hasExistingAutoOrderCard={Boolean(autoOrderMethod)}
        cardElementOptions={cardElementOptions}
        onNicknameChange={addCardFlow.setNickname}
        onMakeDefaultChange={addCardFlow.setMakeDefault}
        onAllowAutoPaymentsChange={addCardFlow.setAllowAutoPayments}
        onUseForAutoOrdersChange={addCardFlow.setUseForAutoOrders}
        onClose={addCardFlow.close}
        onSubmit={addCardFlow.submit}
      />

      {/* Rename modal */}
      <Modal isOpen={Boolean(renameState)} onClose={closeRenameModal} title="Rename Card" maxWidthClassName="max-w-sm">
        <div className="p-6">
          <h3 className="text-xl font-semibold text-text-primary">Rename card</h3>
          <p className="mt-1 text-sm text-text-secondary">Update the display name for this card.</p>

          <div className="mt-5">
            <FormField label="New nickname">
              <Input
                value={renameState?.newNickname ?? ""}
                onChange={(e) => setRenameNickname(e.target.value)}
                placeholder="e.g. Backup Card"
                disabled={isRenaming}
              />
            </FormField>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={closeRenameModal} disabled={isRenaming}>
              Cancel
            </Button>
            <Button type="button" onClick={submitRename} disabled={isRenaming}>
              {isRenaming ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmationModal
        isOpen={Boolean(stopAutoOrdersFor)}
        onClose={() => requestStopAutoOrders(null)}
        onConfirm={confirmStopAutoOrders}
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
