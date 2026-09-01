"use client"

import type { SelectVariantParams } from "../../hooks/useVariantAttributes"
import type { VariantChoice } from "../../types"
import VariantNamePopover from "./VariantNamePopover"

interface VariantChoiceChipProps {
  attribute: string
  choice: VariantChoice
  disabled: boolean
  onSelect: (params: SelectVariantParams) => void
}

// Backend meaning (ProductServiceImpl.java:1041-1042): `option` implies `available`, so
// option:true+available:false never happens - these are the only three reachable style states,
// plus "neither" for a value no candidate can satisfy. option:false chips stay clickable (they're
// still a valid, if partial, match) - only styled a step down from a full match.
function resolveChipClassName(choice: VariantChoice): string {
  if (choice.selected) {
    return "border-warning-strong text-warning-strong bg-warning/10 font-medium"
  }
  if (choice.option) {
    return "border-border-soft text-text-primary bg-surface hover:border-warning"
  }
  if (choice.available) {
    return "border-border-soft text-text-primary bg-surface opacity-70 hover:border-warning"
  }
  return "border-dashed border-border-soft text-text-muted opacity-45"
}

export default function VariantChoiceChip({ attribute, choice, disabled, onSelect }: VariantChoiceChipProps) {
  const className = `rounded-full border px-4 py-1.5 text-sm transition-colors disabled:pointer-events-none ${resolveChipClassName(
    choice,
  )}`

  // names.length > 1: the value is ambiguous, so the chip can't pick a product on its own -
  // it hands off to the popover, which always sends a productName with the selection.
  if (choice.names.length > 1) {
    return (
      <VariantNamePopover
        attribute={attribute}
        choice={choice}
        disabled={disabled}
        triggerClassName={className}
        onSelect={onSelect}
      />
    )
  }

  return (
    <button
      type="button"
      aria-pressed={choice.selected}
      disabled={disabled}
      className={className}
      onClick={() => onSelect({ attribute, value: choice.value, productName: choice.names[0] })}
    >
      {choice.value}
    </button>
  )
}
