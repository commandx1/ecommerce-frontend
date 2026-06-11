"use client"

import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from "react"
import { createContext, useContext, useId, useMemo, useState } from "react"
import { cn } from "@/lib/utils"

interface CollapseContextValue {
  contentId: string
  open: boolean
  setOpen: (next: boolean) => void
}

const CollapseContext = createContext<CollapseContextValue | null>(null)

function useCollapseContext() {
  const context = useContext(CollapseContext)
  if (!context) {
    throw new Error("Collapse components must be used within <Collapse>.")
  }
  return context
}

interface CollapseProps {
  children: ReactNode
  className?: string
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  open?: boolean
}

export function Collapse({ children, className, defaultOpen = true, onOpenChange, open }: CollapseProps) {
  const [internalOpen, setInternalOpen] = useState(defaultOpen)
  const contentId = useId()
  const isControlled = typeof open === "boolean"
  const isOpen = isControlled ? open : internalOpen

  const setOpen = (next: boolean) => {
    if (!isControlled) {
      setInternalOpen(next)
    }
    onOpenChange?.(next)
  }

  const contextValue = useMemo(
    () => ({
      contentId,
      open: isOpen,
      setOpen,
    }),
    [contentId, isOpen],
  )

  return (
    <CollapseContext.Provider value={contextValue}>
      <div data-state={isOpen ? "open" : "closed"} className={className}>
        {children}
      </div>
    </CollapseContext.Provider>
  )
}

interface CollapseTriggerProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
}

export function CollapseTrigger({ children, className, onClick, type = "button", ...props }: CollapseTriggerProps) {
  const { contentId, open, setOpen } = useCollapseContext()

  return (
    <button
      {...props}
      type={type}
      data-state={open ? "open" : "closed"}
      aria-expanded={open}
      aria-controls={contentId}
      className={className}
      onClick={(event) => {
        onClick?.(event)
        if (event.defaultPrevented) return
        setOpen(!open)
      }}
    >
      {children}
    </button>
  )
}

interface CollapseContentProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
}

export function CollapseContent({ children, className, ...props }: CollapseContentProps) {
  const { contentId, open } = useCollapseContext()

  return (
    <div
      {...props}
      id={contentId}
      data-state={open ? "open" : "closed"}
      aria-hidden={!open}
      className={cn(
        "grid overflow-hidden transition-[grid-template-rows,opacity] duration-200 ease-out",
        open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
        className,
      )}
    >
      <div className="min-h-0 overflow-hidden">{children}</div>
    </div>
  )
}
