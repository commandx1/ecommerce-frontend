"use client"

import { useState } from "react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import type { SelectVariantParams } from "../../hooks/useVariantAttributes"
import type { VariantChoice } from "../../types"

interface VariantNamePopoverProps {
  attribute: string
  choice: VariantChoice
  disabled: boolean
  triggerClassName: string
  onSelect: (params: SelectVariantParams) => void
}

/**
 * Value has more than one candidate product (ambiguous chip): the trigger never selects on its
 * own, it only opens the list of names so the click always carries a `productName` - without one
 * the backend's /match falls back to an unordered "first candidate" pick (SVC:1179).
 */
export default function VariantNamePopover({
  attribute,
  choice,
  disabled,
  triggerClassName,
  onSelect,
}: VariantNamePopoverProps) {
  const [open, setOpen] = useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {/* preventDefault, not just setOpen(true): Radix composes this onClick with its own
            open-toggle handler and skips that handler only when the event's default was
            prevented. Without it, a click right after a hover-open (open already true) would
            toggle the popover straight back closed in the same interaction. */}
        <button
          type="button"
          aria-pressed={choice.selected}
          disabled={disabled}
          className={triggerClassName}
          onPointerEnter={() => setOpen(true)}
          onClick={(event) => {
            event.preventDefault()
            setOpen(true)
          }}
        >
          {choice.value}
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-56 p-2" onPointerLeave={() => setOpen(false)}>
        <div className="flex flex-col gap-1">
          {choice.names.map((name) => (
            <button
              key={name}
              type="button"
              disabled={disabled}
              className="rounded-lg px-3 py-2 text-left text-sm text-text-primary transition-colors hover:bg-surface-muted disabled:pointer-events-none disabled:opacity-50"
              onClick={() => {
                setOpen(false)
                onSelect({ attribute, value: choice.value, productName: name })
              }}
            >
              {name}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}
