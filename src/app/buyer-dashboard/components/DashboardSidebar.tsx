"use client"

import {
  Bell,
  CreditCard,
  FileText,
  Heart,
  HelpCircle,
  LayoutDashboard,
  Plus,
  Repeat,
  RotateCcw,
  Search,
  Settings,
  ShoppingBag,
} from "lucide-react"
import CommonDashboardSidebar, {
  type DashboardSidebarGroup,
  type DashboardSidebarNavItem,
  type DashboardSidebarQuickAction,
} from "@/components/layout/DashboardSidebar"

const NAV_GROUPS: DashboardSidebarGroup[] = [
  {
    title: "Buyer Navigation",
    items: [
      // Overview dummy veriyle çalıştığı için gizlendi - backend'e bağlanınca Home ikonuyla birlikte geri aç.
      // { href: "/buyer-dashboard", label: "Overview", icon: Home },
      { href: "/buyer-dashboard/orders", label: "All Orders", icon: ShoppingBag },
      { href: "/buyer-dashboard/auto-orders", label: "Auto Orders", icon: Repeat },
      { href: "/buyer-dashboard/favorites", label: "Favorites", icon: Heart },
      { href: "/buyer-dashboard/notifications", label: "Notifications", icon: Bell },
      { href: "/buyer-dashboard/invoices", label: "Invoices", icon: FileText },
      { href: "/buyer-dashboard/payment-methods", label: "Payment Methods", icon: CreditCard },
      { href: "/help-center", label: "Help Center", icon: HelpCircle },
    ],
  },
]

const BUYER_FOOTER_ITEMS: DashboardSidebarNavItem[] = [
  { href: "/buyer-dashboard/settings", label: "Settings", icon: Settings, matchMode: "startsWith" },
]

const BUYER_QUICK_ACTIONS: DashboardSidebarQuickAction[] = [
  { label: "New Order", icon: Plus, tone: "brand", href: "/products" },
  { label: "Reorder Items", icon: RotateCcw, tone: "accent", href: "/buyer-dashboard/orders" },
  { label: "Find Vendors", icon: Search, tone: "surface", href: "/vendors" },
]

const DashboardSidebar = () => {
  return (
    <CommonDashboardSidebar
      brand={{ label: "Buyer Panel", icon: LayoutDashboard }}
      footerItems={BUYER_FOOTER_ITEMS}
      quickActions={BUYER_QUICK_ACTIONS}
      groups={NAV_GROUPS}
      groupVariant="stacked"
      showGroupTitles={false}
      defaultItemSize="compact"
    />
  )
}

export default DashboardSidebar
