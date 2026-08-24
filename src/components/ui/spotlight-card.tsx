"use client"

import React, { type ReactNode, useEffect, useRef } from "react"
import { cn } from "@/lib/utils"

type GlowColor = "blue" | "purple" | "green" | "red" | "orange"

interface SpotlightCardProps {
  children: ReactNode
  className?: string
  glowColor?: GlowColor
  radius?: number
}

const glowColorMap: Record<GlowColor, { base: number; spread: number }> = {
  blue: { base: 220, spread: 80 },
  purple: { base: 280, spread: 100 },
  green: { base: 120, spread: 80 },
  red: { base: 0, spread: 80 },
  orange: { base: 30, spread: 80 },
}

export function SpotlightCard({ children, className, glowColor = "blue", radius = 20 }: SpotlightCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const { base, spread } = glowColorMap[glowColor]

  useEffect(() => {
    const el = cardRef.current
    if (!el) return

    const syncPointer = (e: PointerEvent) => {
      const rect = el.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      el.style.setProperty("--x", x.toFixed(2))
      el.style.setProperty("--y", y.toFixed(2))
      el.style.setProperty("--xp", (x / rect.width).toFixed(2))
      el.style.setProperty("--yp", (y / rect.height).toFixed(2))
    }

    document.addEventListener("pointermove", syncPointer)
    return () => document.removeEventListener("pointermove", syncPointer)
  }, [])

  return (
    <div
      ref={cardRef}
      data-glow
      className={cn("relative", className)}
      style={
        {
          "--base": base,
          "--spread": spread,
          "--radius": String(radius),
          "--border": "1.5",
          "--size": "280",
          "--outer": "1",
          "--border-size": "calc(var(--border, 2) * 1px)",
          "--spotlight-size": "calc(var(--size, 150) * 1px)",
          "--hue": "calc(var(--base) + (var(--xp, 0) * var(--spread, 0)))",
          "--backup-border": "var(--border-soft)",
          backgroundImage: `radial-gradient(
            var(--spotlight-size) var(--spotlight-size) at
            calc(var(--x, 0) * 1px) calc(var(--y, 0) * 1px),
            hsl(var(--hue, 220) 100% 70% / 0.04), transparent
          )`,
          backgroundSize: "calc(100% + (2 * var(--border-size))) calc(100% + (2 * var(--border-size)))",
          backgroundPosition: "50% 50%",
          border: "var(--border-size) solid var(--backup-border)",
        } as React.CSSProperties
      }
    >
      <div data-glow />
      {children}
    </div>
  )
}
