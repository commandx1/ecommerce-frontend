"use client"

import type { LucideIcon } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { type ReactNode, useId } from "react"
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
  quickActions?: DashboardSidebarQuickAction[]
  quickActionsTitle?: string
  quickActionsTrailing?: ReactNode
  quickActionSize?: SidebarItemSize
  groups: DashboardSidebarGroup[]
  groupVariant?: SidebarGroupVariant
  defaultItemSize?: SidebarItemSize
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
}: {
  item: DashboardSidebarNavItem
  active: boolean
  defaultItemSize: SidebarItemSize
}) => {
  const Icon = item.icon
  const itemSize = item.size ?? defaultItemSize
  const isCompact = itemSize === "compact"

  return (
    <Link
      href={item.href}
      className={cn(
        "flex items-center rounded-lg transition-colors",
        isCompact ? "px-3 py-2 text-sm" : "px-3 py-2 text-base",
        active
          ? "bg-brand/10 font-medium text-brand"
          : "text-text-secondary hover:bg-surface-muted hover:text-text-primary",
        item.disabled ? "pointer-events-none opacity-50" : "",
      )}
    >
      <Icon className={cn("mr-3", isCompact ? "h-4 w-4" : "h-5 w-5", active ? "text-brand" : "text-text-muted")} />
      <span>{item.label}</span>
      {item.trailingText ? <span className="ml-auto text-sm text-text-muted">{item.trailingText}</span> : null}
      {item.badge ? (
        <span className={cn("ml-auto rounded-full px-2 py-1 text-xs", badgeClassMap[item.badge.tone])}>
          {item.badge.label}
        </span>
      ) : null}
    </Link>
  )
}

export default function DashboardSidebar({
  quickActions,
  quickActionsTitle = "Quick Actions",
  quickActionsTrailing,
  quickActionSize = "default",
  groups,
  groupVariant = "stacked",
  defaultItemSize = "default",
}: DashboardSidebarProps) {
  const sidebarId = useId()
  const pathname = usePathname()

  const renderSubgroups = (subgroups: DashboardSidebarNavSubgroup[]) => {
    return subgroups.map((subgroup) => (
      <div key={subgroup.title} className="mt-4">
        <h5 className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-wider text-text-muted">
          {subgroup.title}
        </h5>
        <div className="space-y-1">
          {subgroup.items.map((item) => (
            <SidebarNavItem
              key={item.href}
              item={item}
              active={isItemActive(pathname, item)}
              defaultItemSize={defaultItemSize}
            />
          ))}
        </div>
      </div>
    ))
  }

  return (
    <aside
      id={sidebarId}
      className="sticky top-16 z-40 h-[calc(100vh-4rem)] w-64 shrink-0 overflow-y-auto border-r border-border-soft bg-surface-elevated shadow-soft"
    >
      <div className="p-6">
        {quickActions?.length ? (
          <div className="mb-8">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-text-primary">{quickActionsTitle}</h3>
              {quickActionsTrailing}
            </div>
            <div className={cn(quickActionSize === "compact" ? "space-y-2" : "space-y-3")}>
              {quickActions.map((action) => {
                const Icon = action.icon
                const tone = action.tone ?? "brand"
                const actionClassName = cn(
                  "flex w-full items-center rounded-lg px-4 font-medium transition-colors",
                  quickActionSize === "compact" ? "py-2" : "py-3",
                  quickActionToneClassMap[tone],
                  action.disabled ? "pointer-events-none opacity-50" : "",
                )

                if (action.href) {
                  return (
                    <Link key={action.label} href={action.href} className={actionClassName}>
                      <Icon className="mr-2 h-4 w-4" />
                      {action.label}
                    </Link>
                  )
                }

                return (
                  <button key={action.label} type="button" className={actionClassName} disabled={action.disabled}>
                    <Icon className="mr-2 h-4 w-4" />
                    {action.label}
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
              <h4
                className={cn(
                  "mb-3 font-semibold uppercase tracking-wider text-text-muted",
                  groupVariant === "divided" ? "text-sm" : "text-xs",
                )}
              >
                {group.title}
              </h4>

              {group.subgroupsFirst && group.subgroups ? renderSubgroups(group.subgroups) : null}

              <div className="space-y-1">
                {group.items.map((item) => (
                  <SidebarNavItem
                    key={item.href}
                    item={item}
                    active={isItemActive(pathname, item)}
                    defaultItemSize={defaultItemSize}
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
