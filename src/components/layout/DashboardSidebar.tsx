"use client"

import { type LucideIcon, PanelLeftClose, PanelLeftOpen, X } from "lucide-react"
import { MotionConfig, motion } from "motion/react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { type ReactNode, useEffect, useId, useState } from "react"
import { useMediaQuery } from "@/hooks/useMediaQuery"
import { cn } from "@/lib/utils"
import { useDashboardMobileSidebar } from "./DashboardMobileSidebarContext"

type SidebarMatchMode = "exact" | "startsWith"
type SidebarItemSize = "default" | "compact"
type SidebarBadgeTone = "neutral" | "warning" | "info" | "success"
type SidebarQuickActionTone = "brand" | "accent" | "surface"
type SidebarGroupVariant = "stacked" | "divided"

export interface DashboardSidebarNavItem {
  href: string
  label: string
  icon: LucideIcon
  match?: string
  matchMode?: SidebarMatchMode
  badge?: {
    label: string
    tone: SidebarBadgeTone
  }
  trailingText?: string
  disabled?: boolean
  size?: SidebarItemSize
}

export interface DashboardSidebarNavSubgroup {
  title: string
  items: DashboardSidebarNavItem[]
}

export interface DashboardSidebarGroup {
  title: string
  items: DashboardSidebarNavItem[]
  subgroups?: DashboardSidebarNavSubgroup[]
  subgroupsFirst?: boolean
}

export interface DashboardSidebarQuickAction {
  label: string
  icon: LucideIcon
  href?: string
  tone?: SidebarQuickActionTone
  disabled?: boolean
}

export interface DashboardSidebarAccount {
  name: string
  email?: string | null
  href: string
  matchMode?: SidebarMatchMode
}

interface DashboardSidebarProps {
  brand: { label: string; icon: LucideIcon }
  footerItems?: DashboardSidebarNavItem[]
  /** Signed-in user shown at the very bottom; links to the account/settings page. */
  account?: DashboardSidebarAccount
  quickActions?: DashboardSidebarQuickAction[]
  quickActionSize?: SidebarItemSize
  groups: DashboardSidebarGroup[]
  groupVariant?: SidebarGroupVariant
  showGroupTitles?: boolean
  defaultItemSize?: SidebarItemSize
}

export const badgeClassMap: Record<SidebarBadgeTone, string> = {
  neutral: "bg-surface-muted text-text-secondary",
  warning: "bg-warning/20 text-warning",
  info: "bg-brand/15 text-brand",
  success: "bg-success/15 text-success",
}

export const quickActionToneClassMap: Record<SidebarQuickActionTone, string> = {
  brand: "bg-brand text-primary-foreground hover:bg-brand-strong",
  accent: "bg-accent-strong text-neutral-800 hover:brightness-95",
  surface: "border border-border-strong bg-surface text-text-primary hover:border-brand/40 hover:text-brand",
}

export const isItemActive = (
  pathname: string | null,
  item: { href: string; match?: string; matchMode?: SidebarMatchMode },
) => {
  const matchPath = item.match ?? item.href
  if (item.matchMode === "startsWith") {
    return pathname?.startsWith(matchPath) ?? false
  }

  return pathname === matchPath
}

const getInitials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase() || "?"

const labelVariants = {
  open: { x: 0, opacity: 1 },
  closed: { x: -20, opacity: 0 },
}

function SidebarLabel({
  expanded,
  className,
  children,
}: {
  expanded: boolean
  className?: string
  children: ReactNode
}) {
  return (
    <motion.span
      variants={labelVariants}
      className={cn("truncate whitespace-nowrap", !expanded ? "md:sr-only" : "", className)}
    >
      {children}
    </motion.span>
  )
}

