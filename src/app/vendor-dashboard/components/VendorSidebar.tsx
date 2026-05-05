"use client"

import { Box, MapPin, Megaphone, Plus, ShoppingBag, Star, Tag, Tags, TrendingUp, User, Warehouse } from "lucide-react"
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
    title: "Overview",
    items: [
      { href: "/vendor-dashboard", label: "Dashboard", icon: TrendingUp, matchMode: "exact" },
      //{ href: "/vendor-dashboard/analytics", label: "Analytics", icon: BarChart3, matchMode: "startsWith" },
      //{ href: "/vendor-dashboard/performance", label: "Performance", icon: PieChart, matchMode: "startsWith" },
    ],
  },
  {
    title: "Sales",
    items: [
      { href: "/vendor-dashboard/orders", label: "Orders", icon: ShoppingBag, matchMode: "startsWith" },
      //{ href: "/vendor-dashboard/revenue", label: "Revenue", icon: DollarSign, matchMode: "startsWith" },
      //{ href: "/vendor-dashboard/customers", label: "Customers", icon: Users, matchMode: "startsWith" },
    ],
  },
  {
    title: "Catalog",
    items: [
      {
        href: "/vendor-dashboard/products",
        label: "Products",
        icon: Box,
        trailingText: "1,247",
        matchMode: "startsWith",
      },
      { href: "/vendor-dashboard/inventory", label: "Inventory", icon: Warehouse, matchMode: "startsWith" },
      { href: "/vendor-dashboard/categories", label: "Categories", icon: Tags, matchMode: "startsWith" },
    ],
  },
  {
    title: "Marketing",
    items: [
      { href: "/vendor-dashboard/promotions", label: "Promotions", icon: Megaphone, matchMode: "startsWith" },
      {
        href: "/vendor-dashboard/reviews",
        label: "Reviews",
        icon: Star,
        badge: { label: "4.8", tone: "info" },
        matchMode: "startsWith",
      },
    ],
  },
  {
    title: "Account",
    items: [],
    subgroupsFirst: true,
    subgroups: [
      {
        title: "Settings",
        items: [
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
    ],
  },
]

const VendorSidebar = () => {
  return (
    <CommonDashboardSidebar
      quickActions={VENDOR_QUICK_ACTIONS}
      quickActionSize="compact"
      groups={VENDOR_NAV_GROUPS}
      groupVariant="stacked"
    />
  )
}

export default VendorSidebar
