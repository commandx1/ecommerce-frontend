"use client"

import { ChevronDown, LogOut } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import Logo from "@/app/components/Logo"
import { useAuthStore } from "@/stores/authStore"

const BuyerHeader = () => {
  const router = useRouter()
  const { user, logout } = useAuthStore()
  const [showMenu, setShowMenu] = useState(false)

  const displayName = user ? `${user.name} ${user.surname}`.trim() || user.email : "Account"

  const handleLogout = async () => {
    await logout()
    router.refresh()
    router.push("/")
    setShowMenu(false)
  }

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
              <Link href="/buyer-dashboard/orders" className="text-gray-700 hover:text-steel-blue font-medium">
                Orders
              </Link>
              <Link href="/buyer-dashboard/suppliers" className="text-gray-700 hover:text-steel-blue font-medium">
                Suppliers
              </Link>
              <Link href="/buyer-dashboard/invoices" className="text-gray-700 hover:text-steel-blue font-medium">
                Invoices
              </Link>
              <Link href="/buyer-dashboard/reports" className="text-gray-700 hover:text-steel-blue font-medium">
                Reports
              </Link>
            </nav>
          </div>
          <div className="relative flex items-center gap-3" onClick={() => setShowMenu((prev) => !prev)}>
            <div className="w-8 h-8 rounded-full bg-steel-blue text-white flex items-center justify-center">
              {displayName.charAt(0).toUpperCase()}
            </div>
            <div className="hidden md:block">
              <div className="text-sm font-semibold text-steel-blue">{displayName}</div>
              <div className="text-xs text-gray-600">{user?.email}</div>
            </div>
            <button type="button" className="text-gray-400 hover:text-steel-blue">
              {
                <ChevronDown
                  className="text-sm w-4 h-4 transition-transform duration-200"
                  style={{ transform: showMenu ? "rotate(180deg)" : "rotate(0deg)" }}
                />
              }
            </button>
            {showMenu && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="absolute right-0 top-12 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50"
              >
                <div className="px-4 py-3 border-b border-gray-200">
                  <p className="text-sm font-medium text-gray-900">{displayName}</p>
                  {user?.email && <p className="text-sm text-gray-500 truncate">{user.email}</p>}
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center px-4 py-2 text-red-600 hover:bg-red-50 text-left text-sm font-medium"
                >
                  <LogOut className="w-4 h-4 mr-3" />
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

export default BuyerHeader
