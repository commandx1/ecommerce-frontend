"use client"

import Image from "next/image"
import Link from "next/link"
import { useState } from "react"
import DashboardPanel from "@/components/dashboard-shared/DashboardPanel"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { getFullImageUrl } from "@/lib/api/products"
import { useTopSellingProductsQuery } from "../hooks/useOverviewQueries"

const PLACEHOLDER_IMAGE = "/dentypro-product-placeholder.png"
const SKELETON_ROW_IDS = ["row-1", "row-2", "row-3", "row-4"] as const

const TopSellingProducts = () => {
  const { isLoading, fetchError, products, refetch } = useTopSellingProductsQuery()
  const [imageFallbacks, setImageFallbacks] = useState<Record<string, boolean>>({})

  return (
    <DashboardPanel
      title="Top Selling Products"
      action={
        <Link
          href="/vendor-dashboard/products"
          className="text-sm text-brand transition-colors hover:text-brand-strong"
        >
          View All
        </Link>
      }
    >
      {isLoading ? (
        <div className="space-y-4">
          {SKELETON_ROW_IDS.map((id) => (
            <Skeleton key={id} className="h-16 rounded-xl" />
          ))}
        </div>
      ) : fetchError ? (
        <div className="flex flex-col items-center justify-center gap-3 px-6 py-10 text-center">
          <p className="text-sm font-medium text-danger">Couldn't load top selling products. Please try again.</p>
          <Button type="button" variant="outline" onClick={refetch} className="rounded-lg px-4">
            Retry
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {products.map((product) => {
            const imageSrc = imageFallbacks[product.userProductId]
              ? PLACEHOLDER_IMAGE
              : getFullImageUrl(product.coverPhotoPath) || PLACEHOLDER_IMAGE

            return (
              <Link
                key={product.userProductId}
                href={`/vendor-dashboard/products?userProductId=${product.userProductId}`}
                className="flex items-center rounded-xl border border-border-soft bg-surface-muted/70 p-4 transition-colors hover:bg-surface-muted"
              >
                <div className="mr-4 flex h-12 w-12 items-center justify-center rounded-lg border border-border-soft bg-surface-elevated">
                  <Image
                    src={imageSrc}
                    alt={product.name}
                    width={32}
                    height={32}
                    className="w-8 h-8 object-contain"
                    onError={() => setImageFallbacks((prev) => ({ ...prev, [product.userProductId]: true }))}
                  />
                </div>
                <div className="flex-1">
                  <div className="font-medium text-text-primary">{product.name}</div>
                  <div className="text-sm text-text-secondary">
                    SKU: {product.skuCode ?? product.manufacturerCode ?? "—"}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-text-primary">{product.sellCount} sold</div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </DashboardPanel>
  )
}

export default TopSellingProducts
