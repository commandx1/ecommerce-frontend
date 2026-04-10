import type { LucideIcon } from "lucide-react"
import {
  CheckCircle,
  Clock,
  CreditCard,
  FileText,
  HeadphonesIcon,
  Heart,
  HelpCircle,
  Home,
  MapPin,
  Plus,
  RotateCcw,
  Search,
  ShoppingBag,
  Star,
  Store,
  TrendingUp,
  Truck,
  User,
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface NavItem {
  href: string
  label: string
  icon: LucideIcon
  badge?: {
    label: string
    tone: "neutral" | "warning" | "info"
  }
}

const NAV_GROUPS: Array<{ title: string; items: NavItem[] }> = [
  {
    title: "Dashboard",
    items: [
      { href: "/buyer-dashboard", label: "Overview", icon: Home },
      { href: "/buyer-dashboard/analytics", label: "Analytics", icon: TrendingUp },
    ],
  },
  {
    title: "Orders",
    items: [
      {
        href: "/buyer-dashboard/orders",
        label: "All Orders",
        icon: ShoppingBag,
        badge: { label: "24", tone: "neutral" },
      },
      {
        href: "/buyer-dashboard/orders/pending",
        label: "Pending",
        icon: Clock,
        badge: { label: "3", tone: "warning" },
      },
      {
        href: "/buyer-dashboard/orders/transit",
        label: "In Transit",
        icon: Truck,
        badge: { label: "7", tone: "info" },
      },
      { href: "/buyer-dashboard/orders/completed", label: "Completed", icon: CheckCircle },
    ],
  },
  {
    title: "Suppliers",
    items: [
      {
        href: "/buyer-dashboard/suppliers/favorites",
        label: "Favorites",
        icon: Heart,
        badge: { label: "12", tone: "neutral" },
      },
      { href: "/buyer-dashboard/suppliers", label: "All Suppliers", icon: Store },
      { href: "/buyer-dashboard/suppliers/top-rated", label: "Top Rated", icon: Star },
    ],
  },
  {
    title: "Account",
    items: [
      { href: "/buyer-dashboard/invoices", label: "Invoices", icon: FileText },
      { href: "/buyer-dashboard/payment-methods", label: "Payment Methods", icon: CreditCard },
    ],
  },
  {
    title: "Support",
    items: [
      { href: "/buyer-dashboard/help", label: "Help Center", icon: HelpCircle },
      { href: "/buyer-dashboard/support", label: "Contact Support", icon: HeadphonesIcon },
    ],
  },
]

const SETTINGS_ITEMS: NavItem[] = [
  { href: "/buyer-dashboard/settings", label: "Account", icon: User },
  { href: "/buyer-dashboard/settings/addresses", label: "Addresses", icon: MapPin },
]

const navItemClass = (active: boolean) =>
  cn(
    "flex items-center rounded-lg px-3 py-2 text-sm transition-colors",
    active ? "bg-brand/10 text-brand" : "text-text-secondary hover:bg-surface-muted hover:text-text-primary",
  )

const iconClass = (active: boolean) => cn("mr-3 h-4 w-4", active ? "text-brand" : "text-text-muted")

const badgeClassMap = {
  neutral: "bg-surface-muted text-text-secondary",
  warning: "bg-warning/20 text-warning",
  info: "bg-brand/15 text-brand",
} as const

const DashboardSidebar = () => {
  const pathname = usePathname()

  return (
    <aside
      id="sidebar"
      style={{ flex: "0 0 256px" }}
      className="sticky top-16 z-40 h-[calc(100vh-4rem)] overflow-y-auto border-r border-border-soft bg-surface-elevated shadow-soft"
    >
      <div className="p-6">
        <div className="mb-6 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-text-primary">Quick Actions</h3>
          <Button type="button" variant="quiet" size="icon-sm" className="text-text-muted hover:text-brand">
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        <div className="mb-8 space-y-3">
          <Button
            type="button"
            variant="unstyled"
            className="flex w-full items-center rounded-lg bg-brand px-4 py-3 font-medium text-primary-foreground transition-colors hover:bg-brand-strong"
          >
            <Plus className="mr-2 h-4 w-4" />
            New Order
          </Button>
          <Button
            type="button"
            variant="unstyled"
            className="flex w-full items-center rounded-lg bg-accent-strong px-4 py-3 font-medium text-accent-foreground transition-colors hover:brightness-95"
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            Reorder Items
          </Button>
          <Button
            type="button"
            variant="unstyled"
            className="flex w-full items-center rounded-lg border border-border-strong bg-surface px-4 py-3 font-medium text-text-primary transition-colors hover:border-brand/40 hover:text-brand"
          >
            <Search className="mr-2 h-4 w-4" />
            Find Suppliers
          </Button>
        </div>

        <nav className="space-y-2">
          {NAV_GROUPS.map((group, groupIndex) => (
            <div
              key={group.title}
              className={cn(groupIndex === NAV_GROUPS.length - 1 ? "py-2" : "border-b border-border-soft py-2")}
            >
              <h4 className="mb-3 text-sm font-medium uppercase tracking-wider text-text-muted">{group.title}</h4>
              <div className="space-y-1">
                {group.items.map((item) => {
                  const isActive = pathname === item.href
                  const Icon = item.icon

                  return (
                    <Link key={item.href} href={item.href} className={navItemClass(isActive)}>
                      <Icon className={iconClass(isActive)} />
                      <span>{item.label}</span>
                      {item.badge ? (
                        <span className={cn("ml-auto rounded-full px-2 py-1 text-xs", badgeClassMap[item.badge.tone])}>
                          {item.badge.label}
                        </span>
                      ) : null}
                    </Link>
                  )
                })}
              </div>

              {group.title === "Account" ? (
                <div className="mt-4">
                  <h5 className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-wider text-text-muted">
                    Settings
                  </h5>
                  <div className="space-y-1">
                    {SETTINGS_ITEMS.map((item) => {
                      const isActive = pathname === item.href
                      const Icon = item.icon
                      return (
                        <Link key={item.href} href={item.href} className={navItemClass(isActive)}>
                          <Icon className={iconClass(isActive)} />
                          <span>{item.label}</span>
                        </Link>
                      )
                    })}
                  </div>
                </div>
              ) : null}
            </div>
          ))}
        </nav>
      </div>
    </aside>
  )
}

export default DashboardSidebar
