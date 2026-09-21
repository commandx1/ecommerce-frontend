"use client"

import { type CSSProperties, type FocusEvent, type MouseEvent, useId, useRef, useState } from "react"
import { cn } from "@/lib/utils"

export interface LiquidGlassBounds {
  top: number
  left: number
  width: number
  height: number
}

interface LiquidGlassProps {
  /**
   * Lens box relative to the nearest positioned ancestor. The last box is kept while hidden so it fades in place.
   * Omit it to fill the parent (static glass surface).
   */
  bounds?: LiquidGlassBounds | null
  visible?: boolean
  borderRadius?: number
  /** White tint strength; defaults come from the `--lg-tint-opacity` class tokens (light/dark aware). */
  tintOpacity?: number
  blur?: number
  /** SVG displacement strength. Safari ignores the filter and falls back to plain frosted glass. */
  distortion?: number
  className?: string
}

/**
 * Liquid-glass lens: white tint + inner glow (::before) over a refracted, blurred backdrop (::after).
 * Position is data-driven so the parent decides what the lens follows (pointer, hovered item, ...).
 */
export function LiquidGlass({
  bounds,
  visible = true,
  borderRadius = 999,
  tintOpacity,
  blur = 2,
  distortion = 24,
  className,
}: LiquidGlassProps) {
  const filterId = useId()

  return (
    <>
      <svg aria-hidden="true" role="presentation" width="0" height="0" className="absolute overflow-hidden">
        <defs>
          <filter id={filterId} x="0%" y="0%" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency="0.02 0.02" numOctaves="2" seed="92" result="noise" />
            <feGaussianBlur in="noise" stdDeviation="2" result="blurred" />
            <feDisplacementMap
              in="SourceGraphic"
              in2="blurred"
              scale={distortion}
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
        </defs>
      </svg>
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute isolate rounded-(--lg-border-radius) shadow-lg [--lg-tint-opacity:0.38] dark:[--lg-tint-opacity:0.14]",
          bounds === undefined && "inset-0",
          "transition-[top,left,width,height,opacity] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
          "before:absolute before:inset-0 before:z-0 before:rounded-(--lg-border-radius) before:bg-[rgba(255,255,255,var(--lg-tint-opacity))] before:shadow-[inset_0_0_20px_-5px_rgba(255,255,255,0.7)] before:content-['']",
          "after:absolute after:inset-0 after:isolate after:-z-1 after:rounded-(--lg-border-radius) after:backdrop-blur-(--lg-blur) after:[filter:var(--lg-filter)] after:content-['']",
          className,
        )}
        style={
          {
            "--lg-border-radius": `${borderRadius}px`,
            ...(tintOpacity !== undefined && { "--lg-tint-opacity": tintOpacity }),
            "--lg-blur": `${blur}px`,
            "--lg-filter": `url("#${filterId}")`,
            ...(bounds !== undefined && {
              top: bounds?.top ?? 0,
              left: bounds?.left ?? 0,
              width: bounds?.width ?? 0,
              height: bounds?.height ?? 0,
            }),
            opacity: visible && bounds !== null ? 1 : 0,
          } as CSSProperties
        }
      />
    </>
  )
}

/** One lens that glides to the hovered / focused item. Spread `itemProps` on each item, put `frameRef` on the positioned parent. */
export function useLensFollow<T extends HTMLElement = HTMLDivElement>() {
  const frameRef = useRef<T>(null)
  const [bounds, setBounds] = useState<LiquidGlassBounds | null>(null)
  const [active, setActive] = useState(false)

  const follow = (event: MouseEvent<HTMLElement> | FocusEvent<HTMLElement>) => {
    const frame = frameRef.current?.getBoundingClientRect()
    if (!frame) return
    const item = event.currentTarget.getBoundingClientRect()
    setBounds({ top: item.top - frame.top, left: item.left - frame.left, width: item.width, height: item.height })
    setActive(true)
  }
  const release = () => setActive(false)

  return {
    frameRef,
    bounds,
    active,
    itemProps: { onMouseEnter: follow, onMouseLeave: release, onFocus: follow, onBlur: release },
  }
}
