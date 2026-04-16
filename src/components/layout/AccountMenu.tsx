"use client"

import { ChevronDown, User } from "lucide-react"
import { useEffect, useRef, useState } from "react"

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

    window.addEventListener("pointerdown", onPointerDown)
    return () => window.removeEventListener("pointerdown", onPointerDown)
  }, [])

  return (
    <div ref={rootRef} className={`relative ${className ?? ""}`}>
      <button
        type="button"
        className="flex items-center gap-3"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand text-inverse-foreground">
          <User className="w-4 h-4" />
        </div>
        <div className="hidden md:block">
          <div className="text-sm font-semibold text-text-primary">My Account</div>
          <div className="text-xs text-text-muted">{displayName}</div>
        </div>
        <span className="text-text-muted transition-colors hover:text-brand">
          <ChevronDown
            className="w-4 h-4 transition-transform duration-200"
            style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
          />
        </span>
      </button>

      {open && (
        <div className="absolute right-0 top-12 z-50 w-56 rounded-2xl border border-border-soft bg-surface-elevated/95 py-2 shadow-panel backdrop-blur-sm">
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