const SidebarNavItem = ({
  item,
  active,
  defaultItemSize,
  expanded,
  onNavigate,
}: {
  item: DashboardSidebarNavItem
  active: boolean
  defaultItemSize: SidebarItemSize
  expanded: boolean
  onNavigate: () => void
}) => {
  const Icon = item.icon
  // itemSize is currently plumbed through for API compatibility; the rail design uses one row size.
  const _itemSize = item.size ?? defaultItemSize

  return (
    <Link
      href={item.href}
      title={expanded ? undefined : item.label}
      onClick={onNavigate}
      className={cn(
        "flex h-8 w-full items-center rounded-md px-2 py-1.5 text-sm font-medium transition",
        !expanded ? "md:justify-center" : "",
        active
          ? "bg-brand/10 text-brand"
          : "text-text-secondary hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
        item.disabled ? "pointer-events-none opacity-50" : "",
      )}
    >
      <Icon className={cn("h-4 w-4 shrink-0", active ? "text-brand" : "text-text-muted")} />
      <SidebarLabel expanded={expanded} className="ml-2">
        {item.label}
      </SidebarLabel>
      {item.trailingText ? (
        <span className={cn("ml-auto text-xs text-text-muted", !expanded ? "md:hidden" : "")}>{item.trailingText}</span>
      ) : null}
      {item.badge ? (
        <span
          className={cn(
            "ml-auto rounded-full px-2 py-0.5 text-xs",
            badgeClassMap[item.badge.tone],
            !expanded ? "md:hidden" : "",
          )}
        >
          {item.badge.label}
        </span>
      ) : null}
    </Link>
  )
}

