"use client"

import { type ReactNode, type RefObject, useEffect, useId, useLayoutEffect, useRef, useState } from "react"
import { glassDarkTintClass, LiquidGlass } from "@/components/ui/liquid-glass"
import { cn } from "@/lib/utils"

type Gsap = typeof import("gsap").gsap

/**
 * gsap (~32 KB gzip) is only needed once a menu/search panel opens, but this module sits in the
 * navbar on every route. It is therefore loaded lazily, on idle right after the page's JS runs, so
 * it stays out of the first-load JS yet is in memory long before a user can open anything.
 */
let loadedGsap: Gsap | null = null
let gsapPromise: Promise<Gsap> | null = null
function loadGsap(): Promise<Gsap> {
  gsapPromise ??= import("gsap").then((mod) => {
    loadedGsap = mod.gsap
    return mod.gsap
  })
  return gsapPromise
}
if (typeof window !== "undefined") {
  const preload = () => void loadGsap()
  if (typeof window.requestIdleCallback === "function") window.requestIdleCallback(preload, { timeout: 2000 })
  else setTimeout(preload, 1)
}

const MENU_CONTENT_SELECTOR = "[data-menu-head], [data-menu-item]"

interface GlassMorphMenuProps {
  /** Trigger's inner content (icon/avatar/text). `open` lets it swap icons. */
  trigger: (open: boolean) => ReactNode
  triggerLabel?: string | ((open: boolean) => string)
  triggerClassName?: string
  /** Which edge the panel hugs: start -> left-0, end -> right-0. */
  align?: "start" | "end"
  panelClassName?: string
  className?: string
  /** Optional controlled mode. */
  open?: boolean
  onOpenChange?: (open: boolean) => void
  children: ReactNode | ((close: () => void) => ReactNode)
}

export interface GlassMorphRefs {
  root: RefObject<HTMLDivElement | null>
  glass: RefObject<HTMLDivElement | null>
  anchor: RefObject<HTMLElement | null>
  panel: RefObject<HTMLDivElement | null>
}

/** Grows the glass from the anchor's box to anchor+panel while `open`; returns whether the panel should stay mounted (true through the closing tween). */
export function useGlassMorph(open: boolean, refs: GlassMorphRefs): boolean {
  const [rendered, setRendered] = useState(false)
  // Stable RefObjects (callers pass a fresh wrapper object each render, so depend on these, not on `refs`).
  const { root: rootRef, glass: glassRef, anchor: anchorRef, panel: panelRef } = refs
  // Same lifecycle `useGSAP` gave this hook: one gsap context per mount, scoped to the root, never
  // reverted between runs, reverted on unmount.
  const contextRef = useRef<gsap.Context | null>(null)

  useLayoutEffect(() => () => contextRef.current?.revert(), [])

  useLayoutEffect(() => {
    if (open && !rendered) {
      setRendered(true)
      return
    }

    let cancelled = false
    const animate = (gsap: Gsap) => {
      if (cancelled) return
      contextRef.current ??= gsap.context(() => {}, rootRef)
      contextRef.current.add(() => {
        const glass = glassRef.current
        const panel = panelRef.current
        const anchor = anchorRef.current
        const root = rootRef.current
        if (!glass || !anchor || !root) return

        const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false
        const dur = reduce ? 0 : 1
        const content = panel ? gsap.utils.toArray<HTMLElement>(MENU_CONTENT_SELECTOR, panel) : []
        const targets = content.length > 0 ? content : panel ? Array.from(panel.children) : []
        // A quick re-toggle must not let the previous timeline keep writing after this one clears props.
        gsap.killTweensOf([glass, ...targets])

        if (open && rendered && panel) {
          const r = root.getBoundingClientRect()
          // Keep the panel inside the viewport: an end-aligned menu near the left edge (mobile bell) would
          // otherwise hang off-screen. The glass follows the panel's final box, so shifting is enough.
          panel.style.transform = ""
          let p = panel.getBoundingClientRect()
          const margin = 8
          const shift =
            p.left < margin
              ? margin - p.left
              : p.right > window.innerWidth - margin
                ? window.innerWidth - margin - p.right
                : 0
          if (shift !== 0) {
            panel.style.transform = `translateX(${shift}px)`
            p = panel.getBoundingClientRect()
          }
          const tl = gsap.timeline()
          tl.to(glass, {
            left: p.left - r.left,
            top: 0,
            width: p.width,
            height: p.bottom - r.top,
            duration: 0.45 * dur,
            ease: "back.out(1.2)",
          })
          tl.fromTo(
            targets,
            { opacity: 0, y: 8 },
            { opacity: 1, y: 0, duration: 0.25 * dur, stagger: 0.04 * dur, ease: "power2.out" },
            0.12 * dur,
          )
        } else if (!open && rendered) {
          const tl = gsap.timeline({
            onComplete: () => {
              gsap.set(glass, { clearProps: "left,top,width,height" })
              setRendered(false)
            },
          })
          tl.to(targets, { opacity: 0, y: 4, duration: 0.12 * dur })
          tl.to(
            glass,
            {
              left: 0,
              top: 0,
              width: anchor.offsetWidth,
              height: anchor.offsetHeight,
              duration: 0.32 * dur,
              ease: "power3.in",
            },
            "<0.04",
          )
        }
      }, rootRef)
    }

    if (loadedGsap) {
      animate(loadedGsap)
    } else {
      // Only reachable if a panel opens before the idle preload finished: keep the freshly mounted
      // content hidden until the entrance tween (which starts from opacity 0) can take over.
      const panel = panelRef.current
      if (open && rendered && panel) {
        const content = Array.from(panel.querySelectorAll<HTMLElement>(MENU_CONTENT_SELECTOR))
        const targets = content.length > 0 ? content : Array.from(panel.children as HTMLCollectionOf<HTMLElement>)
        for (const el of targets) el.style.opacity = "0"
      }
      void loadGsap().then(animate)
    }
    return () => {
      cancelled = true
    }
  }, [open, rendered, rootRef, glassRef, anchorRef, panelRef])

  // Panel content often changes size while open (query resolves, results list grows/shrinks):
  // follow it so the glass never ends short of the panel.
  useEffect(() => {
    const panel = refs.panel.current
    const glass = refs.glass.current
    const root = refs.root.current
    if (!open || !rendered || !panel || !glass || !root || typeof ResizeObserver === "undefined") return

    let last = `${panel.offsetWidth}x${panel.offsetHeight}`
    const ro = new ResizeObserver(() => {
      const size = `${panel.offsetWidth}x${panel.offsetHeight}`
      if (size === last) return // initial callback: the opening tween already targets this box
      last = size
      const r = root.getBoundingClientRect()
      const p = panel.getBoundingClientRect()
      // Loaded by now in practice (the opening tween needed it); if not, that tween measures the
      // final box itself once it runs.
      loadedGsap?.to(glass, {
        left: p.left - r.left,
        width: p.width,
        height: p.bottom - r.top,
        duration: 0.25,
        ease: "power2.out",
        overwrite: "auto",
      })
    })
    ro.observe(panel)
    return () => ro.disconnect()
  }, [open, rendered, refs.panel, refs.glass, refs.root])

  return rendered
}

