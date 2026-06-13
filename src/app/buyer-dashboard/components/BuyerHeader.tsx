"use client"

import DashboardHeader, { type DashboardHeaderNavItem } from "@/components/layout/DashboardHeader"

const BUYER_NAV_ITEMS: DashboardHeaderNavItem[] = [
  { href: "/buyer-dashboard", label: "Dashboard" },
  { href: "/buyer-dashboard/orders", label: "Orders" },
  { href: "/buyer-dashboard/vendors", label: "Vendors" },
  { href: "/buyer-dashboard/invoices", label: "Invoices" },
  { href: "/buyer-dashboard/reports", label: "Reports" },
]

export default function BuyerHeader() {
  return <DashboardHeader navItems={BUYER_NAV_ITEMS} accountFallbackName="Account" showCart />
}
