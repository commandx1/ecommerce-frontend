"use client"

import { Bell, ChevronDown, Mail } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import Logo from "@/app/components/Logo"

const VendorHeader = () => {
  const pathname = usePathname()
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
            <nav className="hidden md:flex space-x-8">
              <Link
                href="/vendor-dashboard"
                className={`${
                  pathname === "/vendor-dashboard"
                    ? "text-steel-blue font-semibold border-b-2 border-steel-blue"
                    : "text-gray-700 hover:text-steel-blue font-medium"
                }`}
              >
                Dashboard
              </Link>
              <Link
                href="/vendor-dashboard/products"
                className={`${
                  pathname?.startsWith("/vendor-dashboard/products")
                    ? "text-steel-blue font-semibold border-b-2 border-steel-blue"
                    : "text-gray-700 hover:text-steel-blue font-medium"
                }`}
              >
                Products
              </Link>
              <Link href="/orders" className="text-gray-700 hover:text-steel-blue font-medium">
                Orders
              </Link>
              <Link href="/analytics" className="text-gray-700 hover:text-steel-blue font-medium">
                Analytics
              </Link>
              <Link href="/marketing" className="text-gray-700 hover:text-steel-blue font-medium">
                Marketing
              </Link>
            </nav>
          </div>
          <div className="flex items-center space-x-4">
            <button type="button" className="p-2 text-gray-600 hover:text-steel-blue relative">
              <Bell className="text-xl w-5 h-5" />
              <span className="absolute -top-1 -right-1 bg-coral-orange text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                5
              </span>
            </button>
            <button type="button" className="p-2 text-gray-600 hover:text-steel-blue">
              <Mail className="text-xl w-5 h-5" />
            </button>
            <div className="flex items-center space-x-3">
              <Image
                src="https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-3.jpg"
                alt="Vendor Avatar"
                width={40}
                height={40}
                className="w-10 h-10 rounded-full"
              />
              <div className="hidden lg:block">
                <div className="text-sm font-semibold text-steel-blue">DentalPro Supply</div>
                <div className="text-xs text-gray-600">Verified Supplier</div>
              </div>
              <button type="button" className="text-gray-400 hover:text-steel-blue">
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}

export default VendorHeader
