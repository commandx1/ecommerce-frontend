"use client"

import { type CSSProperties, type FocusEvent, type MouseEvent, type Ref, useId, useRef, useState } from "react"
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
  /**
   * Rim refraction strength (SVG displacement, Chromium only). The centre keeps the frosted `blur`; a rim band
   * of `edge` px is almost unblurred and bent instead, like the edge of an iOS 26 glass control. Text sits above
   * both layers and never moves. Browsers without url() in backdrop-filter get the plain frosted glass.
   */
  distortion?: number
  /** Width of the refracting rim band in px. Larger than the box = the whole surface refracts. */
  edge?: number
  /** Blur inside the rim band. Keep ≤ 6: from ~10px on, blur erases the displacement waves. */
  rimBlur?: number
  className?: string
  ref?: Ref<HTMLDivElement>
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
  distortion = 60,
  edge = 14,
  rimBlur = 1.5,
  className,
  ref,
}: LiquidGlassProps) {
  const filterId = useId()

  return (
    <>
      <svg aria-hidden="true" role="presentation" width="0" height="0" className="absolute overflow-hidden">
        <defs>
          <filter id={filterId} x="0%" y="0%" width="100%" height="100%" colorInterpolationFilters="sRGB">
            {/* Low-frequency noise = long, smooth waves (the 21st.dev lens look), not fine grain. Where the
                refraction shows is decided by the rim mask below, not by the filter. */}
            <feTurbulence type="fractalNoise" baseFrequency="0.012 0.012" numOctaves="2" seed="92" result="noise" />
            <feGaussianBlur in="noise" stdDeviation="2" result="softNoise" />
            <feDisplacementMap
              in="SourceGraphic"
              in2="softNoise"
              scale={distortion}
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
        </defs>
      </svg>
      <div
        ref={ref}
        aria-hidden
        className={cn(
          "pointer-events-none absolute isolate rounded-(--lg-border-radius) shadow-(--lg-shadow) [--lg-tint-opacity:0.5] dark:[--lg-tint-opacity:0.14]",
          "[--lg-tint:rgba(255,255,255,var(--lg-tint-opacity))]",
          // Light mode: white-on-cream glass has no contrast of its own, so the edge does the work — a specular
          // top line, a faint dark bottom line, a hairline + soft drop shadow outside, and a diagonal sheen.
          // Dark mode keeps the soft all-round rim glow; the dark tint already separates it from the page.
          "[--lg-edge:inset_0_1px_0_rgba(255,255,255,0.95),inset_0_-1px_0_rgba(21,39,57,0.08),inset_0_0_0_1px_rgba(255,255,255,0.45)]",
          "dark:[--lg-edge:inset_0_0_20px_-5px_rgba(255,255,255,0.7)]",
          "[--lg-sheen:linear-gradient(135deg,rgba(255,255,255,0.6),rgba(255,255,255,0)_55%)] dark:[--lg-sheen:none]",
          "[--lg-shadow:0_0_0_1px_rgba(21,39,57,0.07),0_10px_24px_-14px_rgba(21,39,57,0.35)]",
          "dark:[--lg-shadow:0_10px_15px_-3px_rgba(0,0,0,0.1),0_4px_6px_-4px_rgba(0,0,0,0.1)]",
          bounds === undefined && "inset-0",
          "transition-[top,left,width,height,opacity] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
          "before:absolute before:inset-0 before:z-0 before:rounded-(--lg-border-radius) before:bg-(--lg-tint) before:bg-[image:var(--lg-sheen)] before:shadow-(--lg-edge) before:content-['']",
          // `filter: url()` never touches the backdrop; the SVG filter must live inside `backdrop-filter` itself.
          // Only Chromium accepts a url() there, so the refracting declaration is gated behind @supports and
          // everything else keeps the plain frosted blur.
          "after:absolute after:inset-0 after:isolate after:-z-1 after:rounded-(--lg-border-radius) after:backdrop-blur-(--lg-blur) after:content-['']",
          // With url() support the frosted layer is masked to the centre and the rim layer (child div below)
          // covers the complementary band, so each samples the page directly instead of each other's output.
          "supports-[backdrop-filter:url(#lg)]:after:[mask-image:var(--lg-centre-mask)] supports-[backdrop-filter:url(#lg)]:after:[mask-composite:intersect]",
          className,
        )}
        style={
          {
            "--lg-border-radius": `${borderRadius}px`,
            ...(tintOpacity !== undefined && { "--lg-tint-opacity": tintOpacity }),
            "--lg-blur": `${blur}px`,
            "--lg-refract": `url("#${filterId}")`,
            "--lg-edge": `${edge}px`,
            "--lg-rim-blur": `${rimBlur}px`,
            "--lg-fade": `${Math.max(2, edge / 3)}px`,
            "--lg-centre-mask":
              "linear-gradient(to bottom, transparent calc(var(--lg-edge) - var(--lg-fade)), #000 var(--lg-edge), #000 calc(100% - var(--lg-edge)), transparent calc(100% - var(--lg-edge) + var(--lg-fade))), linear-gradient(to right, transparent calc(var(--lg-edge) - var(--lg-fade)), #000 var(--lg-edge), #000 calc(100% - var(--lg-edge)), transparent calc(100% - var(--lg-edge) + var(--lg-fade)))",
            "--lg-rim-mask":
              "linear-gradient(to bottom, #000 calc(var(--lg-edge) - var(--lg-fade)), transparent var(--lg-edge), transparent calc(100% - var(--lg-edge)), #000 calc(100% - var(--lg-edge) + var(--lg-fade))), linear-gradient(to right, #000 calc(var(--lg-edge) - var(--lg-fade)), transparent var(--lg-edge), transparent calc(100% - var(--lg-edge)), #000 calc(100% - var(--lg-edge) + var(--lg-fade)))",
            ...(bounds !== undefined && {
              top: bounds?.top ?? 0,
              left: bounds?.left ?? 0,
              width: bounds?.width ?? 0,
              height: bounds?.height ?? 0,
            }),
            opacity: visible && bounds !== null ? 1 : 0,
          } as CSSProperties
        }
      >
        {/* Rim layer: nearly unblurred + refracted, masked to the edge band. Hidden where url() is unsupported. */}
        <div
          data-lg-rim
          className="pointer-events-none absolute inset-0 -z-1 hidden rounded-(--lg-border-radius) [mask-composite:add] [mask-image:var(--lg-rim-mask)] supports-[backdrop-filter:url(#lg)]:block supports-[backdrop-filter:url(#lg)]:[backdrop-filter:blur(var(--lg-rim-blur))_saturate(1.15)_var(--lg-refract)]"
        />
      </div>
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

/** Dark mode: a white tint can't cover light content behind a panel, so tint with the dark surface instead. */
export const glassDarkTintClass = "dark:[--lg-tint:color-mix(in_srgb,var(--color-surface-elevated)_65%,transparent)]"
