"use client"

import SingleOrderNotice from "@/components/dashboard-shared/SingleOrderNotice"
import SectionHeading from "@/components/layout/SectionHeading"
import SurfaceCard from "@/components/ui/SurfaceCard"
import CancelConfirmModal from "./components/cancel-confirm-modal"
import OrdersMobileList from "./components/orders-mobile-list"
import OrdersPagination from "./components/orders-pagination"
import OrdersStatusTabs from "./components/orders-status-tabs"
import OrdersTable from "./components/orders-table"
import RefundOrderModal from "./components/refund-order-modal"
import TrackingLinksModal from "./components/tracking-links-modal"
import {
  BuyerOrdersProvider,
  useBuyerOrdersAuthState,
  useBuyerOrdersTabsActions,
  useBuyerOrdersTabsState,
} from "./context/buyer-orders-context"

function BuyerOrdersPageContent() {
  const { isAuthenticated } = useBuyerOrdersAuthState()
  const { singleOrderId } = useBuyerOrdersTabsState()
  const { clearSingleOrder } = useBuyerOrdersTabsActions()

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas">
        <p className="text-text-secondary">Please log in to view your orders.</p>
      </div>
    )
  }

  return (
    <>
      <SectionHeading
        titleAs="h1"
        variant="technical"
        title="Your Orders"
        description="Track and review all orders placed from your account"
        className="mb-6 md:mb-8"
      />

      <SurfaceCard
        as="section"
        variant="glass"
        className="overflow-hidden max-md:-mx-4 max-md:rounded-none max-md:border-x-0"
      >
        <div className="border-b border-border-soft px-4 pt-4 sm:px-6">
          <OrdersStatusTabs />
        </div>

        {singleOrderId ? <SingleOrderNotice onClear={clearSingleOrder} /> : null}

        <div className="hidden lg:block lg:overflow-x-auto">
          <OrdersTable />
        </div>

        <div className="px-4 py-4 lg:hidden">
          <OrdersMobileList />
        </div>

        <div className="px-4 md:px-0">
          <OrdersPagination />
        </div>
      </SurfaceCard>

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
