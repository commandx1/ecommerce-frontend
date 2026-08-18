"use client"

import {
  CreditCard,
  FileText,
  Heart,
  HelpCircle,
  Home,
  MapPin,
  Plus,
  Repeat,
  RotateCcw,
  Search,
  ShoppingBag,
  User,
} from "lucide-react"
import CommonDashboardSidebar, {
  type DashboardSidebarGroup,
  type DashboardSidebarQuickAction,
} from "@/components/layout/DashboardSidebar"

const NAV_GROUPS: DashboardSidebarGroup[] = [
  {
    title: "Buyer Navigation",
    items: [
      { href: "/buyer-dashboard", label: "Overview", icon: Home },
      { href: "/buyer-dashboard/orders", label: "All Orders", icon: ShoppingBag },
      { href: "/buyer-dashboard/auto-orders", label: "Auto Orders", icon: Repeat },
      { href: "/buyer-dashboard/vendors/favorites", label: "Favorites", icon: Heart },
      { href: "/buyer-dashboard/invoices", label: "Invoices", icon: FileText },
      { href: "/buyer-dashboard/payment-methods", label: "Payment Methods", icon: CreditCard },
      { href: "/buyer-dashboard/settings", label: "Account", icon: User },
      { href: "/buyer-dashboard/settings/addresses", label: "Addresses", icon: MapPin },
      { href: "/help-center", label: "Help Center", icon: HelpCircle },
    ],
  },
]

const BUYER_QUICK_ACTIONS: DashboardSidebarQuickAction[] = [
  { label: "New Order", icon: Plus, tone: "brand", href: "/products" },
  { label: "Reorder Items", icon: RotateCcw, tone: "accent", href: "/buyer-dashboard/orders" },
  { label: "Find Vendors", icon: Search, tone: "surface", href: "/vendors" },
]

const DashboardSidebar = () => {
  return (
    <CommonDashboardSidebar
      collapseStorageKey="buyer-dashboard-sidebar-collapsed"
      quickActions={BUYER_QUICK_ACTIONS}
      groups={NAV_GROUPS}
      groupVariant="stacked"
      showGroupTitles={false}
      defaultItemSize="compact"
    />
  )
}

export default DashboardSidebar
