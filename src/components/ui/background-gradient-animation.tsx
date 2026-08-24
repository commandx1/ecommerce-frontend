"use client"

import { useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"

// Safari detection is no longer used — we use the same blur path for all browsers
// since the SVG goo filter (feGaussianBlur + feColorMatrix + feBlend + CSS blur) is
// too expensive to composite during scroll. Plain blur is faster and looks better
// for background use.

export function BackgroundGradientAnimation({
  gradientBackgroundStart = "rgb(108, 0, 162)",
  gradientBackgroundEnd = "rgb(0, 17, 82)",
  firstColor = "18, 113, 255",
  secondColor = "221, 74, 255",
  thirdColor = "100, 220, 255",
  fourthColor = "200, 50, 50",
  fifthColor = "180, 180, 50",
  pointerColor = "140, 100, 255",
  size = "80%",
  blendingValue = "hard-light",
  children,
  className,
  interactive = true,
  containerClassName,
}: {
  gradientBackgroundStart?: string
  gradientBackgroundEnd?: string
  firstColor?: string
  secondColor?: string
  thirdColor?: string
  fourthColor?: string
  fifthColor?: string
  pointerColor?: string
  size?: string
  blendingValue?: string
  children?: React.ReactNode
  className?: string
  interactive?: boolean
  containerClassName?: string
}) {
  const interactiveRef = useRef<HTMLDivElement>(null)
  const [curX, setCurX] = useState(0)
  const [curY, setCurY] = useState(0)
  const [tgX, setTgX] = useState(0)
  const [tgY, setTgY] = useState(0)

  useEffect(() => {
    document.body.style.setProperty("--gradient-background-start", gradientBackgroundStart)
    document.body.style.setProperty("--gradient-background-end", gradientBackgroundEnd)
    document.body.style.setProperty("--first-color", firstColor)
    document.body.style.setProperty("--second-color", secondColor)
    document.body.style.setProperty("--third-color", thirdColor)
    document.body.style.setProperty("--fourth-color", fourthColor)
    document.body.style.setProperty("--fifth-color", fifthColor)
    document.body.style.setProperty("--pointer-color", pointerColor)
    document.body.style.setProperty("--size", size)
    document.body.style.setProperty("--blending-value", blendingValue)
  }, [
    gradientBackgroundStart,
    gradientBackgroundEnd,
    firstColor,
    secondColor,
    thirdColor,
    fourthColor,
    fifthColor,
    pointerColor,
    size,
    blendingValue,
  ])

  useEffect(() => {
    function move() {
      if (!interactiveRef.current) return
      setCurX((x) => x + (tgX - x) / 20)
      setCurY((y) => y + (tgY - y) / 20)
      interactiveRef.current.style.transform = `translate(${Math.round(curX)}px, ${Math.round(curY)}px)`
    }
    move()
  }, [tgX, tgY, curX, curY])

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (interactiveRef.current) {
      const rect = interactiveRef.current.getBoundingClientRect()
      setTgX(event.clientX - rect.left)
      setTgY(event.clientY - rect.top)
    }
  }

  return (
    <div
      className={cn(
        "h-full w-full relative overflow-hidden bg-[linear-gradient(40deg,var(--gradient-background-start),var(--gradient-background-end))]",
        containerClassName,
      )}
    >
      <div className={cn("", className)}>{children}</div>
      <div className="gradients-container h-full w-full blur-2xl will-change-transform contain-[layout_style_paint]">
        <div
          className={cn(
            "absolute [background:radial-gradient(circle_at_center,var(--first-color)_0,var(--first-color)_50%)_no-repeat]",
            "[mix-blend-mode:var(--blending-value)] w-(--size) h-(--size) top-[calc(50%-var(--size)/2)] left-[calc(50%-var(--size)/2)]",
            "origin-[center_center]",
            "animate-first",
            "opacity-100",
          )}
        />
        <div
          className={cn(
            "absolute [background:radial-gradient(circle_at_center,rgba(var(--second-color),0.8)_0,rgba(var(--second-color),0)_50%)_no-repeat]",
            "[mix-blend-mode:var(--blending-value)] w-(--size) h-(--size) top-[calc(50%-var(--size)/2)] left-[calc(50%-var(--size)/2)]",
            "origin-[calc(50%-400px)]",
            "animate-second",
            "opacity-100",
          )}
        />
        <div
          className={cn(
            "absolute [background:radial-gradient(circle_at_center,rgba(var(--third-color),0.8)_0,rgba(var(--third-color),0)_50%)_no-repeat]",
            "[mix-blend-mode:var(--blending-value)] w-(--size) h-(--size) top-[calc(50%-var(--size)/2)] left-[calc(50%-var(--size)/2)]",
            "origin-[calc(50%+400px)]",
            "animate-third",
            "opacity-100",
          )}
        />
        <div
          className={cn(
            "absolute [background:radial-gradient(circle_at_center,_rgba(var(--fourth-color),_0.8)_0,_rgba(var(--fourth-color),_0)_50%)_no-repeat]",
            "[mix-blend-mode:var(--blending-value)] w-[var(--size)] h-[var(--size)] top-[calc(50%-var(--size)/2)] left-[calc(50%-var(--size)/2)]",
            "[transform-origin:calc(50%-200px)]",
            "animate-fourth",
            "opacity-70",
          )}
        />
        <div
          className={cn(
            "absolute [background:radial-gradient(circle_at_center,_rgba(var(--fifth-color),_0.8)_0,_rgba(var(--fifth-color),_0)_50%)_no-repeat]",
            "[mix-blend-mode:var(--blending-value)] w-[var(--size)] h-[var(--size)] top-[calc(50%-var(--size)/2)] left-[calc(50%-var(--size)/2)]",
            "[transform-origin:calc(50%-800px)_calc(50%+800px)]",
            "animate-fifth",
            "opacity-100",
          )}
        />
        {interactive && (
          <div
            aria-hidden="true"
            ref={interactiveRef}
            onMouseMove={handleMouseMove}
            className={cn(
              "absolute [background:radial-gradient(circle_at_center,_rgba(var(--pointer-color),_0.8)_0,_rgba(var(--pointer-color),_0)_50%)_no-repeat]",
              "[mix-blend-mode:var(--blending-value)] w-full h-full -top-1/2 -left-1/2",
              "opacity-70",
            )}
          />
        )}
      </div>
    </div>
  )
}
