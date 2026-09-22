"use client"

import { LogOut, Menu, Settings, ShoppingCart, User, X } from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import ThemeToggle from "@/components/theme/ThemeToggle"
import { LiquidGlass, useLensFollow } from "@/components/ui/liquid-glass"
import { cn } from "@/lib/utils"
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

// Only routes that exist. Top Deals, Equipment, Lab Services and Resources were listed here
// with no `src/app` route, no rewrite and no proxy entry behind them, so four of the five items
// in the site's main navigation 404'd on click. Re-add each one WITH its page, not before.
const NAV_LINKS = [{ href: "/vendors", label: "Vendors" }]

const Navbar = ({ initialAuthState }: NavbarProps) => {
  const router = useRouter()
  const pathname = usePathname()
  const cartCount = useCartStore((state) => state.cartCount)
  const logout = useAuthStore((s) => s.logout)
  const storeUser = useAuthStore((s) => s.user)
  const storeIsAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const lens = useLensFollow<HTMLElement>()

  const [mounted, setMounted] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const headerId = "main-header"
  const mobileMenuId = "main-navbar-mobile-menu"

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
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

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`)

  const navLinkClass =
    "relative z-10 inline-flex h-9 items-center rounded-full px-3.5 text-sm font-medium text-text-secondary transition-colors duration-200 hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand cursor-pointer"

  return (
    <header id={headerId} className="pointer-events-none sticky top-0 z-40">
      <div className="app-container mx-auto px-3 pt-3 pb-2 sm:px-4 lg:px-8 xl:px-10">
        <div
          data-scrolled={scrolled}
          className="group/capsule pointer-events-auto relative isolate flex h-14 items-center gap-2 rounded-full px-2.5 sm:gap-3 sm:px-3 lg:h-16 lg:gap-5 lg:px-4"
        >
          <div
            aria-hidden
            className="absolute inset-0 -z-10 rounded-full border border-border-soft bg-surface-elevated/40 backdrop-blur-xl shadow-[inset_0_1px_0_rgba(255,255,255,0.6)] transition-[background-color,box-shadow] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] group-data-[scrolled=true]/capsule:shadow-floating"
          />

          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-expanded={mobileMenuOpen}
            aria-controls={mobileMenuId}
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full text-text-secondary transition-colors hover:bg-surface-muted hover:text-brand lg:hidden"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <Link href="/" className="flex min-w-0 items-center gap-2 sm:gap-3">
            <Logo />
            <span className="truncate font-display text-lg font-semibold leading-none text-text-primary lg:text-xl">
              DentyPro
            </span>
          </Link>

          <nav ref={lens.frameRef} aria-label="Main" className="relative hidden items-center gap-1 lg:flex">
            <LiquidGlass bounds={lens.bounds} visible={lens.active} className="z-0" />
            <Link
              href="/categories"
              aria-current={isActive("/categories") ? "page" : undefined}
              className={cn(navLinkClass, isActive("/categories") && "text-brand")}
              {...lens.itemProps}
            >
              <Menu className="mr-2 w-4 h-4" />
              All Categories
            </Link>
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                aria-current={isActive(link.href) ? "page" : undefined}
                className={cn(navLinkClass, isActive(link.href) && "text-brand")}
                {...lens.itemProps}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="hidden min-w-0 flex-1 lg:block">
            <MainSearchbox />
          </div>

          <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-2 lg:gap-3">
            <ThemeToggle />

            <Link
              href="/cart"
              aria-label="Cart"
              className="relative flex h-10 cursor-pointer items-center gap-2 rounded-full px-3 text-text-secondary transition-colors duration-200 hover:bg-surface-muted hover:text-brand"
            >
              <ShoppingCart className="w-4 h-4" />
              <span className="hidden font-semibold xl:inline">Cart</span>
              {cartCount > 0 && (
                <span className="absolute -top-2 right-0 flex h-5 w-5 items-center justify-center rounded-full bg-accent-strong text-[10px] font-bold text-accent-foreground">
                  {cartCount}
                </span>
              )}
            </Link>

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
                aria-label="Sign In"
                onClick={() => router.push("/login")}
                className="flex h-10 cursor-pointer items-center justify-center gap-2 rounded-full bg-brand px-3 text-sm font-semibold text-inverse-foreground transition-colors duration-200 hover:bg-brand/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 sm:px-5"
              >
                <User className="h-4 w-4 sm:hidden" />
                <span className="hidden sm:inline">Sign In</span>
              </button>
            )}
          </div>
        </div>

        <div className="pointer-events-auto mt-2 lg:hidden">
          <MainSearchbox />
        </div>

        <div
          id={mobileMenuId}
          className={cn(
            "pointer-events-auto overflow-hidden rounded-2xl border bg-surface-elevated/90 backdrop-blur-xl transition-[max-height,opacity] duration-300 lg:hidden",
            mobileMenuOpen
              ? "mt-2 max-h-144 border-border-soft opacity-100 shadow-panel"
              : "max-h-0 border-transparent opacity-0",
          )}
          inert={!mobileMenuOpen}
        >
          <nav aria-label="Mobile" className="app-container mx-auto flex flex-col gap-1 px-3 py-4 sm:px-6">
            <Link
              href="/categories"
              onClick={closeMobileMenu}
              aria-current={isActive("/categories") ? "page" : undefined}
              className={cn(
                "flex items-center rounded-xl px-3 py-2.5 font-medium text-text-primary transition-colors hover:bg-surface-muted hover:text-brand",
                isActive("/categories") && "text-brand",
              )}
            >
              <Menu className="mr-3 w-4 h-4" />
              All Categories
            </Link>
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={closeMobileMenu}
                aria-current={isActive(link.href) ? "page" : undefined}
                className={cn(
                  "rounded-xl px-3 py-2.5 font-medium text-text-secondary transition-colors hover:bg-surface-muted hover:text-brand",
                  isActive(link.href) && "text-brand",
                )}
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
                  className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-left font-medium text-text-secondary transition-colors hover:bg-surface-muted hover:text-brand"
                >
                  <User className="w-4 h-4" /> Dashboard
                </button>
                <button
                  type="button"
                  onClick={() => {
                    router.push("/buyer-dashboard/settings")
                    closeMobileMenu()
                  }}
                  className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-left font-medium text-text-secondary transition-colors hover:bg-surface-muted hover:text-brand"
                >
                  <Settings className="w-4 h-4" /> Settings
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleLogout()
                    closeMobileMenu()
                  }}
                  className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-left font-medium text-danger transition-colors hover:bg-danger/10"
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
                className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-left font-semibold text-text-primary transition-colors hover:bg-surface-muted hover:text-brand"
              >
                <User className="w-4 h-4" /> Sign In
              </button>
            )}
          </nav>
        </div>
      </div>
    </header>
  )
}

export default Navbar
