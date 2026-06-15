"use client"

import { ChevronDown, LogOut, Menu, Settings, ShoppingCart, User } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import ThemeToggle from "@/components/theme/ThemeToggle"
import { useAuthStore } from "@/stores/authStore"
import { useCartStore } from "@/stores/cartStore"
import MainSearchbox from "../search/main-searchbox/MainSearchbox"
import AccountMenu from "./AccountMenu"
import Logo from "./Logo"

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

const NAV_LINKS = [
  { href: "/top-deals", label: "Top Deals" },
  { href: "/vendors", label: "Vendors" },
  { href: "/equipment", label: "Equipment" },
  { href: "/lab-services", label: "Lab Services" },
  { href: "/resources", label: "Resources" },
]

const Navbar = ({ initialAuthState }: NavbarProps) => {
  const router = useRouter()
  const cartCount = useCartStore((state) => state.cartCount)
  const { logout, user: storeUser, isAuthenticated: storeIsAuthenticated } = useAuthStore()

  const [mounted, setMounted] = useState(false)
  const headerId = "main-header"

  useEffect(() => {
    setMounted(true)
  }, [])

  const user = mounted ? storeUser : initialAuthState?.user
  const isAuthenticated = mounted ? storeIsAuthenticated : initialAuthState?.isAuthenticated

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
    <header
      id={headerId}
      className="sticky top-0 z-40 border-b border-border-soft/80 bg-background/85 backdrop-blur-xl"
    >
      <div className="app-container mx-auto px-4 sm:px-6 lg:px-8 xl:px-10">
        <div className="flex min-h-20 items-center justify-between gap-6 border-b border-border-soft/80 py-4">
          <Link href="/" className="flex items-center gap-3">
            <Logo />
            <div>
              <span className="block font-display text-[1.75rem] font-semibold leading-none text-text-primary">
                DentyPro
              </span>
              <span className="mt-1 block text-[0.65rem] font-semibold uppercase tracking-[0.28em] text-text-muted">
                Clinical Supply Network
              </span>
            </div>
          </Link>

          <div className="mx-0 hidden flex-1 lg:mx-8 lg:block">
            <MainSearchbox />
          </div>

          <div className="flex items-center gap-4 md:gap-5">
            <ThemeToggle />
            {isAuthenticated && user ? (
              <AccountMenu
                className="hidden md:flex"
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
                className="text-left text-text-secondary transition-colors hover:text-brand"
              >
                <div className="text-[0.65rem] uppercase tracking-[0.18em] text-text-muted">Hello, Sign In</div>
                <div className="flex items-center gap-2 font-semibold">
                  Account &amp; Lists <ChevronDown className="w-4 h-4" />
                </div>
              </button>
            )}

            <Link
              href="/cart"
              className="relative flex items-center gap-2 rounded-full border border-border-soft bg-surface px-4 py-2 text-text-secondary shadow-soft transition-colors hover:text-brand"
            >
              <ShoppingCart className="w-4 h-4" />
              <span className="font-semibold">Cart</span>
              {cartCount > 0 && (
                <span className="absolute -top-2 right-0 flex h-5 w-5 items-center justify-center rounded-full bg-accent-strong text-[10px] font-bold text-accent-foreground">
                  {cartCount}
                </span>
              )}
            </Link>
          </div>
        </div>

        <div className="flex min-h-14 items-center justify-between gap-6 py-3">
          <nav className="hidden flex-wrap items-center gap-7 lg:flex">
            <button
              type="button"
              className="flex items-center font-medium text-text-primary transition-colors hover:text-brand"
            >
              <Menu className="mr-2 w-4 h-4" />
              All Categories
            </button>
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="font-medium text-text-secondary transition-colors hover:text-brand"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <span className="hidden rounded-full border border-border-soft bg-surface-elevated px-3 py-1 text-[0.6875rem] font-semibold uppercase tracking-[0.24em] text-text-muted md:inline-flex">
              Verified vendors nationwide
            </span>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Navbar
