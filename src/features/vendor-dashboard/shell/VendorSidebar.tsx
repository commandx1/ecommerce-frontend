"use client"

import {
  Bell,
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
  type DashboardSidebarQuickAction,
} from "@/components/layout/DashboardSidebar"
import { useCompanyRole } from "./CompanyRoleContext"

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
      {
        href: "/vendor-dashboard/notifications",
        label: "Notifications",
        icon: Bell,
        matchMode: "startsWith",
      },
    ],
  },
]

// Appended last in VendorSidebar so the owner-only Team link always sits above it.
const SETTINGS_NAV_ITEM = {
  href: "/vendor-dashboard/settings",
  label: "Settings",
  icon: Settings,
  matchMode: "startsWith" as const,
}

const TEAM_NAV_ITEM = {
  href: "/vendor-dashboard/team",
  label: "Team",
  icon: Users,
  matchMode: "startsWith" as const,
}

const VendorSidebar = () => {
  const { companyRole, companyName } = useCompanyRole()

  const navGroups = useMemo<DashboardSidebarGroup[]>(() => {
    const tail = companyRole === "OWNER" ? [TEAM_NAV_ITEM, SETTINGS_NAV_ITEM] : [SETTINGS_NAV_ITEM]

    return VENDOR_NAV_GROUPS.map((group) => ({ ...group, items: [...group.items, ...tail] }))
  }, [companyRole])

  return (
    <CommonDashboardSidebar
      brand={{ label: companyName ?? "Vendor Panel", icon: Store }}
      quickActions={VENDOR_QUICK_ACTIONS}
      quickActionSize="compact"
      groups={navGroups}
      groupVariant="stacked"
      showGroupTitles={false}
    />
  )
}

export default VendorSidebar
