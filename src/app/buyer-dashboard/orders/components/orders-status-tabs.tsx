"use client"

import { useBuyerOrdersTabsActions, useBuyerOrdersTabsState } from "../context/buyer-orders-context"
import type { BuyerOrderStatusTab } from "../types"

const ORDER_STATUS_TABS: BuyerOrderStatusTab[] = ["All", "Pending", "Shipped", "Delivered", "Cancelled"]

export default function OrdersStatusTabs() {
  const { selectedTab } = useBuyerOrdersTabsState()
  const { handleTabChange } = useBuyerOrdersTabsActions()

  return (
    <div className="mb-4">
      <div className="inline-flex flex-wrap items-center gap-2 rounded-sm border border-border-soft bg-surface p-1.5 shadow-soft">
        {ORDER_STATUS_TABS.map((tab) => {
          const isActive = selectedTab === tab

          return (
            <button
              key={tab}
              type="button"
              onClick={() => handleTabChange(tab)}
              className={`rounded-sm px-4 py-2 text-sm font-medium transition-colors ${
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
