"use client"

import { ChevronDown, User } from "lucide-react"
import { GlassMorphMenu } from "@/components/ui/glass-morph-menu"
import { cn } from "@/lib/utils"

export type AccountMenuItem = {
  label: string
  onClick: () => void
  icon?: React.ReactNode
  variant?: "default" | "danger"
}

type Props = {
  displayName: string
  email?: string | null
  items?: AccountMenuItem[]
  className?: string
}

export default function AccountMenu({ displayName, email, items = [], className }: Props) {
  return (
    <GlassMorphMenu
      className={className}
      align="end"
      panelClassName="w-56"
      triggerClassName="gap-3 pl-1 pr-2.5"
      trigger={(open) => (
        <>
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand text-inverse-foreground">
            <User className="w-4 h-4" />
          </div>
          <span className="sr-only">My Account</span>
          <div className="hidden md:block">
            <div className="text-sm font-semibold text-text-primary">{displayName}</div>
          </div>
          <span className="text-text-muted transition-colors hover:text-brand">
            <ChevronDown className={cn("w-4 h-4 transition-transform duration-200", open && "rotate-180")} />
          </span>
        </>
      )}
    >
      {(close) => (
        <>
          <div data-menu-head className="border-b border-border-soft px-4 py-3">
            <p className="text-sm font-semibold text-text-primary md:hidden">{displayName}</p>
            {email && <p className="truncate text-xs text-text-muted">{email}</p>}
          </div>
          {items.map((item) => (
            <button
              key={item.label}
              type="button"
              data-menu-item
              onClick={() => {
                item.onClick()
                close()
              }}
              className={`flex w-full items-center px-4 py-2 text-left text-sm font-medium transition-colors ${
                item.variant === "danger"
                  ? "text-danger hover:bg-danger/10"
                  : "text-text-secondary hover:bg-surface-muted hover:text-text-primary"
              }`}
            >
              {item.icon ? <span className="w-4 h-4 mr-3 flex items-center justify-center">{item.icon}</span> : null}
              {item.label}
            </button>
          ))}
        </>
      )}
    </GlassMorphMenu>
  )
}
