"use client"

import { cn } from "@/lib/utils"

interface ShineBorderProps {
  borderRadius?: number
  borderWidth?: number
  duration?: number
  color?: string | string[]
  className?: string
  children: React.ReactNode
}

export function ShineBorder({
  borderRadius = 8,
  borderWidth = 1,
  duration = 14,
  color = "#ffffff",
  className,
  children,
}: ShineBorderProps) {
  const gradient = `radial-gradient(transparent, transparent, ${Array.isArray(color) ? color.join(",") : color}, transparent, transparent)`

  return (
    <div
      className={cn("shine-border relative", className)}
      style={
        {
          "--shine-radius": `${borderRadius}px`,
          "--shine-width": `${borderWidth}px`,
          "--shine-duration": `${duration}s`,
          "--shine-gradient": gradient,
        } as React.CSSProperties
      }
    >
      {children}
    </div>
  )
}
