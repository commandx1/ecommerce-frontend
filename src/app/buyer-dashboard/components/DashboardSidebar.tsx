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

const DashboardSidebar = () => {
  return (
    <aside
      id="sidebar"
      className="fixed left-0 top-32 w-64 h-[calc(100vh-8rem)] bg-white border-r border-gray-200 overflow-y-auto"
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
              className="flex items-center px-3 py-2 text-steel-blue bg-light-mint-gray rounded-lg font-medium"
            >
              <Home className="mr-3 text-steel-blue w-4 h-4" />
              <span>Overview</span>
            </Link>
            <Link href="/analytics" className="flex items-center px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">
              <TrendingUp className="mr-3 text-gray-500 w-4 h-4" />
              <span>Analytics</span>
            </Link>
          </div>

          <div className="py-2 border-b border-gray-200">
            <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">Orders</h4>
            <Link href="/orders" className="flex items-center px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">
              <ShoppingBag className="mr-3 text-gray-500 w-4 h-4" />
              <span>All Orders</span>
              <span className="ml-auto bg-gray-200 text-gray-700 text-xs px-2 py-1 rounded-full">24</span>
            </Link>
            <Link
              href="/orders/pending"
              className="flex items-center px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
            >
              <Clock className="mr-3 text-gray-500 w-4 h-4" />
              <span>Pending</span>
              <span className="ml-auto bg-coral-orange text-white text-xs px-2 py-1 rounded-full">3</span>
            </Link>
            <Link
              href="/orders/transit"
              className="flex items-center px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
            >
              <Truck className="mr-3 text-gray-500 w-4 h-4" />
              <span>In Transit</span>
              <span className="ml-auto bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full">7</span>
            </Link>
            <Link
              href="/orders/completed"
              className="flex items-center px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
            >
              <CheckCircle className="mr-3 text-gray-500 w-4 h-4" />
              <span>Completed</span>
            </Link>
          </div>

          <div className="py-2 border-b border-gray-200">
            <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">Suppliers</h4>
            <Link
              href="/suppliers/favorites"
              className="flex items-center px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
            >
              <Heart className="mr-3 text-gray-500 w-4 h-4" />
              <span>Favorites</span>
              <span className="ml-auto bg-gray-200 text-gray-700 text-xs px-2 py-1 rounded-full">12</span>
            </Link>
            <Link href="/suppliers" className="flex items-center px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">
              <Store className="mr-3 text-gray-500 w-4 h-4" />
              <span>All Suppliers</span>
            </Link>
            <Link
              href="/suppliers/top-rated"
              className="flex items-center px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
            >
              <Star className="mr-3 text-gray-500 w-4 h-4" />
              <span>Top Rated</span>
            </Link>
          </div>

          <div className="py-2 border-b border-gray-200">
            <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">Account</h4>
            <Link href="/invoices" className="flex items-center px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">
              <FileText className="mr-3 text-gray-500 w-4 h-4" />
              <span>Invoices</span>
            </Link>
            <Link
              href="/payment-methods"
              className="flex items-center px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
            >
              <CreditCard className="mr-3 text-gray-500 w-4 h-4" />
              <span>Payment Methods</span>
            </Link>
            <Link href="/settings" className="flex items-center px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">
              <Settings className="mr-3 text-gray-500 w-4 h-4" />
              <span>Settings</span>
            </Link>
          </div>

          <div className="py-2">
            <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">Support</h4>
            <Link href="/help" className="flex items-center px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">
              <HelpCircle className="mr-3 text-gray-500 w-4 h-4" />
              <span>Help Center</span>
            </Link>
            <Link href="/support" className="flex items-center px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">
              <HeadphonesIcon className="mr-3 text-gray-500 w-4 h-4" />
              <span>Contact Support</span>
            </Link>
          </div>
        </nav>
      </div>
    </aside>
  )
}

export default DashboardSidebar
