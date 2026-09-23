"use client"

import { LogOut, Menu, Settings, ShoppingCart, User, X } from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import ThemeToggle from "@/components/theme/ThemeToggle"
import { GlassMorphMenu } from "@/components/ui/glass-morph-menu"
import { glassDarkTintClass, LiquidGlass } from "@/components/ui/liquid-glass"
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

// Pills sit on the already-blurred capsule, so they keep only the tint + rim glow (::before). Their own
// backdrop layer (::after) added nothing visible and six nested backdrop-filters halved scroll FPS.
const GlassPill = ({ className, children }: { className?: string; children: React.ReactNode }) => (
  <div className={cn("relative isolate flex shrink-0 items-center rounded-full", className)}>
    <LiquidGlass
      borderRadius={9999}
      className={cn("-z-10 after:hidden [&>[data-lg-rim]]:hidden!", glassDarkTintClass)}
    />
    {children}
  </div>
)

const Navbar = ({ initialAuthState }: NavbarProps) => {
  const router = useRouter()
  const pathname = usePathname()
  const cartCount = useCartStore((state) => state.cartCount)
  const logout = useAuthStore((s) => s.logout)
  const storeUser = useAuthStore((s) => s.user)
  const storeIsAuthenticated = useAuthStore((s) => s.isAuthenticated)

  const [mounted, setMounted] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const headerId = "main-header"

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

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`)

  const navLinkClass =
    "relative z-10 inline-flex h-10 items-center rounded-full px-3.5 text-sm font-medium text-text-secondary transition-colors duration-200 hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand cursor-pointer"

  return (
    <header id={headerId} className="pointer-events-none sticky top-0 z-40">
      <div className="app-container mx-auto px-3 pt-3 pb-2 sm:px-4 lg:px-8 xl:px-10">
        <div
          data-scrolled={scrolled}
          className="group/capsule pointer-events-auto relative isolate z-10 flex flex-col gap-2 px-2.5 py-2 sm:px-3 lg:h-16 lg:flex-row lg:items-center lg:gap-5 lg:px-4 lg:py-0"
        >
          {/* 32px: a full pill on the 64px desktop row, soft corners on the two-row mobile capsule. */}
          <LiquidGlass
            blur={24}
            edge={999} // whole surface refracts, like the panels
            rimBlur={6}
            borderRadius={32}
            className={cn(
              "-z-10 transition-shadow group-data-[scrolled=true]/capsule:shadow-floating",
              glassDarkTintClass,
            )}
          />

          {/* Row 1 on mobile; `lg:contents` flattens it so desktop stays a single row.
              z-10 keeps the account dropdown above the search row that follows it in the DOM. */}
          <div className="relative z-10 flex items-center gap-2 sm:gap-3 lg:contents">
            <GlassMorphMenu
              className="lg:hidden"
              align="start"
              open={mobileMenuOpen}
              onOpenChange={setMobileMenuOpen}
              trigger={(open) => (open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />)}
              triggerLabel={(open) => (open ? "Close menu" : "Open menu")}
              triggerClassName="w-10 justify-center text-text-secondary transition-colors hover:text-brand"
              panelClassName="w-[min(28rem,calc(100vw-2.75rem))]"
            >
              {(close) => (
                <nav aria-label="Mobile" className="flex flex-col gap-1 px-2 py-2">
                  <Link
                    href="/categories"
                    onClick={close}
                    aria-current={isActive("/categories") ? "page" : undefined}
                    data-menu-item
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
                      onClick={close}
                      aria-current={isActive(link.href) ? "page" : undefined}
                      data-menu-item
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
                        data-menu-item
                        onClick={() => {
                          router.push(getDashboardUrl())
                          close()
                        }}
                        className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-left font-medium text-text-secondary transition-colors hover:bg-surface-muted hover:text-brand"
                      >
                        <User className="w-4 h-4" /> Dashboard
                      </button>
                      <button
                        type="button"
                        data-menu-item
                        onClick={() => {
                          router.push("/buyer-dashboard/settings")
                          close()
                        }}
                        className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-left font-medium text-text-secondary transition-colors hover:bg-surface-muted hover:text-brand"
                      >
                        <Settings className="w-4 h-4" /> Settings
                      </button>
                      <button
                        type="button"
                        data-menu-item
                        onClick={() => {
                          handleLogout()
                          close()
                        }}
                        className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-left font-medium text-danger transition-colors hover:bg-danger/10"
                      >
                        <LogOut className="w-4 h-4" /> Sign Out
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      data-menu-item
                      onClick={() => {
                        router.push("/login")
                        close()
                      }}
                      className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-left font-semibold text-text-primary transition-colors hover:bg-surface-muted hover:text-brand"
                    >
                      <User className="w-4 h-4" /> Sign In
                    </button>
                  )}
                </nav>
              )}
            </GlassMorphMenu>

            <Link href="/" aria-label="DentyPro home" className="flex shrink-0 items-center">
              <Logo />
            </Link>

            <nav aria-label="Main" className="relative hidden items-center gap-1.5 lg:flex">
              <GlassPill>
                <Link
                  href="/categories"
                  aria-current={isActive("/categories") ? "page" : undefined}
                  className={cn(navLinkClass, isActive("/categories") && "text-brand")}
                >
                  <Menu className="mr-2 w-4 h-4" />
                  All Categories
                </Link>
              </GlassPill>
              {NAV_LINKS.map((link) => (
                <GlassPill key={link.href}>
                  <Link
                    href={link.href}
                    aria-current={isActive(link.href) ? "page" : undefined}
                    className={cn(navLinkClass, isActive(link.href) && "text-brand")}
                  >
                    {link.label}
                  </Link>
                </GlassPill>
              ))}
            </nav>

            <MainSearchbox className="hidden min-w-0 flex-1 max-w-none lg:block" />

            <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-2 lg:gap-3">
              <GlassPill>
                <ThemeToggle className="h-10 w-10 border-0 bg-transparent shadow-none backdrop-blur-none" />
              </GlassPill>

              <GlassPill>
                <Link
                  href="/cart"
                  aria-label="Cart"
                  className="relative flex h-10 cursor-pointer items-center gap-2 rounded-full px-3 text-text-secondary transition-colors duration-200 hover:text-brand"
                >
                  <ShoppingCart className="w-4 h-4" />
                  <span className="hidden font-semibold xl:inline">Cart</span>
                  {cartCount > 0 && (
                    <span className="absolute -top-2 right-0 flex h-5 w-5 items-center justify-center rounded-full bg-accent-strong text-[10px] font-bold text-accent-foreground">
                      {cartCount}
                    </span>
                  )}
                </Link>
              </GlassPill>

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

          {/* Row 2, mobile only: the search box, inside the same capsule. */}
          <MainSearchbox className="max-w-none lg:hidden" />
        </div>
      </div>
    </header>
  )
}

export default Navbar
