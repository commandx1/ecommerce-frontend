"use client"

import { Skeleton } from "@/components/ui/skeleton"
import { useVariantAttributes } from "../../hooks/useVariantAttributes"
import VariantChoiceChip from "./VariantChoiceChip"

interface VariantAttributeSelectorProps {
  productId: string
  currentProductName: string
}

export default function VariantAttributeSelector({ productId, currentProductName }: VariantAttributeSelectorProps) {
  const { status, groups, pendingValue, select } = useVariantAttributes(productId)

  // Every backend failure (including "this product simply has no variants") arrives as the same
  // HTTP 400, so `empty` covers both cases - the block just disappears rather than showing an
  // error for what is usually a normal, variant-less product.
  if (status === "empty") return null

  if (status === "loading") {
    return (
      <div aria-hidden className="space-y-2">
        <Skeleton className="h-3 w-20 rounded-full" />
        <div className="flex gap-2">
          <Skeleton className="h-8 w-16 rounded-full" />
          <Skeleton className="h-8 w-16 rounded-full" />
        </div>
      </div>
    )
  }

  const isPending = pendingValue !== null

  return (
    <div aria-busy={isPending} className="space-y-4">
      {groups.map((group) => (
        <div key={group.attribute}>
          <div className="mb-2 text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-text-muted">
            {group.attribute}
          </div>
          <div className="flex flex-wrap gap-2">
            {group.choices.map((choice) => (
              <VariantChoiceChip
                key={choice.value}
                attribute={group.attribute}
                choice={choice}
                disabled={isPending}
                currentProductName={currentProductName}
                onSelect={select}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
