"use client"

import { useQuery } from "@tanstack/react-query"
import { useEffect, useState } from "react"
import DashboardPagination from "@/components/dashboard-shared/DashboardPagination"
import SurfaceCard from "@/components/ui/SurfaceCard"
import { adaptProductCardData } from "@/features/products/listing/components/listing/adaptProductCardData"
import ProductCard from "@/features/products/listing/components/listing/ProductCard"
import ProductCardSkeleton from "@/features/products/listing/components/listing/ProductCardSkeleton"
import { favoriteProductsListOptions } from "@/lib/query/options/favorite-products"
import { useFavoriteProductsStore } from "@/stores/favoriteProductsStore"

const PAGE_SIZE = 12

export default function FavoriteProductsTab() {
  const [page, setPage] = useState(0)

  const hydrate = useFavoriteProductsStore((s) => s.hydrate)
  const ids = useFavoriteProductsStore((s) => s.ids)
  const hasHydrated = useFavoriteProductsStore((s) => s.hasHydrated)

  useEffect(() => {
    void hydrate()
  }, [hydrate])

  const favoritesQuery = useQuery(favoriteProductsListOptions())
  const items = favoritesQuery.data ?? []
  const isLoading = favoritesQuery.isPending
  const hasError = favoritesQuery.isError

  // Each card's own heart button owns the toggle/rollback against the store; this tab only
  // reflects the store's current ids once it has hydrated, so an unfavorite click elsewhere
  // (e.g. a listing page) removes the card here too without a separate fetch.
  const visible = hasHydrated ? items.filter((p) => ids.has(p.productId)) : items

  if (isLoading) {
    return (
      <div aria-busy="true" className="@container">
        <span className="sr-only">Loading favorite products...</span>
        <div className="grid grid-cols-1 gap-5 @xl:grid-cols-2 @3xl:grid-cols-3 @min-[69rem]:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      </div>
    )
  }

  if (hasError) {
    return (
      <SurfaceCard variant="glass" className="p-6 text-sm text-text-secondary">
        Unable to load favorite products. Please try again later.
      </SurfaceCard>
    )
  }

  if (visible.length === 0) {
    return (
      <SurfaceCard variant="glass" className="p-6 text-sm text-text-secondary">
        No favorite products yet.
      </SurfaceCard>
    )
  }

  const totalPages = Math.max(1, Math.ceil(visible.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages - 1)
  const pageItems = visible.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE)

  return (
    <div className="@container">
      <div className="grid grid-cols-1 gap-5 @xl:grid-cols-2 @3xl:grid-cols-3 @min-[69rem]:grid-cols-4">
        {pageItems.map((p) => (
          <ProductCard key={p.productId} data={adaptProductCardData(p)} />
        ))}
      </div>
      <DashboardPagination
        currentPage={safePage}
        totalPages={totalPages}
        totalElements={visible.length}
        pageSize={PAGE_SIZE}
        onPageChange={setPage}
        className="mt-6"
      />
    </div>
  )
}
