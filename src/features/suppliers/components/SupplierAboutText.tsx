"use client"

import { useCallback, useState } from "react"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

export default function SupplierAboutText({ text, className }: { text: string; className?: string }) {
  const [isTruncated, setIsTruncated] = useState(false)

  // line-clamp hides the overflow, so the only way to tell whether the tooltip is
  // worth showing is to compare the clamped height with the full text height.
  const measure = useCallback((node: HTMLParagraphElement | null) => {
    if (!node) return
    const update = () => setIsTruncated(node.scrollHeight > node.clientHeight + 1)
    update()
    const observer = new ResizeObserver(update)
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  const paragraph = (
    <p ref={measure} className={cn("line-clamp-2", className)}>
      {text}
    </p>
  )

  if (!isTruncated) return paragraph

  return (
    <Tooltip>
      <TooltipTrigger asChild>{paragraph}</TooltipTrigger>
      <TooltipContent className="max-w-sm whitespace-normal leading-5">{text}</TooltipContent>
    </Tooltip>
  )
}
