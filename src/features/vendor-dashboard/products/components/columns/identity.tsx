"use client"

import type { CellContext, ColumnDef } from "@tanstack/react-table"
import Image from "next/image"
import { useCallback } from "react"
import { cn } from "@/lib/utils"
import type { ProductWithDetails } from "../../types"

// Fully static header content: no props, so hoisted to module scope instead of being recreated
// (and, per the note on `useProductColumns` in `index.tsx`, remounted) on every render.
const ProductHeader = () => "Product"

export interface UseIdentityColumnParams {
  imageFallbacks: Record<string, boolean>
  onImageError: (productId: string) => void
}

export function useIdentityColumn({
  imageFallbacks,
  onImageError,
}: UseIdentityColumnParams): ColumnDef<ProductWithDetails, unknown> {
  const renderProductCell = useCallback(
    ({ row }: CellContext<ProductWithDetails, unknown>) => {
      const product = row.original
      return (
        <div className="flex items-center min-w-72">
          <div className="w-12 h-12 min-w-12 min-h-12 max-w-12 max-h-12 overflow-hidden bg-surface-elevated rounded-lg border border-border-soft flex items-center justify-center mr-3">
            <Image
              src={imageFallbacks[product.id] || !product.image ? "/dentypro-product-placeholder.png" : product.image}
              alt={product.productName}
              width={40}
              height={40}
              className={cn(
                "w-full h-full object-contain",
                imageFallbacks[product.id] || !product.image ? "scale-110" : "",
              )}
              onError={() => onImageError(product.id)}
            />
          </div>
          <div className="font-medium text-text-primary">{product.productName}</div>
        </div>
      )
    },
    [imageFallbacks, onImageError],
  )

  return {
    id: "product",
    header: ProductHeader,
    cell: renderProductCell,
    meta: {
      headerClassName: "w-80 px-6 py-4",
      cellClassName: "px-6 py-4",
    },
  }
}
