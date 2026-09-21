"use client"

import { ChevronDown, User } from "lucide-react"
import { useEffect, useRef, useState } from "react"
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
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current) return
      if (!rootRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false)
    }

    window.addEventListener("pointerdown", onPointerDown)
    window.addEventListener("keydown", onKeyDown)
    return () => {
      window.removeEventListener("pointerdown", onPointerDown)
      window.removeEventListener("keydown", onKeyDown)
    }
  }, [])

  return (
    <div ref={rootRef} className={`relative ${className ?? ""}`}>
      <button
        type="button"
        className="flex h-10 cursor-pointer items-center gap-3 rounded-full pl-1 pr-2.5 transition-colors duration-200 hover:bg-surface-muted"
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand text-inverse-foreground">
          <User className="w-4 h-4" />
        </div>
        <div className="hidden md:block">
          <div className="text-sm font-semibold text-text-primary">
            <span className="sr-only">My Account</span>
            {displayName}
          </div>
        </div>
        <span className="text-text-muted transition-colors hover:text-brand">
          <ChevronDown className={cn("w-4 h-4 transition-transform duration-200", open && "rotate-180")} />
        </span>
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-3 w-56 rounded-2xl border border-border-soft bg-surface-elevated/95 py-2 shadow-panel backdrop-blur-sm">
          <div className="border-b border-border-soft px-4 py-3">
            <p className="text-sm font-semibold text-text-primary">{displayName}</p>
            {email && <p className="truncate text-xs text-text-muted">{email}</p>}
          </div>
          {items.map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => {
                item.onClick()
                setOpen(false)
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
        </div>
      )}
    </div>
  )
}
