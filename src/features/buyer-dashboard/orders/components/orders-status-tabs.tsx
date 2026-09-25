"use client"

import StatusTabStrip from "@/components/dashboard-shared/StatusTabStrip"
import { useBuyerOrdersTabsActions, useBuyerOrdersTabsState } from "../context/buyer-orders-context"
import type { BuyerOrderStatusTab } from "../types"

const ORDER_STATUS_TABS: BuyerOrderStatusTab[] = ["All", "Pending", "Shipped", "Delivered", "Cancelled", "Returned"]

export default function OrdersStatusTabs() {
  const { selectedTab } = useBuyerOrdersTabsState()
  const { handleTabChange } = useBuyerOrdersTabsActions()

  return <StatusTabStrip tabs={ORDER_STATUS_TABS} value={selectedTab} onChange={handleTabChange} />
}
