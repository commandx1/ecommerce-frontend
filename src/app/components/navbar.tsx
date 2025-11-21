"use client"

import { ChevronDown, LogOut, Menu, Settings, ShoppingCart, User } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
// import { authAPI } from "@/lib/api/auth"
import { authAPIDirect as authAPI } from "@/lib/api/auth-direct"
import { useAuthStore } from "@/stores/authStore"
import { useCartStore } from "@/stores/cartStore"
import Logo from "./Logo"
import MainSearchbox from "./main-searchbox/MainSearchbox"

const Navbar = () => {
  const router = useRouter()
  const cartCount = useCartStore((state) => state.cartCount)
  const { user, isAuthenticated, clearAuth, accessToken, refreshToken } = useAuthStore()
  const [showProfileMenu, setShowProfileMenu] = useState(false)

  const handleLogout = async () => {
    try {
      if (refreshToken && accessToken) {
        await authAPI.logout({ refreshToken }, accessToken)
      }
    } catch {
      // Hata olsa bile local state'i temizle
    } finally {
      clearAuth()
      router.push("/")
      setShowProfileMenu(false)
    }
  }
  return (
    <header id="header" className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 border-b border-gray-200">
          <Link href="/" className="flex items-center">
            <Logo />
            <span className="ml-3 text-2xl font-bold text-steel-blue">DentyPro</span>
          </Link>
          <div className="flex-1 mx-8 hidden lg:block">
            <MainSearchbox />
          </div>
          <div className="flex items-center space-x-6">
            {isAuthenticated && user ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="text-left text-gray-700 hover:text-steel-blue"
                >
                  <div className="text-sm">Hello, {user.name}</div>
                  <div className="font-semibold flex items-center gap-2">
                    Account &amp; Lists <ChevronDown className="w-4 h-4" />
                  </div>
                </button>

                {showProfileMenu && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                    <div className="px-4 py-3 border-b border-gray-200">
                      <p className="text-sm font-medium text-gray-900">
                        {user.name} {user.surname}
                      </p>
                      <p className="text-sm text-gray-500 truncate">{user.email}</p>
                    </div>
                    <Link
                      href="/buyer-dashboard"
                      onClick={() => setShowProfileMenu(false)}
                      className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100"
                    >
                      <User className="w-4 h-4 mr-3" />
                      Dashboard
                    </Link>
                    <Link
                      href="/settings"
                      onClick={() => setShowProfileMenu(false)}
                      className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100"
                    >
                      <Settings className="w-4 h-4 mr-3" />
                      Settings
                    </Link>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full flex items-center px-4 py-2 text-red-600 hover:bg-red-50"
                    >
                      <LogOut className="w-4 h-4 mr-3" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => router.push("/login")}
                className="text-left text-gray-700 hover:text-steel-blue"
              >
                <div className="text-sm">Hello, Sign In</div>
                <div className="font-semibold flex items-center gap-2">
                  Account &amp; Lists <ChevronDown className="w-4 h-4" />
                </div>
              </button>
            )}
            <button type="button" className="text-left text-gray-700 hover:text-steel-blue">
              <div className="text-sm">Returns</div>
              <div className="font-semibold">&amp; Orders</div>
            </button>
            <Link href="/cart" className="flex items-end space-x-2 text-gray-700 hover:text-steel-blue relative">
              <ShoppingCart className="w-4 h-4" />
              <span className="font-semibold">Cart</span>
              {cartCount > 0 && (
                <span className="absolute -top-2 left-3 bg-coral-orange text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Link>
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
            {!isAuthenticated && (
              <button
                type="button"
                onClick={() => router.push("/register")}
                className="bg-pale-lime text-steel-blue px-4 py-2 rounded-lg hover:bg-opacity-90 font-semibold"
              >
                Register Your Clinic
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

export default Navbar
