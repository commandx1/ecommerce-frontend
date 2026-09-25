"use client"

import { useEffect, useId, useState } from "react"
import SectionHeading from "@/components/layout/SectionHeading"
import type { VendorOrderItem } from "@/lib/api/vendor-orders"
import { useAuthStore } from "@/stores/authStore"
import CancelConfirmModal, { type PendingVendorCancelAction } from "./components/cancel-confirm-modal"
import LabelsTrackingModal, { type LabelModalLinks } from "./components/labels-tracking-modal"
import OrdersTableSection from "./components/orders-table-section"
import RejectReturnModal, { type PendingVendorReturnRejectAction } from "./components/reject-return-modal"
import UberResultModal from "./components/uber-result-modal"
import { useOrderActions } from "./hooks/useOrderActions"
import { useQzPrinting } from "./hooks/useQzPrinting"
import { useVendorOrdersQuery, type VENDOR_ORDER_TABS } from "./hooks/useVendorOrdersQuery"

export default function VendorOrdersPage() {
  const id = useId()
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)

  const ordersQuery = useVendorOrdersQuery()
  const {
    selectedTab,
    singleOrderId,
    clearSingleOrder,
    orders,
    isLoading,
    pageSize,
    handlePageSizeChange,
    effectivePage,
    handlePageChange,
    totalPages,
    totalElements,
    sortBy,
    sortDir,
    handleSortToggle,
    listParams,
  } = ordersQuery

  const orderActions = useOrderActions(listParams)
  const {
    processingOrderId,
    cancelingItemId,
    cancelingOrderId,
    returnActionItemId,
    returnActionType,
    uberResult,
    setUberResult,
    uberProcessedOrderIds,
    handleCallUber,
    handleCancelDuringDelivery,
    handleConfirmReturn,
    handleRejectReturn,
  } = orderActions

  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null)
  const [labelModalLinks, setLabelModalLinks] = useState<LabelModalLinks | null>(null)
  const [pendingCancelAction, setPendingCancelAction] = useState<PendingVendorCancelAction | null>(null)
  const [isConfirmingCancel, setIsConfirmingCancel] = useState(false)
  const [pendingRejectReturnAction, setPendingRejectReturnAction] = useState<PendingVendorReturnRejectAction | null>(
    null,
  )
  const [rejectReturnReason, setRejectReturnReason] = useState("")
  const [rejectReturnError, setRejectReturnError] = useState<string | null>(null)

  const qzPrinting = useQzPrinting(labelModalLinks)

  useEffect(() => {
    if (singleOrderId) {
      setExpandedOrderId(singleOrderId)
    }
  }, [singleOrderId])

  const handleTabChange = (tab: (typeof VENDOR_ORDER_TABS)[number]) => {
    ordersQuery.handleTabChange(tab)
    setExpandedOrderId(null)
  }

  const confirmPendingCancelAction = async () => {
    if (!pendingCancelAction) return

    setIsConfirmingCancel(true)
    try {
      await handleCancelDuringDelivery(
        pendingCancelAction.orderItemIds,
        pendingCancelAction.description,
        pendingCancelAction.options,
      )
    } finally {
      setIsConfirmingCancel(false)
      setPendingCancelAction(null)
    }
  }

  const openRejectReturnModal = (item: VendorOrderItem) => {
    setPendingRejectReturnAction({ orderItemId: item.id, productName: item.productName })
    setRejectReturnReason("")
    setRejectReturnError(null)
  }

  const closeRejectReturnModal = () => {
    setPendingRejectReturnAction(null)
    setRejectReturnReason("")
    setRejectReturnError(null)
  }

  const handleRejectReturnReasonChange = (reason: string) => {
    setRejectReturnReason(reason)
    if (rejectReturnError) {
      setRejectReturnError(null)
    }
  }

  const submitRejectReturn = async () => {
    if (!pendingRejectReturnAction) return

    const reason = rejectReturnReason.trim()
    if (!reason) {
      setRejectReturnError("Please enter a rejection reason.")
      return
    }

    const succeeded = await handleRejectReturn(pendingRejectReturnAction.orderItemId, reason)
    if (succeeded) {
      setPendingRejectReturnAction(null)
      setRejectReturnReason("")
      setRejectReturnError(null)
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-text-secondary">Please log in to view your orders.</p>
      </div>
    )
  }

  return (
    <>
      {/* Page Header */}
      <section id={`${id}-page-header`} className="mb-8">
        <SectionHeading
          titleAs="h1"
          variant="technical"
          title="Orders"
          description="View and manage orders placed for your products"
        />
      </section>

      {/* Orders Table */}
      <OrdersTableSection
        id={id}
        selectedTab={selectedTab}
        onTabChange={handleTabChange}
        singleOrderId={singleOrderId}
        onClearSingleOrder={clearSingleOrder}
        orders={orders}
        isLoading={isLoading}
        sortBy={sortBy}
        sortDir={sortDir}
        expandedOrderId={expandedOrderId}
        processingOrderId={processingOrderId}
        cancelingItemId={cancelingItemId}
        cancelingOrderId={cancelingOrderId}
        returnActionItemId={returnActionItemId}
        returnActionType={returnActionType}
        uberProcessedOrderIds={uberProcessedOrderIds}
        onSortToggle={handleSortToggle}
        onExpandedOrderChange={setExpandedOrderId}
        onCallUber={(order) => void handleCallUber(order)}
        onRequestCancel={(action) => setPendingCancelAction(action)}
        onOpenLabelModal={setLabelModalLinks}
        onConfirmReturn={(item) => void handleConfirmReturn(item)}
        onRejectReturn={openRejectReturnModal}
        pageSize={pageSize}
        onPageSizeChange={handlePageSizeChange}
        effectivePage={effectivePage}
        onPageChange={handlePageChange}
        totalPages={totalPages}
        totalElements={totalElements}
      />
      <CancelConfirmModal
        pendingCancelAction={pendingCancelAction}
        isConfirmingCancel={isConfirmingCancel}
        onKeepOrder={() => setPendingCancelAction(null)}
        onConfirm={() => void confirmPendingCancelAction()}
      />
      <RejectReturnModal
        id={id}
        pendingRejectReturnAction={pendingRejectReturnAction}
        rejectReturnReason={rejectReturnReason}
        rejectReturnError={rejectReturnError}
        isSubmitting={returnActionType === "reject"}
        onReasonChange={handleRejectReturnReasonChange}
        onClose={closeRejectReturnModal}
        onSubmit={() => void submitRejectReturn()}
      />
      <LabelsTrackingModal
        id={id}
        labelModalLinks={labelModalLinks}
        onClose={() => setLabelModalLinks(null)}
        qzPrinting={qzPrinting}
      />
      <UberResultModal uberResult={uberResult} onClose={() => setUberResult(null)} />
    </>
  )
}
