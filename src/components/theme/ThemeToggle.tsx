"use client"

import { MoonStar, SunMedium } from "lucide-react"
import { useTheme } from "next-themes"
import { useEffect, useState, type MouseEvent } from "react"
import { flushSync } from "react-dom"
import { Button } from "@/components/ui/button"

export default function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  const isDark = mounted && resolvedTheme === "dark"

  const handleToggle = (e: MouseEvent<HTMLButtonElement>) => {
    const next = isDark ? "light" : "dark"

    // Fallback for browsers without View Transitions API
    if (!("startViewTransition" in document)) {
      setTheme(next)
      return
    }

    const x = e.clientX
    const y = e.clientY
    document.documentElement.style.setProperty("--theme-x", `${x}px`)
    document.documentElement.style.setProperty("--theme-y", `${y}px`)

    ;(document as Document & { startViewTransition: (cb: () => void) => void })
      .startViewTransition(() => {
        flushSync(() => setTheme(next))
      })
  }

  return (
    <Button
      type="button"
      variant="quiet"
      size="icon"
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      onClick={handleToggle}
      className="rounded-full border border-border-soft/80 bg-surface/90 shadow-soft backdrop-blur"
    >
      {isDark ? <SunMedium className="h-[18px] w-[18px]" /> : <MoonStar className="h-[18px] w-[18px]" />}
    </Button>
  )
}
