"use client"

import { LogOut } from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useId } from "react"
import AccountMenu from "@/components/layout/AccountMenu"
import Logo from "@/components/layout/Logo"
import ThemeToggle from "@/components/theme/ThemeToggle"
import { cn } from "@/lib/utils"
import { useAuthStore } from "@/stores/authStore"

const BuyerHeader = () => {
  const headerId = useId()
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useAuthStore()

  const displayName = user ? `${user.name} ${user.surname}`.trim() || user.email : "Account"

  const handleLogout = async () => {
    await logout()
    router.refresh()
    router.push("/")
  }

  return (
    <header id={headerId} className="sticky top-0 z-50 border-b border-border-soft bg-surface-elevated shadow-soft">
      <div className="max-w-full px-6">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center space-x-8">
            <Link href="/" className="flex items-center">
              <Logo />
              <span className="ml-3 text-2xl font-bold text-text-primary">DentyPro</span>
            </Link>
            <nav className="hidden space-x-6 md:flex">
              {[
                { href: "/buyer-dashboard", label: "Dashboard", match: "/buyer-dashboard" },
                { href: "/buyer-dashboard/orders", label: "Orders", match: "/buyer-dashboard/orders" },
                { href: "/buyer-dashboard/suppliers", label: "Suppliers", match: "/buyer-dashboard/suppliers" },
                { href: "/buyer-dashboard/invoices", label: "Invoices", match: "/buyer-dashboard/invoices" },
                { href: "/buyer-dashboard/reports", label: "Reports", match: "/buyer-dashboard/reports" },
              ].map((item) => {
                const isActive = pathname === item.match
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "border-b-2 pb-1 font-medium transition-colors",
                      isActive
                        ? "border-brand text-brand"
                        : "border-transparent text-text-secondary hover:text-text-primary",
                    )}
                  >
                    {item.label}
                  </Link>
                )
              })}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
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
      </div>
    </header>
  )
}

export default BuyerHeader
