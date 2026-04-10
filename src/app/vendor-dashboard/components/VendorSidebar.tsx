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
  Settings,
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
  const baseClasses = "flex items-center rounded-lg transition-colors px-3 py-2"
  const activeClasses = isActive ? "text-steel-blue bg-gray-50 font-medium" : "text-gray-700 hover:bg-gray-50"
  const disabledClasses = disabled ? "opacity-50 pointer-events-none" : ""
  const iconClasses = `w-5 mr-3 ${isActive ? "text-steel-blue" : "text-gray-500"}`
  const labelClasses = size === "compact" ? "text-sm" : "text-base"

  return (
    <Link href={href} className={`${baseClasses} ${activeClasses} ${disabledClasses}`}>
      <Icon className={iconClasses} />
      <span className={labelClasses}>{label}</span>
      {trailingText && <span className="ml-auto text-gray-500 text-sm">{trailingText}</span>}
      {badge && <span className="ml-auto bg-pale-lime text-steel-blue text-xs px-2 py-1 rounded-full">{badge}</span>}
    </Link>
  )
}

const VendorSidebar = () => {
  const pathname = usePathname()

  const isActive = (path: string) => pathname === path

  return (
    <aside
      id="sidebar"
      className="w-64 bg-white shadow-sm border-r border-gray-200 h-[calc(100vh-4rem)] sticky top-16 overflow-y-auto z-40"
    >
      <div className="p-6">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-steel-blue">Quick Actions</h3>
          </div>
          <div className="space-y-2">
            <Link
              href="/vendor-dashboard/products/create"
              className="w-full bg-steel-blue text-white px-4 py-2 rounded-lg hover:bg-opacity-90 font-medium flex items-center"
            >
              <Plus className="mr-2 w-4 h-4" />
              Add Product
            </Link>
            <button
              type="button"
              className="w-full bg-pale-lime text-steel-blue px-4 py-2 rounded-lg hover:bg-opacity-90 font-medium flex items-center"
            >
              <Tag className="mr-2 w-4 h-4" />
              Create Promotion
            </button>
          </div>
        </div>

        <nav className="space-y-2">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Overview</div>
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

          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 mt-6">Sales</div>
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

          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 mt-6">Catalog</div>
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

          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 mt-6">Marketing</div>
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

          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 mt-6">Account</div>

          <div className="mt-4">
            <h5 className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-3 mb-2">Settings</h5>
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
