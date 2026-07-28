"use client"

import { MoonStar, SunMedium } from "lucide-react"
import { useTheme } from "next-themes"
import { useEffect, useState, type MouseEvent } from "react"
import { flushSync } from "react-dom"
import { Button } from "@/components/ui/button"

interface ViewTransitionLike {
  ready: Promise<void>
}

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

    // Origin = the toggle itself. clientX/Y is 0 for keyboard activation,
    // so fall back to the button's own center.
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX || rect.left + rect.width / 2
    const y = e.clientY || rect.top + rect.height / 2

    // Radius that reaches the farthest viewport corner from the origin.
    const radius = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y))

    document.documentElement.style.setProperty("--theme-x", `${x}px`)
    document.documentElement.style.setProperty("--theme-y", `${y}px`)

    const transition = (
      document as Document & { startViewTransition: (cb: () => void) => ViewTransitionLike }
    ).startViewTransition(() => {
      flushSync(() => setTheme(next))
    })

    // Drive the reveal from JS so the origin never depends on a CSS variable
    // resolving inside the view-transition pseudo tree.
    transition.ready
      .then(() => {
        document.documentElement.animate(
          {
            clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`],
          },
          {
            duration: 650,
            easing: "cubic-bezier(0.4, 0, 0.2, 1)",
            fill: "both",
            pseudoElement: "::view-transition-new(root)",
          },
        )
      })
      .catch(() => {
        // Transition was skipped (e.g. hidden tab) — theme still applies.
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
      {isDark ? <SunMedium className="h-4.5 w-4.5" /> : <MoonStar className="h-4.5 w-4.5" />}
    </Button>
  )
}
