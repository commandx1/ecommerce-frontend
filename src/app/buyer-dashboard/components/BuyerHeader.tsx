"use client"

import { LogOut } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import AccountMenu from "@/components/layout/AccountMenu"
import Logo from "@/components/layout/Logo"
import { useAuthStore } from "@/stores/authStore"

const BuyerHeader = () => {
  const router = useRouter()
  const { user, logout } = useAuthStore()

  const displayName = user ? `${user.name} ${user.surname}`.trim() || user.email : "Account"

  const handleLogout = async () => {
    await logout()
    router.refresh()
    router.push("/")
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
          <AccountMenu
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

export default BuyerHeader
