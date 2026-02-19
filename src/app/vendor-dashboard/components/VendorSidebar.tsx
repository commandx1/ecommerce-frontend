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
          <Link
            href="/vendor-dashboard"
            className={`flex items-center px-3 py-2 rounded-lg transition-colors ${
              isActive("/vendor-dashboard")
                ? "text-steel-blue bg-light-mint-gray font-medium"
                : "text-gray-700 hover:bg-light-mint-gray"
            }`}
          >
            <TrendingUp className={`w-5 mr-3 ${isActive("/vendor-dashboard") ? "text-steel-blue" : "text-gray-500"}`} />
            Dashboard
          </Link>
          <Link
            href="/analytics"
            className={`flex items-center px-3 py-2 rounded-lg transition-colors ${
              isActive("/analytics")
                ? "text-steel-blue bg-light-mint-gray font-medium"
                : "text-gray-700 hover:bg-light-mint-gray"
            }`}
          >
            <BarChart3 className={`w-5 mr-3 ${isActive("/analytics") ? "text-steel-blue" : "text-gray-500"}`} />
            Analytics
          </Link>
          <Link
            href="/performance"
            className={`flex items-center px-3 py-2 rounded-lg transition-colors ${
              isActive("/performance")
                ? "text-steel-blue bg-light-mint-gray font-medium"
                : "text-gray-700 hover:bg-light-mint-gray"
            }`}
          >
            <PieChart className={`w-5 mr-3 ${isActive("/performance") ? "text-steel-blue" : "text-gray-500"}`} />
            Performance
          </Link>

          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 mt-6">Sales</div>
          <Link
            href="/orders"
            className={`flex items-center px-3 py-2 rounded-lg transition-colors ${
              isActive("/orders")
                ? "text-steel-blue bg-light-mint-gray font-medium"
                : "text-gray-700 hover:bg-light-mint-gray"
            }`}
          >
            <ShoppingBag className={`w-5 mr-3 ${isActive("/orders") ? "text-steel-blue" : "text-gray-500"}`} />
            Orders
            <span className="ml-auto bg-coral-orange text-white text-xs px-2 py-1 rounded-full">12</span>
          </Link>
          <Link
            href="/revenue"
            className={`flex items-center px-3 py-2 rounded-lg transition-colors ${
              isActive("/revenue")
                ? "text-steel-blue bg-light-mint-gray font-medium"
                : "text-gray-700 hover:bg-light-mint-gray"
            }`}
          >
            <DollarSign className={`w-5 mr-3 ${isActive("/revenue") ? "text-steel-blue" : "text-gray-500"}`} />
            Revenue
          </Link>
          <Link
            href="/customers"
            className={`flex items-center px-3 py-2 rounded-lg transition-colors ${
              isActive("/customers")
                ? "text-steel-blue bg-light-mint-gray font-medium"
                : "text-gray-700 hover:bg-light-mint-gray"
            }`}
          >
            <Users className={`w-5 mr-3 ${isActive("/customers") ? "text-steel-blue" : "text-gray-500"}`} />
            Customers
          </Link>

          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 mt-6">Catalog</div>
          <Link
            href="/vendor-dashboard/products"
            className={`flex items-center px-3 py-2 rounded-lg transition-colors ${
              isActive("/vendor-dashboard/products")
                ? "text-steel-blue bg-light-mint-gray font-medium"
                : "text-gray-700 hover:bg-light-mint-gray"
            }`}
          >
            <Box className={`w-5 mr-3 ${isActive("/vendor-dashboard/products") ? "text-steel-blue" : "text-gray-500"}`} />
            Products
            <span className="ml-auto text-gray-500 text-sm">1,247</span>
          </Link>
          <Link
            href="/inventory"
            className={`flex items-center px-3 py-2 rounded-lg transition-colors ${
              isActive("/inventory")
                ? "text-steel-blue bg-light-mint-gray font-medium"
                : "text-gray-700 hover:bg-light-mint-gray"
            }`}
          >
            <Warehouse className={`w-5 mr-3 ${isActive("/inventory") ? "text-steel-blue" : "text-gray-500"}`} />
            Inventory
          </Link>
          <Link
            href="/categories"
            className={`flex items-center px-3 py-2 rounded-lg transition-colors ${
              isActive("/categories")
                ? "text-steel-blue bg-light-mint-gray font-medium"
                : "text-gray-700 hover:bg-light-mint-gray"
            }`}
          >
            <Tags className={`w-5 mr-3 ${isActive("/categories") ? "text-steel-blue" : "text-gray-500"}`} />
            Categories
          </Link>

          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 mt-6">Marketing</div>
          <Link
            href="/promotions"
            className={`flex items-center px-3 py-2 rounded-lg transition-colors ${
              isActive("/promotions")
                ? "text-steel-blue bg-light-mint-gray font-medium"
                : "text-gray-700 hover:bg-light-mint-gray"
            }`}
          >
            <Megaphone className={`w-5 mr-3 ${isActive("/promotions") ? "text-steel-blue" : "text-gray-500"}`} />
            Promotions
          </Link>
          <Link
            href="/reviews"
            className={`flex items-center px-3 py-2 rounded-lg transition-colors ${
              isActive("/reviews")
                ? "text-steel-blue bg-light-mint-gray font-medium"
                : "text-gray-700 hover:bg-light-mint-gray"
            }`}
          >
            <Star className={`w-5 mr-3 ${isActive("/reviews") ? "text-steel-blue" : "text-gray-500"}`} />
            Reviews
            <span className="ml-auto bg-pale-lime text-steel-blue text-xs px-2 py-1 rounded-full">4.8</span>
          </Link>

          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 mt-6">Account</div>
          
          <div className="mt-4">
            <h5 className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-3 mb-2">Settings</h5>
            <Link
              href="/vendor-dashboard/settings"
              className={`flex items-center px-3 py-2 rounded-lg transition-colors ${
                isActive("/vendor-dashboard/settings")
                  ? "text-steel-blue bg-light-mint-gray font-medium"
                  : "text-gray-700 hover:bg-light-mint-gray"
              }`}
            >
              <User className={`w-5 mr-3 ${isActive("/vendor-dashboard/settings") ? "text-steel-blue" : "text-gray-500"}`} />
              <span className="text-sm">Account</span>
            </Link>
            <Link
              href="/vendor-dashboard/settings/addresses"
              className={`flex items-center px-3 py-2 rounded-lg transition-colors ${
                isActive("/vendor-dashboard/settings/addresses")
                  ? "text-steel-blue bg-light-mint-gray font-medium"
                  : "text-gray-700 hover:bg-light-mint-gray"
              }`}
            >
              <MapPin className={`w-5 mr-3 ${isActive("/vendor-dashboard/settings/addresses") ? "text-steel-blue" : "text-gray-500"}`} />
              <span className="text-sm">Addresses</span>
            </Link>
          </div>

          <Link
            href="/billing"
            className={`flex items-center px-3 py-2 rounded-lg transition-colors ${
              isActive("/billing")
                ? "text-steel-blue bg-light-mint-gray font-medium"
                : "text-gray-700 hover:bg-light-mint-gray"
            }`}
          >
            <CreditCard className={`w-5 mr-3 ${isActive("/billing") ? "text-steel-blue" : "text-gray-500"}`} />
            <span className="text-sm">Billing</span>
          </Link>
          <Link
            href="/support"
            className={`flex items-center px-3 py-2 rounded-lg transition-colors ${
              isActive("/support")
                ? "text-steel-blue bg-light-mint-gray font-medium"
                : "text-gray-700 hover:bg-light-mint-gray"
            }`}
          >
            <HeadphonesIcon className={`w-5 mr-3 ${isActive("/support") ? "text-steel-blue" : "text-gray-500"}`} />
            <span className="text-sm">Support</span>
          </Link>
        </nav>
      </div>
    </aside>
  )
}

export default VendorSidebar
