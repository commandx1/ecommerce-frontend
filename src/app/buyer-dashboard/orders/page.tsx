"use client"

import CancelConfirmModal from "./components/cancel-confirm-modal"
import OrdersPagination from "./components/orders-pagination"
import OrdersTable from "./components/orders-table"
import TrackingLinksModal from "./components/tracking-links-modal"
import { BuyerOrdersProvider, useBuyerOrdersAuthState } from "./context/buyer-orders-context"

function BuyerOrdersPageContent() {
  const { isAuthenticated } = useBuyerOrdersAuthState()

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
          <OrdersTable />
        </div>

        <OrdersPagination />
      </section>

      <CancelConfirmModal />

      <TrackingLinksModal />
    </>
  )
}

export default function BuyerOrdersPage() {
  return (
    <BuyerOrdersProvider>
      <BuyerOrdersPageContent />
    </BuyerOrdersProvider>
  )
}
