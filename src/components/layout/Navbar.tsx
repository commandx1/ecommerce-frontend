"use client"

import { ChevronDown, LogOut, Menu, Settings, ShoppingCart, User, X } from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useId, useState } from "react"
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
  const pathname = usePathname()
  const cartCount = useCartStore((state) => state.cartCount)
  const { logout, user: storeUser, isAuthenticated: storeIsAuthenticated } = useAuthStore()

  const [mounted, setMounted] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const headerId = "main-header"
  const mobileMenuId = useId()

  useEffect(() => {
    setMounted(true)
  }, [])

  // biome-ignore lint/correctness/useExhaustiveDependencies: intentionally re-runs only when the route changes
  useEffect(() => {
    setMobileMenuOpen(false)
  }, [pathname])

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

  const closeMobileMenu = () => setMobileMenuOpen(false)

  return (
    <header
      id={headerId}
      className="sticky top-0 z-40 border-b border-border-soft/80 bg-background/85 backdrop-blur-xl"
    >
      <div className="app-container mx-auto px-3 sm:px-6 lg:px-8 xl:px-10">
        <div className="flex min-h-16 items-center justify-between gap-2 border-b border-border-soft/80 py-3 sm:min-h-18 sm:gap-4 sm:py-4 lg:min-h-20 lg:gap-6">
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-expanded={mobileMenuOpen}
              aria-controls={mobileMenuId}
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border-soft bg-surface text-text-secondary transition-colors hover:text-brand lg:hidden"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <Link href="/" className="flex min-w-0 items-center gap-2 sm:gap-3">
              <Logo />
              <div className="min-w-0">
                <span className="block truncate font-display text-lg font-semibold leading-none text-text-primary sm:text-xl lg:text-[1.75rem]">
                  DentyPro
                </span>
                <span className="mt-1 hidden text-[0.6rem] font-semibold uppercase tracking-[0.22em] text-text-muted sm:block lg:text-[0.65rem] lg:tracking-[0.28em]">
                  Clinical Supply Network
                </span>
              </div>
            </Link>
          </div>

          <div className="mx-0 hidden flex-1 lg:mx-8 lg:block">
            <MainSearchbox />
          </div>

          <div className="flex shrink-0 items-center gap-1.5 sm:gap-3 md:gap-5">
            <ThemeToggle />
            {isAuthenticated && user ? (
              <AccountMenu
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
                className="flex items-center gap-2 text-left text-text-secondary transition-colors hover:text-brand"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-full border border-border-soft bg-surface sm:hidden">
                  <User className="w-4 h-4" />
                </span>
                <span className="hidden sm:block">
                  <span className="block text-[0.65rem] uppercase tracking-[0.18em] text-text-muted">
                    Hello, Sign In
                  </span>
                  <span className="flex items-center gap-2 font-semibold">
                    Account &amp; Lists <ChevronDown className="w-4 h-4" />
                  </span>
                </span>
              </button>
            )}

            <Link
              href="/cart"
              aria-label="Cart"
              className="relative flex items-center gap-2 rounded-full border border-border-soft bg-surface px-2.5 py-2 text-text-secondary shadow-soft transition-colors hover:text-brand sm:px-4"
            >
              <ShoppingCart className="w-4 h-4" />
              <span className="hidden font-semibold sm:inline">Cart</span>
              {cartCount > 0 && (
                <span className="absolute -top-2 right-0 flex h-5 w-5 items-center justify-center rounded-full bg-accent-strong text-[10px] font-bold text-accent-foreground">
                  {cartCount}
                </span>
              )}
            </Link>
          </div>
        </div>

        <div className="py-3 lg:hidden">
          <MainSearchbox />
        </div>

        <div className="hidden min-h-14 items-center justify-between gap-6 py-3 lg:flex">
          <nav className="flex flex-wrap items-center gap-7">
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

      <div
        id={mobileMenuId}
        className={`overflow-hidden border-t border-border-soft/80 bg-background/95 backdrop-blur-xl transition-[max-height,opacity] duration-300 ease-in-out lg:hidden ${
          mobileMenuOpen ? "max-h-144 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <nav className="app-container mx-auto flex flex-col gap-1 px-3 py-4 sm:px-6">
          <button
            type="button"
            className="flex items-center rounded-xl px-3 py-2.5 font-medium text-text-primary transition-colors hover:bg-surface-muted hover:text-brand"
          >
            <Menu className="mr-3 w-4 h-4" />
            All Categories
          </button>
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={closeMobileMenu}
              className="rounded-xl px-3 py-2.5 font-medium text-text-secondary transition-colors hover:bg-surface-muted hover:text-brand"
            >
              {link.label}
            </Link>
          ))}

          <div className="my-2 border-t border-border-soft/80" />

          {isAuthenticated && user ? (
            <>
              <button
                type="button"
                onClick={() => {
                  router.push(getDashboardUrl())
                  closeMobileMenu()
                }}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-left font-medium text-text-secondary transition-colors hover:bg-surface-muted hover:text-brand"
              >
                <User className="w-4 h-4" /> Dashboard
              </button>
              <button
                type="button"
                onClick={() => {
                  router.push("/buyer-dashboard/settings")
                  closeMobileMenu()
                }}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-left font-medium text-text-secondary transition-colors hover:bg-surface-muted hover:text-brand"
              >
                <Settings className="w-4 h-4" /> Settings
              </button>
              <button
                type="button"
                onClick={() => {
                  handleLogout()
                  closeMobileMenu()
                }}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-left font-medium text-danger transition-colors hover:bg-danger/10"
              >
                <LogOut className="w-4 h-4" /> Sign Out
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => {
                router.push("/login")
                closeMobileMenu()
              }}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-left font-semibold text-text-primary transition-colors hover:bg-surface-muted hover:text-brand"
            >
              <User className="w-4 h-4" /> Sign In
            </button>
          )}

          <span className="mt-2 inline-flex w-fit rounded-full border border-border-soft bg-surface-elevated px-3 py-1 text-[0.6875rem] font-semibold uppercase tracking-[0.24em] text-text-muted">
            Verified vendors nationwide
          </span>
        </nav>
      </div>
    </header>
  )
}

export default Navbar
