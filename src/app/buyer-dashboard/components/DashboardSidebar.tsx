"use client"

import {
  CreditCard,
  FileText,
  HeadphonesIcon,
  Heart,
  HelpCircle,
  Home,
  MapPin,
  Plus,
  RotateCcw,
  Search,
  ShoppingBag,
  Star,
  Store,
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
    items: [
      {
        href: "/buyer-dashboard/suppliers/favorites",
        label: "Favorites",
        icon: Heart,
        badge: { label: "12", tone: "neutral" },
      },
      { href: "/buyer-dashboard/suppliers", label: "All Suppliers", icon: Store },
      { href: "/buyer-dashboard/suppliers/top-rated", label: "Top Rated", icon: Star },
    ],
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
    items: [
      { href: "/buyer-dashboard/help", label: "Help Center", icon: HelpCircle },
      { href: "/buyer-dashboard/support", label: "Contact Support", icon: HeadphonesIcon },
    ],
  },
]

const SETTINGS_ITEMS: DashboardSidebarNavItem[] = [
  { href: "/buyer-dashboard/settings", label: "Account", icon: User },
  { href: "/buyer-dashboard/settings/addresses", label: "Addresses", icon: MapPin },
]

const BUYER_QUICK_ACTIONS: DashboardSidebarQuickAction[] = [
  { label: "New Order", icon: Plus, tone: "brand" },
  { label: "Reorder Items", icon: RotateCcw, tone: "accent" },
  { label: "Find Suppliers", icon: Search, tone: "surface" },
]

const DashboardSidebar = () => {
  const navGroups: DashboardSidebarGroup[] = NAV_GROUPS.map((group) =>
    group.title === "Account" ? { ...group, subgroups: [{ title: "Settings", items: SETTINGS_ITEMS }] } : group,
  )

  return (
    <CommonDashboardSidebar
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
