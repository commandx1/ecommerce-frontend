"use client"

import { useEffect, useState } from "react"
import {
  CreditCard,
  FileText,
  Heart,
  HelpCircle,
  Home,
  MapPin,
  Plus,
  RotateCcw,
  Search,
  ShoppingBag,
  User,
} from "lucide-react"
import CommonDashboardSidebar, {
  type DashboardSidebarGroup,
  type DashboardSidebarNavItem,
  type DashboardSidebarQuickAction,
} from "@/components/layout/DashboardSidebar"
import { Button } from "@/components/ui/button"

const NAV_GROUPS: DashboardSidebarGroup[] = [
  {
    title: "Dashboard",
    items: [{ href: "/buyer-dashboard", label: "Overview", icon: Home }],
  },
  {
    title: "Orders",
    items: [{ href: "/buyer-dashboard/orders", label: "All Orders", icon: ShoppingBag }],
  },
  {
    title: "Suppliers",
    items: [{ href: "/buyer-dashboard/suppliers/favorites", label: "Favorites", icon: Heart }],
  },
  {
    title: "Account",
    items: [
      { href: "/buyer-dashboard/invoices", label: "Invoices", icon: FileText },
      { href: "/buyer-dashboard/payment-methods", label: "Payment Methods", icon: CreditCard },
    ],
  },
  {
    title: "Support",
    items: [{ href: "/help-center", label: "Help Center", icon: HelpCircle }],
  },
]

const SETTINGS_ITEMS: DashboardSidebarNavItem[] = [
  { href: "/buyer-dashboard/settings", label: "Account", icon: User },
  { href: "/buyer-dashboard/settings/addresses", label: "Addresses", icon: MapPin },
]

const BUYER_QUICK_ACTIONS: DashboardSidebarQuickAction[] = [
  { label: "New Order", icon: Plus, tone: "brand", href: "/products" },
  { label: "Reorder Items", icon: RotateCcw, tone: "accent", href: "/buyer-dashboard/orders" },
  { label: "Find Suppliers", icon: Search, tone: "surface", href: "/suppliers" },
]

const DashboardSidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false)

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem("buyer-dashboard-sidebar-collapsed")
      if (stored === "true") {
        setIsCollapsed(true)
      }
    } catch {
      // Ignore localStorage access errors
    }
  }, [])

  const toggleCollapse = () => {
    setIsCollapsed((previous) => {
      const next = !previous
      try {
        window.localStorage.setItem("buyer-dashboard-sidebar-collapsed", String(next))
      } catch {
        // Ignore localStorage access errors
      }
      return next
    })
  }

  const navGroups: DashboardSidebarGroup[] = NAV_GROUPS.map((group) =>
    group.title === "Account" ? { ...group, subgroups: [{ title: "Settings", items: SETTINGS_ITEMS }] } : group,
  )

  return (
    <CommonDashboardSidebar
      isCollapsed={isCollapsed}
      onToggleCollapse={toggleCollapse}
      collapseButtonLabel={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
      quickActions={BUYER_QUICK_ACTIONS}
      quickActionsTrailing={
        <Button type="button" variant="quiet" size="icon-sm" className="text-text-muted hover:text-brand">
          <Plus className="h-4 w-4" />
        </Button>
      }
      groups={navGroups}
      groupVariant="divided"
      defaultItemSize="compact"
    />
  )
}

export default DashboardSidebar
