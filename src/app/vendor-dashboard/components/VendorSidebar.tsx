"use client"

import {
  Box,
  Megaphone,
  MessageSquare,
  Plus,
  Settings,
  ShoppingBag,
  Star,
  Store,
  Tag,
  TrendingUp,
  Users,
} from "lucide-react"
import { useMemo } from "react"
import CommonDashboardSidebar, {
  type DashboardSidebarGroup,
  type DashboardSidebarNavItem,
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
      // "Inventory" pointed at /vendor-dashboard/inventory, which has no page - re-add it with the page.
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
    ],
  },
]

const VENDOR_FOOTER_ITEMS: DashboardSidebarNavItem[] = [
  { href: "/vendor-dashboard/settings", label: "Settings", icon: Settings, matchMode: "startsWith" },
]

const TEAM_NAV_ITEM = {
  href: "/vendor-dashboard/team",
  label: "Team",
  icon: Users,
  matchMode: "startsWith" as const,
}

const VendorSidebar = () => {
  const { companyRole, companyName } = useCompanyRole()

  const navGroups = useMemo<DashboardSidebarGroup[]>(() => {
    if (companyRole !== "OWNER") {
      return VENDOR_NAV_GROUPS
    }

    return VENDOR_NAV_GROUPS.map((group) => ({ ...group, items: [...group.items, TEAM_NAV_ITEM] }))
  }, [companyRole])

  return (
    <CommonDashboardSidebar
      brand={{ label: companyName ?? "Vendor Panel", icon: Store }}
      footerItems={VENDOR_FOOTER_ITEMS}
      quickActions={VENDOR_QUICK_ACTIONS}
      quickActionSize="compact"
      groups={navGroups}
      groupVariant="stacked"
      showGroupTitles={false}
    />
  )
}

export default VendorSidebar
