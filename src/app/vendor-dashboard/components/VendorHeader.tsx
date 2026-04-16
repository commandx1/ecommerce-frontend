"use client"

import DashboardHeader, { type DashboardHeaderNavItem } from "@/components/layout/DashboardHeader"

const VENDOR_NAV_ITEMS: DashboardHeaderNavItem[] = [
  { href: "/vendor-dashboard", label: "Dashboard", matchMode: "exact" },
  { href: "/vendor-dashboard/products", label: "Products", matchMode: "startsWith" },
  { href: "/vendor-dashboard/orders", label: "Orders", matchMode: "startsWith" },
  { href: "/vendor-dashboard/analytics", label: "Analytics", matchMode: "startsWith" },
  { href: "/vendor-dashboard/marketing", label: "Marketing", matchMode: "startsWith" },
]

export default function VendorHeader() {
  return (
    <DashboardHeader navItems={VENDOR_NAV_ITEMS} accountFallbackName="Vendor" accountMenuClassName="hidden sm:flex" />
  )
}
