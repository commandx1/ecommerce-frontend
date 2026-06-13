"use client"

import { LayoutGrid, Loader2, Rows3 } from "lucide-react"
import { useEffect, useState } from "react"
import SupplierDirectoryCard from "@/features/suppliers/components/SupplierDirectoryCard"
import SupplierDirectoryTable from "@/features/suppliers/components/SupplierDirectoryTable"
import { type VendorListItem, addVendorFavorite, getMyFavoriteVendors, removeVendorFavorite } from "@/lib/api/vendors"
import { showToast } from "@/components/ui/Toast"
import { cn } from "@/lib/utils"

type ViewMode = "grid" | "table"

export default function FavoriteSuppliersPage() {
  const [viewMode, setViewMode] = useState<ViewMode>("grid")
  const [vendors, setVendors] = useState<VendorListItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    getMyFavoriteVendors()
      .then(setVendors)
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
      if (restored) setVendors(restored)
    }
  }

  const supplierItems = vendors.map((v) => ({
    id: v.id,
    name: v.name,
    slug: v.slug,
    about: "",
    rating: v.averageRating,
    reviewCount: v.reviewCount,
    isFavorite: true,
  }))

  return (
    <section>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">Favorite Vendors</h1>
          <p className="mt-1 text-text-secondary">
            Quick access to your starred vendors. Switch between grid and table views.
          </p>
        </div>

        <div className="inline-flex items-center rounded-full border border-border-soft bg-surface-elevated p-1 shadow-soft">
          <button
            type="button"
            onClick={() => setViewMode("grid")}
            className={cn(
              "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-colors",
              viewMode === "grid" ? "bg-brand text-white" : "text-text-secondary hover:text-brand",
            )}
            aria-pressed={viewMode === "grid"}
          >
            <LayoutGrid className="h-4 w-4" />
            Grid
          </button>
          <button
            type="button"
            onClick={() => setViewMode("table")}
            className={cn(
              "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-colors",
              viewMode === "table" ? "bg-brand text-white" : "text-text-secondary hover:text-brand",
            )}
            aria-pressed={viewMode === "table"}
          >
            <Rows3 className="h-4 w-4" />
            Table
          </button>
        </div>
      </div>

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
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {supplierItems.map((supplier) => (
            <SupplierDirectoryCard
              key={supplier.id}
              supplier={supplier}
              onToggleFavorite={() => handleToggleFavorite(supplier.id as string)}
            />
          ))}
        </div>
      ) : (
        <SupplierDirectoryTable
          suppliers={supplierItems}
          onToggleFavorite={handleToggleFavorite}
        />
      )}
    </section>
  )
}
