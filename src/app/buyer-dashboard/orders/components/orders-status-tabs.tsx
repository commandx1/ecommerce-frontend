"use client"

import { useBuyerOrdersTabsActions, useBuyerOrdersTabsState } from "../context/buyer-orders-context"
import type { BuyerOrderStatusTab } from "../types"

const ORDER_STATUS_TABS: BuyerOrderStatusTab[] = ["All", "Pending", "Shipped", "Delivered", "Cancelled", "Returned"]

export default function OrdersStatusTabs() {
  const { selectedTab } = useBuyerOrdersTabsState()
  const { handleTabChange } = useBuyerOrdersTabsActions()

  return (
    <div className="mb-4">
      <div className="no-scrollbar flex w-full items-center gap-1.5 overflow-x-auto rounded-sm border border-border-soft bg-surface p-1.5 shadow-soft sm:gap-2">
        {ORDER_STATUS_TABS.map((tab) => {
          const isActive = selectedTab === tab

          return (
            <button
              key={tab}
              type="button"
              onClick={() => handleTabChange(tab)}
              className={`shrink-0 whitespace-nowrap rounded-sm px-3 py-2 text-xs font-medium transition-colors sm:px-4 sm:text-sm ${
                isActive
                  ? "bg-brand text-muted shadow-soft"
                  : "text-text-secondary hover:bg-surface-muted hover:text-text-primary"
              }`}
              aria-pressed={isActive}
            >
              {tab}
            </button>
          )
        })}
      </div>
    </div>
  )
}
