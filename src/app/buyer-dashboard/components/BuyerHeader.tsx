import { Bell, ChevronDown, Search, ShoppingCart } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import Logo from "@/app/components/Logo"

const BuyerHeader = () => {
  return (
    <header id="header" className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-full px-6">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            <Link href="/" className="flex items-center">
              <div className="w-10 h-10 bg-steel-blue rounded-lg flex items-center justify-center">
                <Logo />
              </div>
              <span className="ml-3 text-2xl font-bold text-steel-blue">DentyPro</span>
            </Link>
            <nav className="hidden md:flex space-x-6">
              <Link href="/buyer-dashboard" className="text-steel-blue font-semibold border-b-2 border-steel-blue pb-1">
                Dashboard
              </Link>
              <Link href="/orders" className="text-gray-700 hover:text-steel-blue font-medium">
                Orders
              </Link>
              <Link href="/suppliers" className="text-gray-700 hover:text-steel-blue font-medium">
                Suppliers
              </Link>
              <Link href="/invoices" className="text-gray-700 hover:text-steel-blue font-medium">
                Invoices
              </Link>
              <Link href="/reports" className="text-gray-700 hover:text-steel-blue font-medium">
                Reports
              </Link>
            </nav>
          </div>
          <div className="flex items-center space-x-4">
            <div className="relative hidden lg:block">
              <input
                type="text"
                placeholder="Search orders, suppliers..."
                className="w-80 pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-steel-blue focus:border-transparent"
              />
              <Search className="absolute left-3 top-3 text-gray-400 w-4 h-4" />
            </div>
            <button type="button" className="p-2 text-gray-600 hover:text-steel-blue relative">
              <Bell className="text-xl w-5 h-5" />
              <span className="absolute -top-1 -right-1 bg-coral-orange text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                5
              </span>
            </button>
            <button type="button" className="p-2 text-gray-600 hover:text-steel-blue relative">
              <ShoppingCart className="text-xl w-5 h-5" />
              <span className="absolute -top-1 -right-1 bg-coral-orange text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                3
              </span>
            </button>
            <div className="flex items-center space-x-3">
              <Image
                src="https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-1.jpg"
                alt="Profile"
                width={32}
                height={32}
                className="w-8 h-8 rounded-full"
              />
              <div className="hidden md:block">
                <div className="text-sm font-semibold text-steel-blue">Dr. Sarah Johnson</div>
                <div className="text-xs text-gray-600">Smile Dental Clinic</div>
              </div>
              <button type="button" className="text-gray-400 hover:text-steel-blue">
                <ChevronDown className="text-sm w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}

export default BuyerHeader
