"use client"

import DashboardPagination from "@/components/dashboard-shared/DashboardPagination"
import SingleOrderNotice from "@/components/dashboard-shared/SingleOrderNotice"
import StatusTabStrip from "@/components/dashboard-shared/StatusTabStrip"
import SurfaceCard from "@/components/ui/SurfaceCard"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { VendorOrder, VendorOrderItem } from "@/lib/api/vendor-orders"
import { VENDOR_ORDER_TABS, type VendorOrderSortField, type VendorOrderStatusTab } from "../hooks/useVendorOrdersQuery"
import type { PendingVendorCancelAction } from "./cancel-confirm-modal"
import type { LabelModalLinks } from "./labels-tracking-modal"
import OrdersMobileList from "./orders-mobile-list"
import OrdersTable from "./orders-table"

interface OrdersTableSectionProps {
  id: string
  selectedTab: VendorOrderStatusTab
  onTabChange: (tab: VendorOrderStatusTab) => void
  singleOrderId: string | null
  onClearSingleOrder: () => void
  orders: VendorOrder[]
  isLoading: boolean
  sortBy: VendorOrderSortField
  sortDir: "asc" | "desc"
  expandedOrderId: string | null
  processingOrderId: string | null
  cancelingItemId: string | null
  cancelingOrderId: string | null
  returnActionItemId: string | null
  returnActionType: "confirm" | "reject" | null
  uberProcessedOrderIds: string[]
  onSortToggle: (field: VendorOrderSortField) => void
  onExpandedOrderChange: (orderId: string | null) => void
  onCallUber: (order: VendorOrder) => void
  onRequestCancel: (action: PendingVendorCancelAction) => void
  onOpenLabelModal: (links: LabelModalLinks) => void
  onConfirmReturn: (item: VendorOrderItem) => void
  onRejectReturn: (item: VendorOrderItem) => void
  pageSize: number
  onPageSizeChange: (size: number) => void
  effectivePage: number
  onPageChange: (page: number) => void
  totalPages: number
  totalElements: number
}

export default function OrdersTableSection({
  id,
  selectedTab,
  onTabChange,
  singleOrderId,
  onClearSingleOrder,
  orders,
  isLoading,
  sortBy,
  sortDir,
  expandedOrderId,
  processingOrderId,
  cancelingItemId,
  cancelingOrderId,
  returnActionItemId,
  returnActionType,
  uberProcessedOrderIds,
  onSortToggle,
  onExpandedOrderChange,
  onCallUber,
  onRequestCancel,
  onOpenLabelModal,
  onConfirmReturn,
  onRejectReturn,
  pageSize,
  onPageSizeChange,
  effectivePage,
  onPageChange,
  totalPages,
  totalElements,
}: OrdersTableSectionProps) {
  const sharedListProps = {
    orders,
    isLoading,
    sortBy,
    sortDir,
    expandedOrderId,
    processingOrderId,
    cancelingItemId,
    cancelingOrderId,
    returnActionItemId,
    returnActionType,
    uberProcessedOrderIds,
    onSortToggle,
    onExpandedOrderChange,
    onCallUber,
    onRequestCancel,
    onOpenLabelModal,
    onConfirmReturn,
    onRejectReturn,
  }

  return (
    <SurfaceCard as="section" id={`${id}-orders-table-section`} variant="glass" className="overflow-hidden">
      <div className="border-b border-border-soft px-4 pt-4 sm:px-6">
        <StatusTabStrip tabs={VENDOR_ORDER_TABS} value={selectedTab} onChange={onTabChange} />
      </div>

      {singleOrderId ? <SingleOrderNotice onClear={onClearSingleOrder} /> : null}

      <div className="hidden lg:block lg:overflow-x-auto">
        <OrdersTable {...sharedListProps} />
      </div>

      <div className="px-4 py-4 lg:hidden">
        <OrdersMobileList {...sharedListProps} />
      </div>

      <div className="flex items-center gap-2 border-t border-border-soft bg-surface-muted px-6 py-3">
        <span className="text-sm text-text-secondary">Show</span>
        <Select value={String(pageSize)} onValueChange={(value) => onPageSizeChange(Number(value))}>
          {/* The visible "Show" / "per page" text sits outside the trigger, so the control
              itself had no accessible name - axe `button-name` (critical). */}
          <SelectTrigger
            aria-label="Orders per page"
            className="h-9 w-20 rounded-lg border-border-strong bg-surface-elevated px-3 py-1 text-sm text-text-secondary shadow-none focus-visible:ring-2 focus-visible:ring-brand/50"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="10">10</SelectItem>
            <SelectItem value="25">25</SelectItem>
            <SelectItem value="50">50</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-sm text-text-secondary">per page</span>
      </div>
      <DashboardPagination
        currentPage={effectivePage}
        totalPages={totalPages}
        totalElements={totalElements}
        pageSize={pageSize}
        onPageChange={onPageChange}
      />
    </SurfaceCard>
  )
}
