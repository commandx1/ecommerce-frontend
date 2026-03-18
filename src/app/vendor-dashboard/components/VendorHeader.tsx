"use client"

import { LogOut } from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import Logo from "@/app/components/Logo"
import AccountMenu from "@/app/components/AccountMenu"
import { useAuthStore } from "@/stores/authStore"

type NavLinkProps = {
  href: string
  label: string
  isActive: boolean
}

const NavLink = ({ href, label, isActive }: NavLinkProps) => (
  <Link
    href={href}
    className={`${
      isActive
        ? "text-steel-blue font-semibold border-b-2 border-steel-blue"
        : "text-gray-700 hover:text-steel-blue font-medium"
    }`}
  >
    {label}
  </Link>
)

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
              <NavLink href="/vendor-dashboard" label="Dashboard" isActive={pathname === "/vendor-dashboard"} />
              <NavLink
                href="/vendor-dashboard/products"
                label="Products"
                isActive={pathname?.startsWith("/vendor-dashboard/products")}
              />
              <NavLink
                href="/vendor-dashboard/orders"
                label="Orders"
                isActive={pathname?.startsWith("/vendor-dashboard/orders")}
              />
              <NavLink
                href="/vendor-dashboard/analytics"
                label="Analytics"
                isActive={pathname?.startsWith("/vendor-dashboard/analytics")}
              />
              <NavLink
                href="/vendor-dashboard/marketing"
                label="Marketing"
                isActive={pathname?.startsWith("/vendor-dashboard/marketing")}
              />
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
