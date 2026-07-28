"use client"

import CancelConfirmModal from "./components/cancel-confirm-modal"
import OrdersMobileList from "./components/orders-mobile-list"
import OrdersPagination from "./components/orders-pagination"
import OrdersStatusTabs from "./components/orders-status-tabs"
import OrdersTable from "./components/orders-table"
import RefundOrderModal from "./components/refund-order-modal"
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
      <section className="mb-6 md:mb-8">
        <div className="mb-4 flex items-center justify-between md:mb-6">
          <div>
            <h1 className="text-2xl font-bold text-text-primary sm:text-3xl">Your Orders</h1>
            <p className="mt-1 text-sm text-text-secondary sm:text-base">
              Track and review all orders placed from your account
            </p>
          </div>
        </div>
      </section>

      <section className="overflow-hidden border-border-soft bg-surface-elevated max-md:border-y max-md:-mx-4 md:rounded-2xl md:border md:shadow-soft">
        <div className="border-b border-border-soft px-4 pt-4 sm:px-6">
          <OrdersStatusTabs />
        </div>

        <div className="hidden md:block md:overflow-x-auto">
          <OrdersTable />
        </div>

        <div className="px-4 py-4 md:hidden">
          <OrdersMobileList />
        </div>

        <div className="px-4 md:px-0">
          <OrdersPagination />
        </div>
      </section>

      <CancelConfirmModal />

      <RefundOrderModal />

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
