"use client"

import { LayoutGrid, Rows3 } from "lucide-react"
import { useMemo, useState } from "react"
import SupplierDirectoryCard from "@/features/suppliers/components/SupplierDirectoryCard"
import SupplierDirectoryTable from "@/features/suppliers/components/SupplierDirectoryTable"
import { suppliersDirectoryData } from "@/features/suppliers/suppliersPageData"
import { cn } from "@/lib/utils"

type ViewMode = "grid" | "table"

export default function FavoriteSuppliersPage() {
  const [viewMode, setViewMode] = useState<ViewMode>("grid")

  const favoriteSuppliers = useMemo(() => suppliersDirectoryData.filter((supplier) => Boolean(supplier.isFavorite)), [])

  return (
    <section>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">Favorite Suppliers</h1>
          <p className="mt-1 text-text-secondary">
            Quick access to your starred suppliers. Switch between grid and table views.
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

      {favoriteSuppliers.length === 0 ? (
        <div className="rounded-[1.25rem] border border-border-soft bg-surface-elevated p-6 text-sm text-text-secondary">
          No favorite suppliers yet.
        </div>
      ) : null}

      {favoriteSuppliers.length > 0 && viewMode === "grid" ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {favoriteSuppliers.map((supplier) => (
            <SupplierDirectoryCard key={supplier.id} supplier={supplier} />
          ))}
        </div>
      ) : null}

      {favoriteSuppliers.length > 0 && viewMode === "table" ? <SupplierDirectoryTable suppliers={favoriteSuppliers} /> : null}
    </section>
  )
}
