"use client"

import { type LucideIcon, PanelLeftClose, PanelLeftOpen, X } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { type ReactNode, useEffect, useId, useState } from "react"
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

interface DashboardSidebarProps {
  collapseStorageKey?: string
  quickActions?: DashboardSidebarQuickAction[]
  quickActionsTitle?: string
  quickActionsTrailing?: ReactNode
  quickActionSize?: SidebarItemSize
  groups: DashboardSidebarGroup[]
  groupVariant?: SidebarGroupVariant
  showGroupTitles?: boolean
  defaultItemSize?: SidebarItemSize
  isCollapsed?: boolean
  onToggleCollapse?: () => void
  collapseButtonLabel?: string
  defaultCollapsed?: boolean
}

const badgeClassMap: Record<SidebarBadgeTone, string> = {
  neutral: "bg-surface-muted text-text-secondary",
  warning: "bg-warning/20 text-warning",
  info: "bg-brand/15 text-brand",
  success: "bg-success/15 text-success",
}

const quickActionToneClassMap: Record<SidebarQuickActionTone, string> = {
  brand: "bg-brand text-primary-foreground hover:bg-brand-strong",
  accent: "bg-accent-strong text-neutral-800 hover:brightness-95",
  surface: "border border-border-strong bg-surface text-text-primary hover:border-brand/40 hover:text-brand",
}

const isItemActive = (
  pathname: string | null,
  item: { href: string; match?: string; matchMode?: SidebarMatchMode },
) => {
  const matchPath = item.match ?? item.href
  if (item.matchMode === "startsWith") {
    return pathname?.startsWith(matchPath) ?? false
  }

  return pathname === matchPath
}

const SidebarNavItem = ({
  item,
  active,
  defaultItemSize,
  collapsed,
}: {
  item: DashboardSidebarNavItem
  active: boolean
  defaultItemSize: SidebarItemSize
  collapsed: boolean
}) => {
  const { close } = useDashboardMobileSidebar()
  const Icon = item.icon
  const itemSize = item.size ?? defaultItemSize
  const isCompact = itemSize === "compact"

  return (
    <Link
      href={item.href}
      title={collapsed ? item.label : undefined}
      onClick={close}
      className={cn(
        "flex items-center rounded-lg transition-colors",
        isCompact ? "px-3 py-2 text-sm" : "px-3 py-2 text-base",
        collapsed ? "md:justify-center md:px-2" : "",
        active
          ? "bg-brand/10 font-medium text-brand"
          : "text-text-secondary hover:bg-surface-muted hover:text-text-primary",
        item.disabled ? "pointer-events-none opacity-50" : "",
      )}
    >
      <Icon
        className={cn(
          "mr-3",
          collapsed ? "md:mr-0" : "",
          isCompact ? "h-4 w-4" : "h-5 w-5",
          active ? "text-brand" : "text-text-muted",
        )}
      />
      <span className={collapsed ? "md:sr-only" : undefined}>{item.label}</span>
      {item.trailingText ? (
        <span className={cn("ml-auto text-sm text-text-muted", collapsed ? "md:hidden" : "")}>{item.trailingText}</span>
      ) : null}
      {item.badge ? (
        <span
          className={cn(
            "ml-auto rounded-full px-2 py-1 text-xs",
            badgeClassMap[item.badge.tone],
            collapsed ? "md:hidden" : "",
          )}
        >
          {item.badge.label}
        </span>
      ) : null}
    </Link>
  )
}

