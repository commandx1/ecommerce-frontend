"use client"

import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import DashboardPagination from "@/components/dashboard-shared/DashboardPagination"
import { showToast } from "@/components/ui/Toast"
import SupplierDirectoryCard from "@/features/suppliers/components/SupplierDirectoryCard"
import { SupplierCardSkeleton } from "@/features/suppliers/components/SuppliersDirectorySection.client"
import { vendorToSupplierItem } from "@/features/suppliers/suppliersPageData"
import { addVendorFavorite, removeVendorFavorite, type VendorListItem } from "@/lib/api/vendors"
import { queryKeys } from "@/lib/query/keys"
import { vendorFavoritesListOptions } from "@/lib/query/options/vendors"

const PAGE_SIZE = 12

export default function FavoriteSuppliersPage({ embedded = false }: { embedded?: boolean }) {
  const queryClient = useQueryClient()
  const favoritesQuery = useQuery(vendorFavoritesListOptions())
  // Array.isArray, not the raw response: `GET /vendors/favorites` is typed
  // `List<VendorListItemDto>` (VendorController:44-49), but a malformed 200 - a partial body,
  // a proxy hiccup - hands back something that is not an array. `vendors.some(...)` and
  // `vendors.map(...)` below run unconditionally, so an unguarded value blanks the page
  // (infra note #26 - the same root pattern found in nineteen other places this week).
  const vendors = Array.isArray(favoritesQuery.data) ? favoritesQuery.data : []
  const isLoading = favoritesQuery.isPending
  const hasError = favoritesQuery.isError
  const [page, setPage] = useState(0)

  const handleToggleFavorite = async (vendorId: string) => {
    const isFav = vendors.some((v) => v.id === vendorId)
    queryClient.setQueryData<VendorListItem[]>(queryKeys.vendors.favorites.list(), (old = []) =>
      old.filter((v) => v.id !== vendorId),
    )
    try {
      if (isFav) await removeVendorFavorite(vendorId)
      else await addVendorFavorite(vendorId)
    } catch {
      showToast.error("Action failed", "Could not update favorites. Please try again.")
      await queryClient.refetchQueries({ queryKey: queryKeys.vendors.favorites.list() })
    }
  }

  const supplierItems = vendors.map((v) => ({ ...vendorToSupplierItem(v), isFavorite: true }))

  const totalPages = Math.max(1, Math.ceil(supplierItems.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages - 1)
  const pageItems = supplierItems.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE)

  return (
    <section>
      {embedded ? null : (
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-text-primary">Favorite Vendors</h1>
          <p className="mt-1 text-text-secondary">Quick access to your starred vendors.</p>
        </div>
      )}

      {isLoading ? (
        <div aria-busy="true" className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          <span className="sr-only">Loading favorite vendors...</span>
          {[0, 1, 2].map((i) => (
            <SupplierCardSkeleton key={i} />
          ))}
        </div>
      ) : hasError ? (
        <div className="rounded-[1.25rem] border border-border-soft bg-surface-elevated p-6 text-sm text-text-secondary">
          Unable to load favorite vendors. Please try again later.
        </div>
      ) : supplierItems.length === 0 ? (
        <div className="rounded-[1.25rem] border border-border-soft bg-surface-elevated p-6 text-sm text-text-secondary">
          No favorite vendors yet.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {pageItems.map((supplier) => (
              <SupplierDirectoryCard
                key={supplier.id}
                supplier={supplier}
                onToggleFavorite={() => handleToggleFavorite(supplier.id as string)}
              />
            ))}
          </div>
          <DashboardPagination
            currentPage={safePage}
            totalPages={totalPages}
            totalElements={supplierItems.length}
            pageSize={PAGE_SIZE}
            onPageChange={setPage}
            className="mt-6"
          />
        </>
      )}
    </section>
  )
}
