"use client"

import { MoonStar, SunMedium } from "lucide-react"
import { useTheme } from "next-themes"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"

export default function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const isDark = mounted && resolvedTheme === "dark"

  return (
    <Button
      type="button"
      variant="quiet"
      size="icon"
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="rounded-full border border-border-soft/80 bg-surface/90 shadow-soft backdrop-blur"
    >
      {isDark ? <SunMedium className="h-[18px] w-[18px]" /> : <MoonStar className="h-[18px] w-[18px]" />}
    </Button>
  )
}
