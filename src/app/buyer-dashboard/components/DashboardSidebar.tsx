import {
  CheckCircle,
  Clock,
  CreditCard,
  FileText,
  HeadphonesIcon,
  Heart,
  HelpCircle,
  Home,
  Plus,
  RotateCcw,
  Search,
  Settings,
  ShoppingBag,
  Star,
  Store,
  TrendingUp,
  Truck,
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

const DashboardSidebar = () => {
  const pathname = usePathname()

  const isActive = (path: string) => pathname === path

  return (
    <aside
      id="sidebar"
      className="w-64 bg-white shadow-sm border-r border-gray-200 h-[calc(100vh-4rem)] sticky top-16 overflow-y-auto z-40"
    >
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-steel-blue">Quick Actions</h3>
          <button type="button" className="text-gray-400 hover:text-steel-blue">
            <Plus className="w-4 h-4" />
          </button>
        </div>
        <div className="space-y-3 mb-8">
          <button
            type="button"
            className="w-full bg-steel-blue text-white py-3 px-4 rounded-lg hover:bg-opacity-90 font-medium flex items-center"
          >
            <Plus className="mr-2 w-4 h-4" />
            New Order
          </button>
          <button
            type="button"
            className="w-full bg-pale-lime text-steel-blue py-3 px-4 rounded-lg hover:bg-opacity-90 font-medium flex items-center"
          >
            <RotateCcw className="mr-2 w-4 h-4" />
            Reorder Items
          </button>
          <button
            type="button"
            className="w-full border border-steel-blue text-steel-blue py-3 px-4 rounded-lg hover:bg-steel-blue hover:text-white font-medium flex items-center transition-colors"
          >
            <Search className="mr-2 w-4 h-4" />
            Find Suppliers
          </button>
        </div>

        <nav className="space-y-2">
          <div className="pb-2 border-b border-gray-200">
            <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">Dashboard</h4>
            <Link
              href="/buyer-dashboard"
              className={`flex items-center px-3 py-2 rounded-lg font-medium transition-colors ${
                isActive("/buyer-dashboard") ? "text-steel-blue bg-light-mint-gray" : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <Home className={`mr-3 w-4 h-4 ${isActive("/buyer-dashboard") ? "text-steel-blue" : "text-gray-500"}`} />
              <span>Overview</span>
            </Link>
            <Link
              href="/analytics"
              className={`flex items-center px-3 py-2 rounded-lg transition-colors ${
                isActive("/analytics") ? "text-steel-blue bg-light-mint-gray" : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <TrendingUp className={`mr-3 w-4 h-4 ${isActive("/analytics") ? "text-steel-blue" : "text-gray-500"}`} />
              <span>Analytics</span>
            </Link>
          </div>

          <div className="py-2 border-b border-gray-200">
            <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">Orders</h4>
            <Link
              href="/orders"
              className={`flex items-center px-3 py-2 rounded-lg transition-colors ${
                isActive("/orders") ? "text-steel-blue bg-light-mint-gray" : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <ShoppingBag className={`mr-3 w-4 h-4 ${isActive("/orders") ? "text-steel-blue" : "text-gray-500"}`} />
              <span>All Orders</span>
              <span className="ml-auto bg-gray-200 text-gray-700 text-xs px-2 py-1 rounded-full">24</span>
            </Link>
            <Link
              href="/orders/pending"
              className={`flex items-center px-3 py-2 rounded-lg transition-colors ${
                isActive("/orders/pending") ? "text-steel-blue bg-light-mint-gray" : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <Clock
                className={`mr-3 w-4 h-4 ${isActive("/orders/pending") ? "text-steel-blue" : "text-gray-500"}`}
              />
              <span>Pending</span>
              <span className="ml-auto bg-coral-orange text-white text-xs px-2 py-1 rounded-full">3</span>
            </Link>
            <Link
              href="/orders/transit"
              className={`flex items-center px-3 py-2 rounded-lg transition-colors ${
                isActive("/orders/transit") ? "text-steel-blue bg-light-mint-gray" : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <Truck
                className={`mr-3 w-4 h-4 ${isActive("/orders/transit") ? "text-steel-blue" : "text-gray-500"}`}
              />
              <span>In Transit</span>
              <span className="ml-auto bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full">7</span>
            </Link>
            <Link
              href="/orders/completed"
              className={`flex items-center px-3 py-2 rounded-lg transition-colors ${
                isActive("/orders/completed") ? "text-steel-blue bg-light-mint-gray" : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <CheckCircle
                className={`mr-3 w-4 h-4 ${isActive("/orders/completed") ? "text-steel-blue" : "text-gray-500"}`}
              />
              <span>Completed</span>
            </Link>
          </div>

          <div className="py-2 border-b border-gray-200">
            <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">Suppliers</h4>
            <Link
              href="/suppliers/favorites"
              className={`flex items-center px-3 py-2 rounded-lg transition-colors ${
                isActive("/suppliers/favorites")
                  ? "text-steel-blue bg-light-mint-gray"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <Heart
                className={`mr-3 w-4 h-4 ${isActive("/suppliers/favorites") ? "text-steel-blue" : "text-gray-500"}`}
              />
              <span>Favorites</span>
              <span className="ml-auto bg-gray-200 text-gray-700 text-xs px-2 py-1 rounded-full">12</span>
            </Link>
            <Link
              href="/suppliers"
              className={`flex items-center px-3 py-2 rounded-lg transition-colors ${
                isActive("/suppliers") ? "text-steel-blue bg-light-mint-gray" : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <Store className={`mr-3 w-4 h-4 ${isActive("/suppliers") ? "text-steel-blue" : "text-gray-500"}`} />
              <span>All Suppliers</span>
            </Link>
            <Link
              href="/suppliers/top-rated"
              className={`flex items-center px-3 py-2 rounded-lg transition-colors ${
                isActive("/suppliers/top-rated")
                  ? "text-steel-blue bg-light-mint-gray"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <Star
                className={`mr-3 w-4 h-4 ${isActive("/suppliers/top-rated") ? "text-steel-blue" : "text-gray-500"}`}
              />
              <span>Top Rated</span>
            </Link>
          </div>

          <div className="py-2 border-b border-gray-200">
            <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">Account</h4>
            <Link
              href="/invoices"
              className={`flex items-center px-3 py-2 rounded-lg transition-colors ${
                isActive("/invoices") ? "text-steel-blue bg-light-mint-gray" : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <FileText className={`mr-3 w-4 h-4 ${isActive("/invoices") ? "text-steel-blue" : "text-gray-500"}`} />
              <span>Invoices</span>
            </Link>
            <Link
              href="/payment-methods"
              className={`flex items-center px-3 py-2 rounded-lg transition-colors ${
                isActive("/payment-methods") ? "text-steel-blue bg-light-mint-gray" : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <CreditCard
                className={`mr-3 w-4 h-4 ${isActive("/payment-methods") ? "text-steel-blue" : "text-gray-500"}`}
              />
              <span>Payment Methods</span>
            </Link>
            <Link
              href="/buyer-dashboard/settings"
              className={`flex items-center px-3 py-2 rounded-lg transition-colors ${
                isActive("/buyer-dashboard/settings")
                  ? "text-steel-blue bg-light-mint-gray"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <Settings
                className={`mr-3 w-4 h-4 ${
                  isActive("/buyer-dashboard/settings") ? "text-steel-blue" : "text-gray-500"
                }`}
              />
              <span>Settings</span>
            </Link>
          </div>

          <div className="py-2">
            <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">Support</h4>
            <Link
              href="/help"
              className={`flex items-center px-3 py-2 rounded-lg transition-colors ${
                isActive("/help") ? "text-steel-blue bg-light-mint-gray" : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <HelpCircle className={`mr-3 w-4 h-4 ${isActive("/help") ? "text-steel-blue" : "text-gray-500"}`} />
              <span>Help Center</span>
            </Link>
            <Link
              href="/support"
              className={`flex items-center px-3 py-2 rounded-lg transition-colors ${
                isActive("/support") ? "text-steel-blue bg-light-mint-gray" : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <HeadphonesIcon
                className={`mr-3 w-4 h-4 ${isActive("/support") ? "text-steel-blue" : "text-gray-500"}`}
              />
              <span>Contact Support</span>
            </Link>
          </div>
        </nav>
      </div>
    </aside>
  )
}

export default DashboardSidebar