export default function DashboardSidebar({
  brand,
  footerItems,
  account,
  quickActions,
  // Kept for API compatibility; the rail design uses one row size for quick actions.
  quickActionSize: _quickActionSize = "default",
  groups,
  groupVariant = "stacked",
  showGroupTitles = true,
  defaultItemSize = "default",
}: DashboardSidebarProps) {
  const sidebarId = useId()
  const pathname = usePathname()
  const { isOpen: isMobileOpen, close: closeMobile } = useDashboardMobileSidebar()

  const isDesktop = useMediaQuery("(min-width: 768px)")
  const canHover = useMediaQuery("(hover: hover)")
  const [hovered, setHovered] = useState(false)
  // Touch-only md+ devices (tablets) cannot hover, so they get an explicit toggle instead.
  const [pinned, setPinned] = useState(false)
  const showToggle = isDesktop && !canHover
  const expanded = !isDesktop || hovered || pinned

  const handleNavigate = () => {
    closeMobile()
    setPinned(false)
  }

  // Close the mobile drawer whenever the route changes
  useEffect(() => {
    closeMobile()
  }, [pathname, closeMobile])

  useEffect(() => {
    if (!isMobileOpen) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeMobile()
    }

    document.addEventListener("keydown", handleKeyDown)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"

    return () => {
      document.removeEventListener("keydown", handleKeyDown)
      document.body.style.overflow = previousOverflow
    }
  }, [isMobileOpen, closeMobile])

  const renderSubgroups = (subgroups: DashboardSidebarNavSubgroup[]) => {
    return subgroups.map((subgroup) => (
      <div key={subgroup.title} className="mt-2">
        {showGroupTitles ? (
          <h5
            className={cn(
              "mb-1 px-2 text-[10px] font-semibold uppercase tracking-wider text-text-muted",
              !expanded ? "md:hidden" : "",
            )}
          >
            {subgroup.title}
          </h5>
        ) : null}
        <div className="flex flex-col gap-1">
          {subgroup.items.map((item) => (
            <SidebarNavItem
              key={item.href}
              item={item}
              active={isItemActive(pathname, item)}
              defaultItemSize={defaultItemSize}
              expanded={expanded}
              onNavigate={handleNavigate}
            />
          ))}
        </div>
      </div>
    ))
  }

  const BrandIcon = brand.icon

  return (
    <>
      {isMobileOpen ? (
        <button
          type="button"
          aria-label="Close menu overlay"
          onClick={closeMobile}
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
        />
      ) : null}

      <aside
        id={sidebarId}
        role="dialog"
        aria-modal={isMobileOpen}
        data-state={expanded ? "expanded" : "collapsed"}
        className={cn(
          "fixed inset-y-0 left-0 z-50 h-full w-72 shrink-0 transition-transform duration-200",
          isMobileOpen ? "translate-x-0" : "-translate-x-full",
          "md:sticky md:top-16 md:z-40 md:h-[calc(100vh-4rem)] md:w-[3.05rem] md:translate-x-0 md:overflow-visible md:transition-none",
        )}
      >
        <MotionConfig reducedMotion="user">
          <motion.div
            data-testid="dashboard-sidebar-panel"
            className={cn(
              "flex h-full w-full flex-col overflow-hidden border-r border-sidebar-border bg-sidebar text-text-secondary",
              "md:absolute md:inset-y-0 md:left-0",
              isDesktop && expanded ? "md:shadow-floating" : "",
            )}
            initial={false}
            variants={
              isDesktop
                ? {
                    open: { width: "15rem" },
                    closed: { width: "3.05rem" },
                  }
                : undefined
            }
            animate={expanded ? "open" : "closed"}
            transition={{ type: "tween", ease: "easeOut", duration: 0.2 }}
            onPointerEnter={(e: React.PointerEvent) => {
              if (e.pointerType === "mouse") setHovered(true)
            }}
            onPointerLeave={() => setHovered(false)}
            onFocus={(e: React.FocusEvent) => {
              // Only keyboard focus (:focus-visible) opens the rail. Focus that follows a mouse click or a
              // touch tap must not, otherwise a tap on the toggle would keep the panel open forever.
              let keyboardFocus = true
              try {
                keyboardFocus = (e.target as HTMLElement).matches(":focus-visible")
              } catch {
                // jsdom may not support :focus-visible - treat as keyboard focus
              }
              if (keyboardFocus) setHovered(true)
            }}
            onBlur={(e: React.FocusEvent) => {
              if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setHovered(false)
            }}
          >
            <div className="flex items-center justify-between px-2 py-3 md:hidden">
              <span className="text-lg font-semibold text-text-primary">Menu</span>
              <button
                type="button"
                onClick={closeMobile}
                aria-label="Close menu"
                className="inline-flex h-8 w-8 items-center justify-center rounded-md text-text-muted transition-colors hover:bg-sidebar-accent hover:text-brand"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex h-[54px] shrink-0 items-center border-b border-sidebar-border px-2">
              <div className="flex items-center gap-2 px-2">
                <BrandIcon className="h-4 w-4 shrink-0 text-brand" />
                <SidebarLabel expanded={expanded} className="text-sm font-medium text-text-primary">
                  {brand.label}
                </SidebarLabel>
              </div>
            </div>

            {showToggle ? (
              <div className="hidden border-b border-sidebar-border p-2 md:block">
                <button
                  type="button"
                  onClick={() => setPinned((previous) => !previous)}
                  aria-expanded={pinned}
                  aria-label={pinned ? "Collapse sidebar" : "Expand sidebar"}
                  className={cn(
                    "flex h-8 w-full items-center rounded-md px-2 py-1.5 text-sm font-medium text-text-secondary transition hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                    !expanded ? "md:justify-center" : "",
                  )}
                >
                  {pinned ? (
                    <PanelLeftClose className="h-4 w-4 shrink-0 text-text-muted" />
                  ) : (
                    <PanelLeftOpen className="h-4 w-4 shrink-0 text-text-muted" />
                  )}
                  <SidebarLabel expanded={expanded} className="ml-2">
                    Collapse menu
                  </SidebarLabel>
                </button>
              </div>
            ) : null}

            {quickActions?.length ? (
              <div className="flex flex-col gap-1 border-b border-sidebar-border p-2">
                {quickActions.map((action) => {
                  const Icon = action.icon
                  const tone = action.tone ?? "brand"
                  const actionClassName = cn(
                    "flex h-8 w-full items-center rounded-md px-2 py-1.5 text-sm font-medium transition",
                    quickActionToneClassMap[tone],
                    action.disabled ? "pointer-events-none opacity-50" : "",
                    !expanded ? "md:justify-center" : "",
                  )

                  if (action.href) {
                    return (
                      <Link
                        key={action.label}
                        href={action.href}
                        title={expanded ? undefined : action.label}
                        onClick={handleNavigate}
                        className={actionClassName}
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        <SidebarLabel expanded={expanded} className="ml-2">
                          {action.label}
                        </SidebarLabel>
                      </Link>
                    )
                  }

                  return (
                    <button
                      key={action.label}
                      type="button"
                      title={expanded ? undefined : action.label}
                      className={actionClassName}
                      disabled={action.disabled}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <SidebarLabel expanded={expanded} className="ml-2">
                        {action.label}
                      </SidebarLabel>
                    </button>
                  )
                })}
              </div>
            ) : null}

            <motion.nav
              className="flex grow flex-col gap-1 overflow-y-auto p-2"
              variants={{ open: { transition: { staggerChildren: 0.03, delayChildren: 0.02 } } }}
            >
              {groups.map((group, groupIndex) => (
                <div key={group.title}>
                  {groupVariant === "divided" && groupIndex > 0 ? (
                    <div className="my-1 h-px bg-sidebar-border" />
                  ) : null}
                  <div className={cn(groupVariant === "stacked" && groupIndex > 0 ? "mt-2" : "")}>
                    {showGroupTitles ? (
                      <h4
                        className={cn(
                          "mb-1 px-2 text-[10px] font-semibold uppercase tracking-wider text-text-muted",
                          !expanded ? "md:hidden" : "",
                        )}
                      >
                        {group.title}
                      </h4>
                    ) : null}

                    {group.subgroupsFirst && group.subgroups ? renderSubgroups(group.subgroups) : null}

                    <div className="flex flex-col gap-1">
                      {group.items.map((item) => (
                        <SidebarNavItem
                          key={item.href}
                          item={item}
                          active={isItemActive(pathname, item)}
                          defaultItemSize={defaultItemSize}
                          expanded={expanded}
                          onNavigate={handleNavigate}
                        />
                      ))}
                    </div>

                    {!group.subgroupsFirst && group.subgroups ? renderSubgroups(group.subgroups) : null}
                  </div>
                </div>
              ))}
            </motion.nav>

            {footerItems?.length ? (
              <div className="flex flex-col gap-1 border-t border-sidebar-border p-2">
                {footerItems.map((item) => (
                  <SidebarNavItem
                    key={item.href}
                    item={item}
                    active={isItemActive(pathname, item)}
                    defaultItemSize={defaultItemSize}
                    expanded={expanded}
                    onNavigate={handleNavigate}
                  />
                ))}
              </div>
            ) : null}

            {account ? (
              <div className="border-t border-sidebar-border p-2">
                <Link
                  href={account.href}
                  title={expanded ? undefined : account.name}
                  onClick={handleNavigate}
                  className={cn(
                    "flex h-10 w-full items-center rounded-md px-2 py-1.5 transition",
                    !expanded ? "md:justify-center" : "",
                    isItemActive(pathname, account)
                      ? "bg-brand/10 text-brand"
                      : "text-text-secondary hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                  )}
                >
                  <span
                    aria-hidden="true"
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand text-[10px] font-semibold text-primary-foreground"
                  >
                    {getInitials(account.name)}
                  </span>
                  <SidebarLabel expanded={expanded} className="ml-2 flex min-w-0 flex-col leading-tight">
                    <span className="truncate text-sm font-medium text-text-primary">{account.name}</span>
                    {account.email ? <span className="truncate text-xs text-text-muted">{account.email}</span> : null}
                  </SidebarLabel>
                </Link>
              </div>
            ) : null}
          </motion.div>
        </MotionConfig>
      </aside>
    </>
  )
}
