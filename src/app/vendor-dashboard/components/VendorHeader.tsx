"use client"

import { LogOut } from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import Logo from "@/app/components/Logo"
import AccountMenu from "@/app/components/AccountMenu"
import { useAuthStore } from "@/stores/authStore"

const VendorHeader = () => {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useAuthStore()

  const handleLogout = async () => {
    await logout()
    router.refresh()
    router.push("/")
  }

  const displayName = user ? `${user.name} ${user.surname}`.trim() || user.email : "Vendor"

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
          <AccountMenu
            className="hidden sm:flex"
            displayName={displayName}
            email={user?.email}
            items={[
              {
                label: "Sign Out",
                onClick: handleLogout,
                icon: <LogOut className="w-4 h-4" />,
                variant: "danger",
              },
            ]}
          />
        </div>
      </div>
    </header>
  )
}

export default VendorHeader
