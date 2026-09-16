"use client"

import { LoaderCircle } from "lucide-react"
import type { ReactElement, ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

interface ConfirmPopoverProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  trigger: ReactElement
  title: string
  description?: ReactNode
  confirmText?: string
  cancelText?: string
  isDanger?: boolean
  isLoading?: boolean
  onConfirm: () => void
  side?: "top" | "bottom" | "left" | "right"
  children?: ReactNode
  className?: string
}

export default function ConfirmPopover({
  open,
  onOpenChange,
  trigger,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  isDanger = true,
  isLoading = false,
  onConfirm,
  side = "top",
  children,
  className,
}: ConfirmPopoverProps) {
  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent side={side} className={cn("w-64 p-4", className)}>
        <p className="text-sm font-semibold text-text-primary">{title}</p>
        {description ? <p className="mt-1 text-xs text-text-secondary">{description}</p> : null}
        {children}
        <div className="mt-3 flex justify-end gap-2">
          <Button type="button" variant="quiet" size="sm" disabled={isLoading} onClick={() => onOpenChange(false)}>
            {cancelText}
          </Button>
          <Button
            type="button"
            variant={isDanger ? "destructive" : "default"}
            size="sm"
            disabled={isLoading}
            onClick={onConfirm}
            className={cn("relative transition-[padding] duration-200", isLoading && "pl-7")}
          >
            <div
              className={cn(
                "absolute left-2.5 -translate-x-2 opacity-0 transition-all duration-200 ease-in-out",
                isLoading && "translate-x-0 opacity-100",
              )}
            >
              <LoaderCircle className="animate-spin" size={12} strokeWidth={2} aria-hidden="true" />
            </div>
            {confirmText}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
