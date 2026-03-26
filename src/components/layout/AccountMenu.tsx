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
    <div
      ref={rootRef}
      className={`relative flex items-center gap-3 ${className ?? ""}`}
      onClick={() => setOpen((prev) => !prev)}
    >
      <div className="w-8 h-8 rounded-full bg-steel-blue text-white flex items-center justify-center">
        <User className="w-4 h-4" />
      </div>
      <div className="hidden md:block">
        <div className="text-sm font-semibold text-steel-blue">My Account</div>
        <div className="text-xs text-gray-600">{displayName}</div>
      </div>
      <button type="button" className="text-gray-400 hover:text-steel-blue" aria-expanded={open}>
        <ChevronDown
          className="w-4 h-4 transition-transform duration-200"
          style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
        />
      </button>

      {open && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute right-0 top-12 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50"
        >
          <div className="px-4 py-3 border-b border-gray-200">
            <p className="text-sm font-medium text-gray-900">{displayName}</p>
            {email && <p className="text-sm text-gray-500 truncate">{email}</p>}
          </div>
          {items.map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => {
                item.onClick()
                setOpen(false)
              }}
              className={`w-full flex items-center px-4 py-2 text-left text-sm font-medium ${
                item.variant === "danger" ? "text-red-600 hover:bg-red-50" : "text-gray-700 hover:bg-gray-100"
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
