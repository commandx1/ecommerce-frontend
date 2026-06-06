import { Heart, Mail, Star } from "lucide-react"
import Link from "next/link"
import { SpotlightCard } from "@/components/ui/spotlight-card"
import type { SupplierDirectoryItem } from "@/features/suppliers/suppliersPageData"
import { cn } from "@/lib/utils"

const numericFormatter = new Intl.NumberFormat("en-US")

export default function SupplierDirectoryCard({ supplier }: { supplier: SupplierDirectoryItem }) {
  return (
    <SpotlightCard className="rounded-[1.25rem] shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-panel">
    <article className="overflow-hidden rounded-[1.25rem] bg-surface-elevated p-6">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-xl font-semibold text-text-primary">{supplier.name}</h3>
          <p className="mt-1 text-sm text-text-secondary">{supplier.location}</p>
        </div>
        <button
          type="button"
          className={cn(
            "transition-colors",
            supplier.isFavorite ? "text-rose-500 hover:text-rose-600" : "text-text-muted hover:text-rose-500",
          )}
          aria-label="Save supplier"
        >
          <Heart className={cn("h-5 w-5", supplier.isFavorite ? "fill-current" : "")} />
        </button>
      </div>

      <div className="mb-3 flex items-center gap-2">
        <div className="flex items-center gap-1 text-amber-400">
          {Array.from({ length: 5 }, (_, index) => (
            <Star
              key={`${supplier.id}-star-${index + 1}`}
              className={cn("h-4 w-4", index < Math.round(supplier.rating) ? "fill-current" : "text-border-strong")}
            />
          ))}
        </div>
        <span className="text-sm font-semibold text-text-primary">{supplier.rating.toFixed(1)}</span>
        <span className="text-sm text-text-secondary">({numericFormatter.format(supplier.reviewCount)} ratings)</span>
      </div>

      <p className="mb-5 text-sm leading-6 text-text-secondary">{supplier.about}</p>

      <div className="mb-6">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-text-muted">Delivery Method</p>
        <div className="flex flex-wrap gap-2">
          {supplier.deliveryMethods.map((method) => (
            <span
              key={`${supplier.id}-${method}`}
              className="rounded-full bg-accent px-3 py-1 text-xs font-semibold text-brand-strong"
            >
              {method}
            </span>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Link
          href={`/products?supplier=${supplier.slug}`}
          className="flex-1 rounded-full bg-brand px-4 py-2.5 text-center text-sm font-semibold text-white transition-colors hover:bg-brand-strong"
        >
          View Products
        </Link>
        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border-soft text-text-secondary transition-colors hover:text-brand"
          aria-label="Contact supplier"
        >
          <Mail className="h-4 w-4" />
        </button>
      </div>
    </article>
    </SpotlightCard>
  )
}