export default function DashboardSidebar({
  collapseStorageKey,
  quickActions,
  quickActionsTitle = "Quick Actions",
  quickActionsTrailing,
  quickActionSize = "default",
  groups,
  groupVariant = "stacked",
  showGroupTitles = true,
  defaultItemSize = "default",
  isCollapsed,
  onToggleCollapse,
  collapseButtonLabel,
  defaultCollapsed = false,
}: DashboardSidebarProps) {
  const sidebarId = useId()
  const pathname = usePathname()
  const [internalCollapsed, setInternalCollapsed] = useState(defaultCollapsed)
  const isControlled = typeof isCollapsed === "boolean"
  const collapsed = isControlled ? isCollapsed : internalCollapsed
  const canToggleCollapse = Boolean(onToggleCollapse || (!isControlled && collapseStorageKey))
  const { isOpen: isMobileOpen, close: closeMobile } = useDashboardMobileSidebar()

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

  useEffect(() => {
    if (isControlled || !collapseStorageKey) return

    try {
      const stored = window.localStorage.getItem(collapseStorageKey)
      if (stored !== null) {
        setInternalCollapsed(stored === "true")
      }
    } catch {
      // Ignore localStorage access errors
    }
  }, [collapseStorageKey, isControlled])

  const toggleCollapse = () => {
    if (onToggleCollapse) {
      onToggleCollapse()
      return
    }

    setInternalCollapsed((previous) => {
      const next = !previous
      if (collapseStorageKey) {
        try {
          window.localStorage.setItem(collapseStorageKey, String(next))
        } catch {
          // Ignore localStorage access errors
        }
      }
      return next
    })
  }

  const resolvedCollapseButtonLabel = collapseButtonLabel ?? (collapsed ? "Expand sidebar" : "Collapse sidebar")

  const renderSubgroups = (subgroups: DashboardSidebarNavSubgroup[]) => {
    return subgroups.map((subgroup) => (
      <div key={subgroup.title} className="mt-4">
        {!collapsed && showGroupTitles ? (
          <h5 className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-wider text-text-muted">
            {subgroup.title}
          </h5>
        ) : null}
        <div className="space-y-1">
          {subgroup.items.map((item) => (
            <SidebarNavItem
              key={item.href}
              item={item}
              active={isItemActive(pathname, item)}
              defaultItemSize={defaultItemSize}
              collapsed={collapsed}
            />
          ))}
        </div>
      </div>
    ))
  }

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
        className={cn(
          "fixed inset-y-0 left-0 z-50 h-full w-72 shrink-0 overflow-y-auto border-r border-border-soft bg-surface-elevated shadow-soft transition-transform duration-200",
          isMobileOpen ? "translate-x-0" : "-translate-x-full",
          "md:sticky md:top-16 md:z-40 md:h-[calc(100vh-4rem)] md:translate-x-0 md:transition-[width] md:duration-200",
          collapsed ? "md:w-16" : "md:w-64",
        )}
      >
        <div className={cn("space-y-6", collapsed ? "p-3" : "p-6")}>
          <div className="flex items-center justify-between md:hidden">
            <span className="text-lg font-semibold text-text-primary">Menu</span>
            <button
              type="button"
              onClick={closeMobile}
              aria-label="Close menu"
              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-text-muted transition-colors hover:bg-surface-muted hover:text-brand"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {canToggleCollapse ? (
            <div className={cn("hidden md:flex", collapsed ? "justify-center" : "justify-end")}>
              <button
                type="button"
                onClick={toggleCollapse}
                aria-label={resolvedCollapseButtonLabel}
                className="inline-flex h-8 w-8 items-center justify-center rounded-md text-text-muted transition-colors hover:bg-surface-muted hover:text-brand"
              >
                {collapsed ? <PanelLeftOpen className="h-6 w-6" /> : <PanelLeftClose className="h-6 w-6" />}
              </button>
            </div>
          ) : null}

          {quickActions?.length ? (
            <div className="mb-8">
              <div className={cn("mb-4 flex items-center justify-between", collapsed ? "md:hidden" : undefined)}>
                <h3 className="text-lg font-semibold text-text-primary">{quickActionsTitle}</h3>
                {quickActionsTrailing}
              </div>
              <div className={cn(quickActionSize === "compact" ? "space-y-2" : "space-y-3")}>
                {quickActions.map((action) => {
                  const Icon = action.icon
                  const tone = action.tone ?? "brand"
                  const actionClassName = cn(
                    "flex w-full items-center rounded-lg font-medium transition-colors",
                    quickActionSize === "compact" ? "px-4 py-2" : "px-4 py-3",
                    collapsed ? "md:justify-center md:px-2 md:py-2" : "",
                    quickActionToneClassMap[tone],
                    action.disabled ? "pointer-events-none opacity-50" : "",
                  )

                  if (action.href) {
                    return (
                      <Link
                        key={action.label}
                        href={action.href}
                        title={collapsed ? action.label : undefined}
                        onClick={closeMobile}
                        className={actionClassName}
                      >
                        <Icon className={cn("h-4 w-4 shrink-0", collapsed ? "mr-2 md:mr-0" : "mr-2")} />
                        <span className={collapsed ? "md:sr-only" : undefined}>{action.label}</span>
                      </Link>
                    )
                  }

                  return (
                    <button
                      key={action.label}
                      type="button"
                      title={collapsed ? action.label : undefined}
                      className={actionClassName}
                      disabled={action.disabled}
                    >
                      <Icon className={cn("h-4 w-4 shrink-0", collapsed ? "mr-2 md:mr-0" : "mr-2")} />
                      <span className={collapsed ? "md:sr-only" : undefined}>{action.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          ) : null}

          <nav className="space-y-2">
            {groups.map((group, groupIndex) => (
              <div
                key={group.title}
                className={cn(
                  groupVariant === "divided"
                    ? groupIndex === groups.length - 1
                      ? "py-2"
                      : "border-b border-border-soft py-2"
                    : groupIndex === 0
                      ? ""
                      : "mt-6",
                )}
              >
                {showGroupTitles ? (
                  <h4
                    className={cn(
                      "mb-3 font-semibold uppercase tracking-wider text-text-muted",
                      groupVariant === "divided" ? "text-sm" : "text-xs",
                      collapsed ? "md:hidden" : "",
                    )}
                  >
                    {group.title}
                  </h4>
                ) : null}

                {group.subgroupsFirst && group.subgroups ? renderSubgroups(group.subgroups) : null}

                <div className="space-y-1">
                  {group.items.map((item) => (
                    <SidebarNavItem
                      key={item.href}
                      item={item}
                      active={isItemActive(pathname, item)}
                      defaultItemSize={defaultItemSize}
                      collapsed={collapsed}
                    />
                  ))}
                </div>

                {!group.subgroupsFirst && group.subgroups ? renderSubgroups(group.subgroups) : null}
              </div>
            ))}
          </nav>
        </div>
      </aside>
    </>
  )
}
