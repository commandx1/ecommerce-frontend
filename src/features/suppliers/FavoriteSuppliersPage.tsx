"use client"

import { Loader2 } from "lucide-react"
import { useEffect, useState } from "react"
import DashboardPagination from "@/components/dashboard-shared/DashboardPagination"
import { showToast } from "@/components/ui/Toast"
import SupplierDirectoryCard from "@/features/suppliers/components/SupplierDirectoryCard"
import { addVendorFavorite, getMyFavoriteVendors, removeVendorFavorite, type VendorListItem } from "@/lib/api/vendors"

const PAGE_SIZE = 12

export default function FavoriteSuppliersPage({ embedded = false }: { embedded?: boolean }) {
  const [vendors, setVendors] = useState<VendorListItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [page, setPage] = useState(0)

  useEffect(() => {
    getMyFavoriteVendors()
      // Array.isArray, not the raw response: `GET /vendors/favorites` is typed
      // `List<VendorListItemDto>` (VendorController:44-49), but a malformed 200 - a partial body,
      // a proxy hiccup - hands back something that is not an array. `vendors.some(...)` and
      // `vendors.map(...)` below run unconditionally, so an unguarded value blanks the page
      // (infra note #26 - the same root pattern found in nineteen other places this week).
      .then((favorites) => setVendors(Array.isArray(favorites) ? favorites : []))
      .catch(() => setHasError(true))
      .finally(() => setIsLoading(false))
  }, [])

  const handleToggleFavorite = async (vendorId: string) => {
    const isFav = vendors.some((v) => v.id === vendorId)
    setVendors((prev) => prev.filter((v) => v.id !== vendorId))
    try {
      if (isFav) await removeVendorFavorite(vendorId)
      else await addVendorFavorite(vendorId)
    } catch {
      showToast.error("Action failed", "Could not update favorites. Please try again.")
      const restored = await getMyFavoriteVendors().catch(() => null)
      if (Array.isArray(restored)) setVendors(restored)
    }
  }

  const supplierItems = vendors.map((v) => ({
    id: v.id,
    name: v.name,
    slug: v.slug,
    about: "",
    rating: v.averageRating,
    reviewCount: v.reviewCount,
    productCount: v.productCount,
    isFavorite: true,
  }))

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
        <div className="flex items-center justify-center py-24 text-text-muted">
          <Loader2 className="h-8 w-8 animate-spin" />
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
