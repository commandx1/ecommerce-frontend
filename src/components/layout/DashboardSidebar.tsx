"use client"

import { PanelLeftClose, PanelLeftOpen, type LucideIcon } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { type ReactNode, useEffect, useId, useState } from "react"
import { cn } from "@/lib/utils"

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

const isItemActive = (pathname: string | null, item: DashboardSidebarNavItem) => {
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
  const Icon = item.icon
  const itemSize = item.size ?? defaultItemSize
  const isCompact = itemSize === "compact"

  return (
    <Link
      href={item.href}
      title={collapsed ? item.label : undefined}
      className={cn(
        "flex items-center rounded-lg transition-colors",
        collapsed
          ? isCompact
            ? "justify-center px-2 py-2 text-sm"
            : "justify-center px-2 py-2 text-base"
          : isCompact
            ? "px-3 py-2 text-sm"
            : "px-3 py-2 text-base",
        active
          ? "bg-brand/10 font-medium text-brand"
          : "text-text-secondary hover:bg-surface-muted hover:text-text-primary",
        item.disabled ? "pointer-events-none opacity-50" : "",
      )}
    >
      <Icon className={cn(collapsed ? "" : "mr-3", isCompact ? "h-4 w-4" : "h-5 w-5", active ? "text-brand" : "text-text-muted")} />
      {collapsed ? <span className="sr-only">{item.label}</span> : <span>{item.label}</span>}
      {!collapsed && item.trailingText ? <span className="ml-auto text-sm text-text-muted">{item.trailingText}</span> : null}
      {!collapsed && item.badge ? (
        <span className={cn("ml-auto rounded-full px-2 py-1 text-xs", badgeClassMap[item.badge.tone])}>
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
          <h5 className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-wider text-text-muted">{subgroup.title}</h5>
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
    <aside
      id={sidebarId}
      className={cn(
        "sticky top-16 z-40 h-[calc(100vh-4rem)] shrink-0 overflow-y-auto border-r border-border-soft bg-surface-elevated shadow-soft transition-[width] duration-200",
        collapsed ? "w-16" : "w-64",
      )}
    >
      <div className={cn("space-y-6", collapsed ? "p-3" : "p-6")}>
        {canToggleCollapse ? (
          <div className={cn("flex", collapsed ? "justify-center" : "justify-end")}>
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
            {!collapsed ? (
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-text-primary">{quickActionsTitle}</h3>
                {quickActionsTrailing}
              </div>
            ) : null}
            <div className={cn(quickActionSize === "compact" ? "space-y-2" : "space-y-3")}>
              {quickActions.map((action) => {
                const Icon = action.icon
                const tone = action.tone ?? "brand"
                const actionClassName = cn(
                  "flex w-full items-center rounded-lg font-medium transition-colors",
                  collapsed
                    ? "justify-center px-2 py-2"
                    : quickActionSize === "compact"
                      ? "px-4 py-2"
                      : "px-4 py-3",
                  quickActionToneClassMap[tone],
                  action.disabled ? "pointer-events-none opacity-50" : "",
                )

                if (action.href) {
                  return (
                    <Link key={action.label} href={action.href} title={collapsed ? action.label : undefined} className={actionClassName}>
                      <Icon className={cn("h-4 w-4", collapsed ? "" : "mr-2")} />
                      {collapsed ? <span className="sr-only">{action.label}</span> : action.label}
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
                    <Icon className={cn("h-4 w-4", collapsed ? "" : "mr-2")} />
                    {collapsed ? <span className="sr-only">{action.label}</span> : action.label}
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
              {!collapsed && showGroupTitles ? (
                <h4
                  className={cn(
                    "mb-3 font-semibold uppercase tracking-wider text-text-muted",
                    groupVariant === "divided" ? "text-sm" : "text-xs",
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
  )
}
