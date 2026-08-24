import { Heart, Mail, Star } from "lucide-react"
import Link from "next/link"
import type { SupplierDirectoryItem } from "@/features/suppliers/suppliersPageData"
import { cn } from "@/lib/utils"

const numericFormatter = new Intl.NumberFormat("en-US")

interface SupplierDirectoryTableProps {
  suppliers: ReadonlyArray<SupplierDirectoryItem>
  onToggleFavorite?: (id: string) => void
}

export default function SupplierDirectoryTable({ suppliers, onToggleFavorite }: SupplierDirectoryTableProps) {
  if (suppliers.length === 0) {
    return (
      <div className="rounded-[1.25rem] border border-border-soft bg-surface-elevated p-6 text-sm text-text-secondary">
        No supplier data available.
      </div>
    )
  }

  return (
    <section className="overflow-hidden rounded-[1.25rem] border border-border-soft bg-surface-elevated shadow-soft">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[860px]">
          <thead className="border-b border-border-soft bg-surface-muted/60">
            <tr>
              <th className="px-5 py-4 text-center text-xs font-semibold uppercase tracking-[0.18em] text-text-muted">
                Supplier
              </th>
              <th className="px-5 py-4 text-center text-xs font-semibold uppercase tracking-[0.18em] text-text-muted">
                Category
              </th>
              <th className="px-5 py-4 text-center text-xs font-semibold uppercase tracking-[0.18em] text-text-muted">
                Location
              </th>
              <th className="px-5 py-4 text-center text-xs font-semibold uppercase tracking-[0.18em] text-text-muted">
                Rating
              </th>
              <th className="px-5 py-4 text-center text-xs font-semibold uppercase tracking-[0.18em] text-text-muted">
                Delivery
              </th>
              <th className="px-5 py-4 text-center text-xs font-semibold uppercase tracking-[0.18em] text-text-muted">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {suppliers.map((supplier) => (
              <tr key={supplier.id} className="border-b border-border-soft/70 last:border-b-0">
                <td className="px-5 py-4">
                  <div className="flex items-start justify-center gap-3">
                    <button
                      type="button"
                      onClick={() => onToggleFavorite?.(String(supplier.id))}
                      className={cn(
                        "mt-0.5 transition-colors",
                        supplier.isFavorite
                          ? "text-rose-500 hover:text-rose-600"
                          : "text-text-muted hover:text-rose-500",
                      )}
                      aria-label={supplier.isFavorite ? "Remove from favorites" : "Save to favorites"}
                    >
                      <Heart className={cn("h-4 w-4", supplier.isFavorite ? "fill-current" : "")} />
                    </button>
                    <div>
                      <p className="font-semibold text-text-primary">{supplier.name}</p>
                      {supplier.about ? (
                        <p className="mt-1 line-clamp-2 text-xs leading-5 text-text-secondary">{supplier.about}</p>
                      ) : null}
                    </div>
                  </div>
                </td>
                <td className="px-5 py-4 text-center text-sm font-medium text-text-primary">{supplier.category}</td>
                <td className="px-5 py-4 text-center text-sm text-text-secondary">{supplier.location}</td>
                <td className="px-5 py-4">
                  <div className="flex items-center justify-center gap-2">
                    <div className="flex items-center gap-1 text-amber-400">
                      {Array.from({ length: 5 }, (_, index) => (
                        <Star
                          key={`${supplier.id}-table-star-${index + 1}`}
                          className={cn(
                            "h-3.5 w-3.5",
                            index < Math.round(supplier.rating) ? "fill-current" : "text-border-strong",
                          )}
                        />
                      ))}
                    </div>
                    <span className="text-sm font-semibold text-text-primary">{supplier.rating.toFixed(1)}</span>
                    <span className="text-xs text-text-secondary">
                      ({numericFormatter.format(supplier.reviewCount)})
                    </span>
                  </div>
                </td>
                <td className="px-5 py-4">
                  <div className="flex flex-wrap justify-center gap-1.5">
                    {(supplier.deliveryMethods ?? []).slice(0, 2).map((deliveryMethod) => (
                      <span
                        key={`${supplier.id}-${deliveryMethod}`}
                        className="rounded-full bg-accent px-2.5 py-1 text-[11px] font-semibold text-brand-strong"
                      >
                        {deliveryMethod}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-5 py-4">
                  <div className="flex justify-center gap-2">
                    <Link
                      href={`/products?vendor=${supplier.slug}`}
                      className="rounded-full bg-brand px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-brand-strong"
                    >
                      View Products
                    </Link>
                    <button
                      type="button"
                      className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border-soft text-text-secondary transition-colors hover:text-brand"
                      aria-label="Contact supplier"
                    >
                      <Mail className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
