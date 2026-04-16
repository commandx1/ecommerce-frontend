"use client"

import {
  BarChart3,
  Box,
  CreditCard,
  DollarSign,
  HeadphonesIcon,
  MapPin,
  Megaphone,
  PieChart,
  Plus,
  ShoppingBag,
  Star,
  Tag,
  Tags,
  TrendingUp,
  User,
  Users,
  Warehouse,
} from "lucide-react"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useId } from "react"
import { cn } from "@/lib/utils"

type SidebarLinkProps = {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  isActive: boolean
  badge?: string
  trailingText?: string
  disabled?: boolean
  size?: "default" | "compact"
}

const SidebarLink = ({
  href,
  label,
  icon: Icon,
  isActive,
  badge,
  trailingText,
  disabled,
  size = "default",
}: SidebarLinkProps) => {
  const baseClasses = "flex items-center rounded-lg px-3 py-2 transition-colors"
  const activeClasses = isActive
    ? "bg-brand/10 font-medium text-brand"
    : "text-text-secondary hover:bg-surface-muted hover:text-text-primary"
  const disabledClasses = disabled ? "opacity-50 pointer-events-none" : ""
  const iconClasses = `mr-3 w-5 ${isActive ? "text-brand" : "text-text-muted"}`
  const labelClasses = size === "compact" ? "text-sm" : "text-base"

  return (
    <Link href={href} className={cn(baseClasses, activeClasses, disabledClasses)}>
      <Icon className={iconClasses} />
      <span className={labelClasses}>{label}</span>
      {trailingText && <span className="ml-auto text-sm text-text-muted">{trailingText}</span>}
      {badge && <span className="ml-auto rounded-full bg-brand/15 px-2 py-1 text-xs text-brand">{badge}</span>}
    </Link>
  )
}

const VendorSidebar = () => {
  const sidebarId = useId()
  const pathname = usePathname()

  const isActive = (path: string) => pathname === path

  return (
    <aside
      id={sidebarId}
      className="sticky top-16 z-40 h-[calc(100vh-4rem)] w-64 overflow-y-auto border-r border-border-soft bg-surface-elevated shadow-soft"
    >
      <div className="p-6">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-text-primary">Quick Actions</h3>
          </div>
          <div className="space-y-2">
            <Link
              href="/vendor-dashboard/products/create"
              className="flex w-full items-center rounded-lg bg-brand px-4 py-2 font-medium text-primary-foreground transition-colors hover:bg-brand-strong"
            >
              <Plus className="mr-2 w-4 h-4" />
              Add Product
            </Link>
            <button
              type="button"
              className="flex w-full items-center rounded-lg bg-accent-strong px-4 py-2 font-medium text-accent-foreground transition-colors hover:brightness-95"
            >
              <Tag className="mr-2 w-4 h-4" />
              Create Promotion
            </button>
          </div>
        </div>

        <nav className="space-y-2">
          <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-text-muted">Overview</div>
          <SidebarLink
            href="/vendor-dashboard"
            label="Dashboard"
            icon={TrendingUp}
            isActive={isActive("/vendor-dashboard")}
          />
          <SidebarLink
            href="/vendor-dashboard/analytics"
            label="Analytics"
            icon={BarChart3}
            isActive={isActive("/vendor-dashboard/analytics")}
          />
          <SidebarLink
            href="/vendor-dashboard/performance"
            label="Performance"
            icon={PieChart}
            isActive={isActive("/vendor-dashboard/performance")}
          />

          <div className="mb-3 mt-6 text-xs font-semibold uppercase tracking-wider text-text-muted">Sales</div>
          <SidebarLink
            href="/vendor-dashboard/orders"
            label="Orders"
            icon={ShoppingBag}
            isActive={isActive("/vendor-dashboard/orders")}
          />
          <SidebarLink
            href="/vendor-dashboard/revenue"
            label="Revenue"
            icon={DollarSign}
            isActive={isActive("/vendor-dashboard/revenue")}
          />
          <SidebarLink
            href="/vendor-dashboard/customers"
            label="Customers"
            icon={Users}
            isActive={isActive("/vendor-dashboard/customers")}
          />

          <div className="mb-3 mt-6 text-xs font-semibold uppercase tracking-wider text-text-muted">Catalog</div>
          <SidebarLink
            href="/vendor-dashboard/products"
            label="Products"
            icon={Box}
            isActive={isActive("/vendor-dashboard/products")}
            trailingText="1,247"
          />
          <SidebarLink
            href="/vendor-dashboard/inventory"
            label="Inventory"
            icon={Warehouse}
            isActive={isActive("/vendor-dashboard/inventory")}
          />
          <SidebarLink
            href="/vendor-dashboard/categories"
            label="Categories"
            icon={Tags}
            isActive={isActive("/vendor-dashboard/categories")}
          />

          <div className="mb-3 mt-6 text-xs font-semibold uppercase tracking-wider text-text-muted">Marketing</div>
          <SidebarLink
            href="/vendor-dashboard/promotions"
            label="Promotions"
            icon={Megaphone}
            isActive={isActive("/vendor-dashboard/promotions")}
          />
          <SidebarLink
            href="/vendor-dashboard/reviews"
            label="Reviews"
            icon={Star}
            isActive={isActive("/vendor-dashboard/reviews")}
            badge="4.8"
          />

          <div className="mb-3 mt-6 text-xs font-semibold uppercase tracking-wider text-text-muted">Account</div>

          <div className="mt-4">
            <h5 className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-wider text-text-muted">Settings</h5>
            <SidebarLink
              href="/vendor-dashboard/settings"
              label="Account"
              icon={User}
              isActive={isActive("/vendor-dashboard/settings")}
              size="compact"
            />
            <SidebarLink
              href="/vendor-dashboard/settings/addresses"
              label="Addresses"
              icon={MapPin}
              isActive={isActive("/vendor-dashboard/settings/addresses")}
              size="compact"
            />
          </div>

          <SidebarLink
            href="/vendor-dashboard/billing"
            label="Billing"
            icon={CreditCard}
            isActive={isActive("/vendor-dashboard/billing")}
            size="compact"
          />
          <SidebarLink
            href="/vendor-dashboard/support"
            label="Support"
            icon={HeadphonesIcon}
            isActive={isActive("/vendor-dashboard/support")}
            size="compact"
          />
        </nav>
      </div>
    </aside>
  )
}

export default VendorSidebar
