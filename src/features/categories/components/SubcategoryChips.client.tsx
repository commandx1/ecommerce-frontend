"use client"

import Link from "next/link"
import { type FocusEvent, type MouseEvent, useRef, useState } from "react"
import { LiquidGlass, type LiquidGlassBounds } from "@/components/ui/liquid-glass"
import { categoryHref } from "@/features/categories/lib/build-category-directory"

interface SubcategoryChipsProps {
  category: string
  items: string[]
}

/** Frosted sub-category chips with one liquid-glass lens that glides to the hovered / focused chip. */
export default function SubcategoryChips({ category, items }: SubcategoryChipsProps) {
  const frameRef = useRef<HTMLDivElement>(null)
  const [bounds, setBounds] = useState<LiquidGlassBounds | null>(null)
  const [active, setActive] = useState(false)

  const follow = (event: MouseEvent<HTMLElement> | FocusEvent<HTMLElement>) => {
    const frame = frameRef.current?.getBoundingClientRect()
    if (!frame) return
    const chip = event.currentTarget.getBoundingClientRect()
    setBounds({ top: chip.top - frame.top, left: chip.left - frame.left, width: chip.width, height: chip.height })
    setActive(true)
  }
  const release = () => setActive(false)

  return (
    <div ref={frameRef} className="relative z-10 mt-4">
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-2 rounded-3xl bg-[radial-gradient(70%_90%_at_10%_60%,var(--brand)_0%,transparent_70%),radial-gradient(60%_90%_at_90%_30%,var(--accent-strong)_0%,transparent_70%)] opacity-40 blur-2xl dark:opacity-30"
      />
      <LiquidGlass bounds={bounds} visible={active} className="z-0" />
      <ul className="relative z-10 flex flex-wrap gap-1.5" aria-label={`${category} sub-categories`}>
        {items.map((child) => (
          <li key={child}>
            <Link
              href={categoryHref(category, child)}
              onMouseEnter={follow}
              onMouseLeave={release}
              onFocus={follow}
              onBlur={release}
              className="inline-flex min-h-9 items-center rounded-full border border-white/70 bg-white/35 px-3 py-1.5 text-[0.78rem] font-medium text-text-secondary shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] backdrop-blur-sm transition-colors duration-150 hover:text-brand dark:hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand dark:border-white/15 dark:bg-white/10 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]"
            >
              {child}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
