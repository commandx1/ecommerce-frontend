import { ChevronDown, Hospital, Menu, ShoppingCart } from "lucide-react"
import Link from "next/link"
import MainSearchbox from "./main-searchbox/MainSearchbox"

const Navbar = () => {
  return (
    <header id="header" className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 border-b border-gray-200">
          <Link href="/" className="flex items-center">
            <Hospital className="w-10 h-10 text-steel-blue" />
            <span className="ml-3 text-2xl font-bold text-steel-blue">DentyPro</span>
          </Link>
          <div className="flex-1 mx-8 hidden lg:block">
            <MainSearchbox />
          </div>
          <div className="flex items-center space-x-6">
            <button type="button" className="text-left text-gray-700 hover:text-steel-blue">
              <div className="text-sm">Hello, Sign In</div>
              <div className="font-semibold flex items-center gap-2">
                Account &amp; Lists <ChevronDown className="w-4 h-4" />
              </div>
            </button>
            <button type="button" className="text-left text-gray-700 hover:text-steel-blue">
              <div className="text-sm">Returns</div>
              <div className="font-semibold">&amp; Orders</div>
            </button>
            <button type="button" className="flex items-end space-x-2 text-gray-700 hover:text-steel-blue relative">
              <ShoppingCart className="w-4 h-4" />
              <span className="font-semibold">Cart</span>
              <span className="absolute -top-2 left-3 bg-coral-orange text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                3
              </span>
            </button>
          </div>
        </div>
        <div className="flex items-center justify-between h-12">
          <nav className="flex space-x-8">
            <button type="button" className="flex items-center font-medium text-gray-800 hover:text-steel-blue">
              <Menu className="w-4 h-4 mr-2" />
              All Categories
            </button>
            <a href="/top-deals" className="text-gray-700 hover:text-steel-blue font-medium">
              Top Deals
            </a>
            <a href="/suppliers" className="text-gray-700 hover:text-steel-blue font-medium">
              Suppliers
            </a>
            <a href="/equipment" className="text-gray-700 hover:text-steel-blue font-medium">
              Equipment
            </a>
            <a href="/lab-services" className="text-gray-700 hover:text-steel-blue font-medium">
              Lab Services
            </a>
            <a href="/resources" className="text-gray-700 hover:text-steel-blue font-medium">
              Resources
            </a>
          </nav>
          <div className="flex items-center space-x-4">
            <button
              type="button"
              className="bg-pale-lime text-steel-blue px-4 py-2 rounded-lg hover:bg-opacity-90 font-semibold"
            >
              Register Your Clinic
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Navbar
