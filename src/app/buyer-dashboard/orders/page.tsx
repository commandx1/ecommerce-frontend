"use client"

import CancelConfirmModal from "./components/cancel-confirm-modal"
import OrdersPagination from "./components/orders-pagination"
import OrdersTable from "./components/orders-table"
import TrackingLinksModal from "./components/tracking-links-modal"
import { useBuyerOrdersPage } from "./hooks/use-buyer-orders-page"

export default function BuyerOrdersPage() {
  const {
    cancelingItemId,
    cancelingSellerKey,
    confirmPendingCancelAction,
    currentPage,
    dateSortDir,
    expandedState,
    filteredOrders,
    handleDateSortToggle,
    handleExpandedChange,
    handlePageChange,
    handleReorder,
    isAuthenticated,
    isConfirmingCancel,
    isLoading,
    pageSize,
    pendingCancelAction,
    reorderingItemId,
    requestCancelAction,
    setPendingCancelAction,
    setTrackingModalLinks,
    summariesByOrderId,
    totalElements,
    totalPages,
    trackingModalLinks,
  } = useBuyerOrdersPage()

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas">
        <p className="text-text-secondary">Please log in to view your orders.</p>
      </div>
    )
  }

  return (
    <>
      <section className="mb-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-text-primary">Your Orders</h1>
            <p className="mt-1 text-text-secondary">Track and review all orders placed from your account</p>
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-border-soft bg-surface-elevated shadow-soft">
        <div className="overflow-x-auto">
          <OrdersTable
            cancelingItemId={cancelingItemId}
            cancelingSellerKey={cancelingSellerKey}
            dateSortDir={dateSortDir}
            expandedState={expandedState}
            isLoading={isLoading}
            onDateSortToggle={handleDateSortToggle}
            onExpandedChange={handleExpandedChange}
            onOpenTrackingLinks={setTrackingModalLinks}
            onReorder={handleReorder}
            onRequestCancel={requestCancelAction}
            orders={filteredOrders}
            reorderingItemId={reorderingItemId}
            summariesByOrderId={summariesByOrderId}
          />
        </div>

        <OrdersPagination
          currentPage={currentPage}
          onPageChange={handlePageChange}
          pageSize={pageSize}
          totalElements={totalElements}
          totalPages={totalPages}
        />
      </section>

      <CancelConfirmModal
        isConfirmingCancel={isConfirmingCancel}
        onClose={() => setPendingCancelAction(null)}
        onConfirm={() => void confirmPendingCancelAction()}
        pendingCancelAction={pendingCancelAction}
      />

      <TrackingLinksModal links={trackingModalLinks} onClose={() => setTrackingModalLinks(null)} />
    </>
  )
}
