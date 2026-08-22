"use client"

import {
  Box,
  Megaphone,
  MessageSquare,
  Plus,
  ShoppingBag,
  Star,
  Tag,
  TrendingUp,
  User,
  Users,
  Warehouse,
} from "lucide-react"
import { useMemo } from "react"
import CommonDashboardSidebar, {
  type DashboardSidebarGroup,
  type DashboardSidebarQuickAction,
} from "@/components/layout/DashboardSidebar"
import { useCompanyRole } from "../CompanyRoleContext"

const VENDOR_QUICK_ACTIONS: DashboardSidebarQuickAction[] = [
  { href: "/vendor-dashboard/products/create", label: "Add Product", icon: Plus, tone: "brand" },
  { label: "Create Promotion", icon: Tag, tone: "accent" },
]

const VENDOR_NAV_GROUPS: DashboardSidebarGroup[] = [
  {
    title: "Vendor Navigation",
    items: [
      { href: "/vendor-dashboard", label: "Dashboard", icon: TrendingUp, matchMode: "exact" },
      { href: "/vendor-dashboard/orders", label: "Orders", icon: ShoppingBag, matchMode: "startsWith" },
      {
        href: "/vendor-dashboard/products",
        label: "Products",
        icon: Box,
        matchMode: "startsWith",
      },
      { href: "/vendor-dashboard/inventory", label: "Inventory", icon: Warehouse, matchMode: "startsWith" },
      { href: "/vendor-dashboard/promotions", label: "Promotions", icon: Megaphone, matchMode: "startsWith" },
      {
        href: "/vendor-dashboard/reviews",
        label: "Reviews",
        icon: Star,
        matchMode: "startsWith",
      },
      {
        href: "/vendor-dashboard/questions",
        label: "Questions",
        icon: MessageSquare,
        matchMode: "startsWith",
      },
      {
        href: "/vendor-dashboard/settings",
        label: "Account",
        icon: User,
        size: "compact",
        matchMode: "exact",
      },
    ],
  },
]

const TEAM_NAV_ITEM = {
  href: "/vendor-dashboard/team",
  label: "Team",
  icon: Users,
  matchMode: "startsWith" as const,
}

const VendorSidebar = () => {
  const { companyRole } = useCompanyRole()

  const navGroups = useMemo<DashboardSidebarGroup[]>(() => {
    if (companyRole !== "OWNER") {
      return VENDOR_NAV_GROUPS
    }

    return VENDOR_NAV_GROUPS.map((group) => {
      const accountIndex = group.items.findIndex((item) => item.href === "/vendor-dashboard/settings")
      if (accountIndex === -1) {
        return group
      }

      const items = [...group.items]
      items.splice(accountIndex, 0, TEAM_NAV_ITEM)
      return { ...group, items }
    })
  }, [companyRole])

  return (
    <CommonDashboardSidebar
      collapseStorageKey="vendor-dashboard-sidebar-collapsed"
      quickActions={VENDOR_QUICK_ACTIONS}
      quickActionSize="compact"
      groups={navGroups}
      groupVariant="stacked"
      showGroupTitles={false}
    />
  )
}

export default VendorSidebar
