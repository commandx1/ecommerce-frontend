import { Heart, Mail, Star, Truck } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import type React from "react"
import { useState } from "react"
import ConfirmPopover from "@/components/feedback/ConfirmPopover"
import { SpotlightCard } from "@/components/ui/spotlight-card"
import SupplierAboutText from "@/features/suppliers/components/SupplierAboutText"
import type { SupplierDirectoryItem } from "@/features/suppliers/suppliersPageData"
import { shipmentPolicyLabel } from "@/lib/api/company"
import { cn, isHttpUrl } from "@/lib/utils"

const numericFormatter = new Intl.NumberFormat("en-US")

export default function SupplierDirectoryCard({
  supplier,
  onToggleFavorite,
}: {
  supplier: SupplierDirectoryItem
  onToggleFavorite?: () => void
}) {
  const [open, setOpen] = useState(false)
  const [logoFailed, setLogoFailed] = useState(false)

  const initials =
    supplier.name
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word[0]?.toUpperCase())
      .join("") || "?"

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    if (supplier.isFavorite) {
      setOpen(true)
      return
    }
    onToggleFavorite?.()
  }

  return (
    <SpotlightCard className="h-full rounded-[1.25rem] shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-panel">
      <article className="flex h-full flex-col overflow-hidden rounded-[1.25rem] bg-surface-elevated p-6">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-border-soft bg-surface">
              {isHttpUrl(supplier.companyPhoto) && !logoFailed ? (
                <Image
                  src={supplier.companyPhoto as string}
                  alt={`${supplier.name} logo`}
                  fill
                  sizes="56px"
                  className="object-contain"
                  onError={() => setLogoFailed(true)}
                />
              ) : (
                <span aria-hidden="true" className="text-lg font-semibold text-brand">
                  {initials}
                </span>
              )}
            </div>
            <div className="min-w-0">
              <h3 className="text-xl font-semibold text-text-primary">{supplier.name}</h3>
              {supplier.location ? <p className="mt-1 text-sm text-text-secondary">{supplier.location}</p> : null}
            </div>
          </div>
          <ConfirmPopover
            open={open}
            onOpenChange={setOpen}
            title="Remove from favorites?"
            description="This supplier will be removed from your favorites."
            confirmText="Remove"
            onConfirm={() => {
              onToggleFavorite?.()
              setOpen(false)
            }}
            trigger={
              <button
                type="button"
                onClick={handleClick}
                className={cn(
                  "transition-colors",
                  supplier.isFavorite ? "text-rose-500 hover:text-rose-600" : "text-text-muted hover:text-rose-500",
                )}
                aria-label={supplier.isFavorite ? "Remove from favorites" : "Save to favorites"}
              >
                <Heart className={cn("h-5 w-5", supplier.isFavorite ? "fill-current" : "")} />
              </button>
            }
          />
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

        {supplier.shipmentPolicy ? (
          <span className="mb-3 inline-flex w-fit items-center gap-1.5 rounded-full bg-surface-muted px-2.5 py-1 text-xs font-medium text-text-secondary">
            <Truck className="h-3.5 w-3.5" aria-hidden="true" />
            {shipmentPolicyLabel(supplier.shipmentPolicy)}
          </span>
        ) : null}

        {supplier.about ? (
          <SupplierAboutText text={supplier.about} className="mb-5 text-sm leading-6 text-text-secondary" />
        ) : null}

        <div className="mt-auto flex items-center gap-3">
          <Link
            href={`/products?vendors=${supplier.id}`}
            className="flex-1 rounded-full bg-brand px-4 py-2.5 text-center text-sm font-semibold text-white transition-colors hover:bg-brand-strong"
          >
            View {supplier.productCount > 0 ? `${numericFormatter.format(supplier.productCount)} ` : ""}Products
          </Link>
          {supplier.email && (
            <a
              href={`mailto:${supplier.email}`}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border-soft text-text-secondary transition-colors hover:text-brand"
              aria-label="Contact supplier"
            >
              <Mail className="h-4 w-4" />
            </a>
          )}
        </div>
      </article>
    </SpotlightCard>
  )
}