export function GlassMorphMenu({
  trigger,
  triggerLabel,
  triggerClassName,
  align = "end",
  panelClassName,
  className,
  open,
  onOpenChange,
  children,
}: GlassMorphMenuProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false)
  const isOpen = open ?? uncontrolledOpen
  // Refs so the window listeners below can stay mounted once instead of re-subscribing per render.
  const onOpenChangeRef = useRef(onOpenChange)
  onOpenChangeRef.current = onOpenChange
  const isOpenRef = useRef(isOpen)
  isOpenRef.current = isOpen

  const rootRef = useRef<HTMLDivElement | null>(null)
  const triggerRef = useRef<HTMLButtonElement | null>(null)
  const glassRef = useRef<HTMLDivElement | null>(null)
  const panelRef = useRef<HTMLDivElement | null>(null)
  const panelId = useId()

  const rendered = useGlassMorph(isOpen, { root: rootRef, glass: glassRef, anchor: triggerRef, panel: panelRef })

  const setOpen = (v: boolean) => {
    setUncontrolledOpen(v)
    onOpenChange?.(v)
  }
  const toggle = () => setOpen(!isOpen)
  const close = () => setOpen(false)

  useEffect(() => {
    const dismiss = () => {
      if (!isOpenRef.current) return
      setUncontrolledOpen(false)
      onOpenChangeRef.current?.(false)
    }

    const onPointerDown = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) dismiss()
    }

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") dismiss()
    }

    window.addEventListener("pointerdown", onPointerDown)
    window.addEventListener("keydown", onKeyDown)
    return () => {
      window.removeEventListener("pointerdown", onPointerDown)
      window.removeEventListener("keydown", onKeyDown)
    }
  }, [])

  const label = typeof triggerLabel === "function" ? triggerLabel(isOpen) : triggerLabel

  return (
    // While the panel exists (incl. the closing tween) the root rises above its siblings, so the open menu
    // is never painted under pills that come later in the DOM.
    <div ref={rootRef} className={cn("relative isolate", rendered && "z-20", className)}>
      {/* Same blur as the navbar capsule: the marquee behind the panel must dissolve, not smear across the items.
          In dark mode a white tint can't cover light text behind the panel, so tint with the dark surface instead. */}
      <LiquidGlass
        ref={glassRef}
        blur={24}
        // Same as the search results: rim wider than the panel so the whole surface refracts, blur 6 keeps
        // the waves visible yet calm. Menu text sits above the glass and stays put.
        edge={999}
        rimBlur={6}
        borderRadius={20} // half the h-10 trigger: a full pill when closed, the same corner when open
        className={cn("z-0 transition-none", glassDarkTintClass, !rendered && "after:hidden [&>[data-lg-rim]]:hidden!")}
      />
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-controls={rendered ? panelId : undefined}
        aria-label={label}
        className={cn("relative z-10 flex h-10 cursor-pointer items-center rounded-full", triggerClassName)}
        onClick={toggle}
      >
        {trigger(isOpen)}
      </button>

      {rendered && (
        <div
          ref={panelRef}
          id={panelId}
          className={cn("absolute top-full z-10 pt-1 pb-2", align === "start" ? "left-0" : "right-0", panelClassName)}
        >
          {typeof children === "function" ? children(close) : children}
        </div>
      )}
    </div>
  )
}
