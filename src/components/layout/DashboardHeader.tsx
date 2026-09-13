"use client"

import { LogOut, Menu, ShoppingCart, X } from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { type ReactNode, useEffect, useId } from "react"
import MainSearchbox from "@/components/search/main-searchbox/MainSearchbox"
import ThemeToggle from "@/components/theme/ThemeToggle"
import { cn } from "@/lib/utils"
import { useAuthStore } from "@/stores/authStore"
import { useCartStore } from "@/stores/cartStore"
import AccountMenu from "./AccountMenu"
import { useDashboardMobileSidebar } from "./DashboardMobileSidebarContext"
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
  showCart?: boolean
  showSearch?: boolean
  notificationBell?: ReactNode
}

export default function DashboardHeader({
  navItems,
  accountFallbackName = "Account",
  accountMenuClassName,
  showCart = false,
  showSearch = false,
  notificationBell,
}: DashboardHeaderProps) {
  const headerId = useId()
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useAuthStore()
  const cartCount = useCartStore((state) => state.cartCount)
  const fetchCart = useCartStore((state) => state.fetchCart)
  const { isOpen: isMobileSidebarOpen, toggle: toggleMobileSidebar } = useDashboardMobileSidebar()

  const displayName = user ? `${user.name} ${user.surname}`.trim() || user.email : accountFallbackName

  useEffect(() => {
    if (!showCart || !user) return
    void fetchCart()
  }, [showCart, user, fetchCart])

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
      <div className="max-w-full px-4 sm:px-6">
        <div className="flex h-16 items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2 sm:gap-3 sm:space-x-8">
            <button
              type="button"
              onClick={toggleMobileSidebar}
              aria-label={isMobileSidebarOpen ? "Close menu" : "Open menu"}
              aria-expanded={isMobileSidebarOpen}
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-text-secondary transition-colors hover:bg-surface-muted hover:text-text-primary md:hidden"
            >
              {isMobileSidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>

            <Link href="/" className="flex min-w-0 items-center">
              <Logo />
              <span className="ml-2 truncate text-lg font-bold text-text-primary sm:ml-3 sm:text-2xl">DentyPro</span>
            </Link>

            {navItems.length > 0 ? (
              <nav className="hidden lg:flex lg:space-x-6 xl:space-x-8">
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
            ) : null}
          </div>

          {showSearch ? (
            <div className="mx-4 hidden min-w-0 flex-1 lg:mx-8 lg:block">
              <MainSearchbox />
            </div>
          ) : null}

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            {showCart ? (
              <Link
                href="/cart"
                className="relative flex items-center gap-2 rounded-full border border-border-soft bg-surface px-2.5 py-2 text-sm text-text-secondary shadow-soft transition-colors hover:text-brand sm:px-3"
              >
                <ShoppingCart className="h-4 w-4" />
                <span className="hidden font-semibold sm:inline">Cart</span>
                {cartCount > 0 ? (
                  <span className="absolute -top-2 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-accent-strong px-1 text-[10px] font-bold text-accent-foreground">
                    {cartCount}
                  </span>
                ) : null}
              </Link>
            ) : null}
            {notificationBell}
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

        {showSearch ? (
          <div className="pb-3 lg:hidden">
            <MainSearchbox />
          </div>
        ) : null}
      </div>
    </header>
  )
}
