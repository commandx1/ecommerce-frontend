"use client"

import { LogOut } from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useId } from "react"
import ThemeToggle from "@/components/theme/ThemeToggle"
import { cn } from "@/lib/utils"
import { useAuthStore } from "@/stores/authStore"
import AccountMenu from "./AccountMenu"
import Logo from "./Logo"

export type DashboardHeaderNavItem = {
  href: string
  label: string
  match?: string
  matchMode?: "exact" | "startsWith"
}

interface DashboardHeaderProps {
  navItems: DashboardHeaderNavItem[]
  accountFallbackName?: string
  accountMenuClassName?: string
}

export default function DashboardHeader({
  navItems,
  accountFallbackName = "Account",
  accountMenuClassName,
}: DashboardHeaderProps) {
  const headerId = useId()
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useAuthStore()

  const displayName = user ? `${user.name} ${user.surname}`.trim() || user.email : accountFallbackName

  const handleLogout = async () => {
    await logout()
    router.refresh()
    router.push("/")
  }

  const isNavItemActive = (item: DashboardHeaderNavItem): boolean => {
    const matchPath = item.match ?? item.href
    if (item.matchMode === "startsWith") {
      return pathname?.startsWith(matchPath) ?? false
    }

    return pathname === matchPath
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

            <nav className="hidden space-x-8 md:flex">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "border-b-2 pb-1 font-medium transition-colors",
                    isNavItemActive(item)
                      ? "border-brand text-brand"
                      : "border-transparent text-text-secondary hover:text-text-primary",
                  )}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <AccountMenu
              className={accountMenuClassName}
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
