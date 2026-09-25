"use client"

import { Elements } from "@stripe/react-stripe-js"
import SurfaceCard from "@/components/ui/SurfaceCard"
import { useStripePromise } from "@/hooks/useStripePromise"
import AddCardModal from "./components/AddCardModal"
import PaymentMethodsList from "./components/PaymentMethodsList"
import PaymentMethodsOverview from "./components/PaymentMethodsOverview"
import RenameCardModal from "./components/RenameCardModal"
import StopAutoOrdersDialog from "./components/StopAutoOrdersDialog"
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
      <PaymentMethodsOverview
        isLoading={isLoading}
        methodCount={methods.length}
        defaultMethod={defaultMethod}
        autoOrderMethod={autoOrderMethod}
        onAddCard={addCardFlow.open}
      />

      <PaymentMethodsList
        isLoading={isLoading}
        methods={sortedMethods}
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

      <RenameCardModal
        isOpen={Boolean(renameState)}
        newNickname={renameState?.newNickname ?? ""}
        isSaving={isRenaming}
        onNicknameChange={setRenameNickname}
        onClose={closeRenameModal}
        onSubmit={submitRename}
      />

      <StopAutoOrdersDialog
        isOpen={Boolean(stopAutoOrdersFor)}
        isLoading={autoOrderCardActionId === stopAutoOrdersFor?.id}
        onClose={() => requestStopAutoOrders(null)}
        onConfirm={confirmStopAutoOrders}
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
