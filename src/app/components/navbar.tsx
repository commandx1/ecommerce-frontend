"use client"

import { ChevronDown, LogOut, Menu, Settings, ShoppingCart, User } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
// import { authAPI } from "@/lib/api/auth"
import { useAuthStore } from "@/stores/authStore"
import { useCartStore } from "@/stores/cartStore"
import Logo from "./Logo"
import AccountMenu from "./AccountMenu"
import MainSearchbox from "./main-searchbox/MainSearchbox"

interface NavbarProps {
  initialAuthState?: {
    user: {
      id: string
      name: string
      surname: string
      email: string
      roleName?: string
    } | null
    isAuthenticated: boolean
  } | null
}

const Navbar = ({ initialAuthState }: NavbarProps) => {
  const router = useRouter()
  const cartCount = useCartStore((state) => state.cartCount)
  const { logout, user: storeUser, isAuthenticated: storeIsAuthenticated } = useAuthStore()

  const [mounted, setMounted] = useState(false)
  // We use a static ID because useId() causes hydration mismatches
  const headerId = "main-header"

  useEffect(() => {
    setMounted(true)
  }, [])

  // Use store state on client, initial state on server/initial render to avoid flicker
  const user = mounted ? storeUser : initialAuthState?.user
  const isAuthenticated = mounted ? storeIsAuthenticated : initialAuthState?.isAuthenticated

  // Helper function to get dashboard URL based on user type
  const getDashboardUrl = () => {
    const isVendor = user?.roleName === "Vendor"
    return isVendor ? "/vendor-dashboard" : "/buyer-dashboard"
  }

  const handleLogout = async () => {
    await logout()
    router.refresh()
    router.push("/")
  }
  return (
    <header id={headerId} className="bg-white shadow-sm">
      <div className="app-container mx-auto px-4 sm:px-6 lg:px-8">
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
              <AccountMenu
                className="md:flex hidden"
                displayName={`${user.name} ${user.surname}`.trim() || user.email}
                email={user.email}
                items={[
                  {
                    label: "Dashboard",
                    onClick: () => router.push(getDashboardUrl()),
                    icon: <User className="w-4 h-4" />,
                  },
                  {
                    label: "Settings",
                    onClick: () => router.push("/buyer-dashboard/settings"),
                    icon: <Settings className="w-4 h-4" />,
                  },
                  {
                    label: "Sign Out",
                    onClick: handleLogout,
                    icon: <LogOut className="w-4 h-4" />,
                    variant: "danger",
                  },
                ]}
              />
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
