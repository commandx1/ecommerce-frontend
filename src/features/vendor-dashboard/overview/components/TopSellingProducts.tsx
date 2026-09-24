"use client"

import Image from "next/image"
import Link from "next/link"
import { useCallback, useEffect, useRef, useState } from "react"
import DashboardPanel from "@/app/vendor-dashboard/components/shared/DashboardPanel"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { getFullImageUrl } from "@/lib/api/products"
import { type VendorTopSellingProduct, vendorDashboardAPI } from "@/lib/api/vendor-dashboard"
import { useAuthStore } from "@/stores/authStore"

const PLACEHOLDER_IMAGE = "/dentypro-product-placeholder.png"

const TopSellingProducts = () => {
  const { isAuthenticated } = useAuthStore()
  const [products, setProducts] = useState<VendorTopSellingProduct[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [fetchError, setFetchError] = useState(false)
  const [imageFallbacks, setImageFallbacks] = useState<Record<string, boolean>>({})
  const abortControllerRef = useRef<AbortController | null>(null)

  const fetchTopSellingProducts = useCallback(async () => {
    if (!isAuthenticated) return

    abortControllerRef.current?.abort()
    const controller = new AbortController()
    abortControllerRef.current = controller

    try {
      setIsLoading(true)
      setFetchError(false)
      const response = await vendorDashboardAPI.getTopSellingProducts(0, 4, 30, "desc", controller.signal)
      // Guard against a malformed 200 body — `content` missing, null, or not an array would
      // otherwise throw on `.map` and blank the whole dashboard (infra note #26).
      setProducts(Array.isArray(response.content) ? response.content : [])
    } catch {
      if (controller.signal.aborted) return
      setProducts([])
      setFetchError(true)
    } finally {
      if (!controller.signal.aborted) {
        setIsLoading(false)
      }
    }
  }, [isAuthenticated])

  useEffect(() => {
    void fetchTopSellingProducts()

    return () => {
      abortControllerRef.current?.abort()
    }
  }, [fetchTopSellingProducts])

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
          {[0, 1, 2, 3].map((placeholder) => (
            <Skeleton key={placeholder} className="h-16 rounded-xl" />
          ))}
        </div>
      ) : fetchError ? (
        <div className="flex flex-col items-center justify-center gap-3 px-6 py-10 text-center">
          <p className="text-sm font-medium text-danger">Couldn't load top selling products. Please try again.</p>
          <Button
            type="button"
            variant="outline"
            onClick={() => void fetchTopSellingProducts()}
            className="rounded-lg px-4"
          >
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
