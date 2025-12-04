"use client"

import {
  BarChart3,
  Box,
  CreditCard,
  DollarSign,
  HeadphonesIcon,
  Megaphone,
  PieChart,
  Plus,
  Settings,
  ShoppingBag,
  Star,
  Tag,
  Tags,
  TrendingUp,
  Users,
  Warehouse,
} from "lucide-react"

import Link from "next/link"
import { usePathname } from "next/navigation"

const VendorSidebar = () => {
  const pathname = usePathname()
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
          <Link
            href="/vendor-dashboard"
            className={`flex items-center px-3 py-2 rounded-lg ${
              pathname === "/vendor-dashboard"
                ? "text-steel-blue bg-light-mint-gray font-medium"
                : "text-gray-700 hover:bg-light-mint-gray"
            }`}
          >
            <TrendingUp className="w-5 mr-3" />
            Dashboard
          </Link>
          <Link
            href="/analytics"
            className="flex items-center px-3 py-2 text-gray-700 hover:bg-light-mint-gray rounded-lg"
          >
            <BarChart3 className="w-5 mr-3" />
            Analytics
          </Link>
          <Link
            href="/performance"
            className="flex items-center px-3 py-2 text-gray-700 hover:bg-light-mint-gray rounded-lg"
          >
            <PieChart className="w-5 mr-3" />
            Performance
          </Link>

          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 mt-6">Sales</div>
          <Link
            href="/orders"
            className="flex items-center px-3 py-2 text-gray-700 hover:bg-light-mint-gray rounded-lg"
          >
            <ShoppingBag className="w-5 mr-3" />
            Orders
            <span className="ml-auto bg-coral-orange text-white text-xs px-2 py-1 rounded-full">12</span>
          </Link>
          <Link
            href="/revenue"
            className="flex items-center px-3 py-2 text-gray-700 hover:bg-light-mint-gray rounded-lg"
          >
            <DollarSign className="w-5 mr-3" />
            Revenue
          </Link>
          <Link
            href="/customers"
            className="flex items-center px-3 py-2 text-gray-700 hover:bg-light-mint-gray rounded-lg"
          >
            <Users className="w-5 mr-3" />
            Customers
          </Link>

          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 mt-6">Catalog</div>
          <Link
            href="/vendor-dashboard/products"
            className={`flex items-center px-3 py-2 rounded-lg ${
              pathname?.startsWith("/vendor-dashboard/products")
                ? "text-steel-blue bg-light-mint-gray font-medium"
                : "text-gray-700 hover:bg-light-mint-gray"
            }`}
          >
            <Box className="w-5 mr-3" />
            Products
            <span className="ml-auto text-gray-500 text-sm">1,247</span>
          </Link>
          <Link
            href="/inventory"
            className="flex items-center px-3 py-2 text-gray-700 hover:bg-light-mint-gray rounded-lg"
          >
            <Warehouse className="w-5 mr-3" />
            Inventory
          </Link>
          <Link
            href="/categories"
            className="flex items-center px-3 py-2 text-gray-700 hover:bg-light-mint-gray rounded-lg"
          >
            <Tags className="w-5 mr-3" />
            Categories
          </Link>

          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 mt-6">Marketing</div>
          <Link
            href="/promotions"
            className="flex items-center px-3 py-2 text-gray-700 hover:bg-light-mint-gray rounded-lg"
          >
            <Megaphone className="w-5 mr-3" />
            Promotions
          </Link>
          <Link
            href="/reviews"
            className="flex items-center px-3 py-2 text-gray-700 hover:bg-light-mint-gray rounded-lg"
          >
            <Star className="w-5 mr-3" />
            Reviews
            <span className="ml-auto bg-pale-lime text-steel-blue text-xs px-2 py-1 rounded-full">4.8</span>
          </Link>

          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 mt-6">Account</div>
          <Link
            href="/settings"
            className="flex items-center px-3 py-2 text-gray-700 hover:bg-light-mint-gray rounded-lg"
          >
            <Settings className="w-5 mr-3" />
            Settings
          </Link>
          <Link
            href="/billing"
            className="flex items-center px-3 py-2 text-gray-700 hover:bg-light-mint-gray rounded-lg"
          >
            <CreditCard className="w-5 mr-3" />
            Billing
          </Link>
          <Link
            href="/support"
            className="flex items-center px-3 py-2 text-gray-700 hover:bg-light-mint-gray rounded-lg"
          >
            <HeadphonesIcon className="w-5 mr-3" />
            Support
          </Link>
        </nav>
      </div>
    </aside>
  )
}

export default VendorSidebar
