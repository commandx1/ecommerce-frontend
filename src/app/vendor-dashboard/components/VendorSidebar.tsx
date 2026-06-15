"use client"

import { Box, MapPin, Megaphone, MessageSquare, Plus, ShoppingBag, Star, Tag, TrendingUp, User, Warehouse } from "lucide-react"
import CommonDashboardSidebar, {
  type DashboardSidebarGroup,
  type DashboardSidebarQuickAction,
} from "@/components/layout/DashboardSidebar"

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
      {
        href: "/vendor-dashboard/settings/addresses",
        label: "Addresses",
        icon: MapPin,
        size: "compact",
        matchMode: "startsWith",
      },
    ],
  },
]

const VendorSidebar = () => {
  return (
    <CommonDashboardSidebar
      collapseStorageKey="vendor-dashboard-sidebar-collapsed"
      quickActions={VENDOR_QUICK_ACTIONS}
      quickActionSize="compact"
      groups={VENDOR_NAV_GROUPS}
      groupVariant="stacked"
      showGroupTitles={false}
    />
  )
}

export default VendorSidebar
