import { CheckCircle, Heart, Mail, Star, Truck } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import type React from "react"
import { useState } from "react"
import ConfirmPopover from "@/components/feedback/ConfirmPopover"
import { SpotlightCard } from "@/components/ui/spotlight-card"
import SupplierAboutText from "@/features/suppliers/components/SupplierAboutText"
import type { SupplierDirectoryItem } from "@/features/suppliers/suppliersPageData"
import { SHIPMENT_POLICY_DAYS, shipmentPolicyLabel } from "@/lib/api/company"
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

  // The backend sends shipmentPolicy as a free String; an unmapped value would read "Ships in undefined days".
  const shipmentLabel =
    supplier.shipmentPolicy && Object.hasOwn(SHIPMENT_POLICY_DAYS, supplier.shipmentPolicy)
      ? shipmentPolicyLabel(supplier.shipmentPolicy)
      : null
  const about = supplier.about?.trim()
  const hasFeatures = supplier.productCount > 0 || shipmentLabel !== null

  return (
    <SpotlightCard
      radius={28}
      className="h-full rounded-[1.75rem] shadow-soft transition-all hover:-translate-y-1 hover:shadow-panel"
    >
      <article className="flex h-full flex-col overflow-hidden rounded-[1.75rem] bg-surface-elevated p-8">
        <div className="mb-4 flex items-center justify-between">
          <span className="rounded-full bg-[color:color-mix(in_oklab,var(--success)_14%,var(--surface))] px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-success">
            Verified partner
          </span>
        </div>

        <div className="mb-6 flex items-center">
          <div className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-[1.25rem] border border-border-soft bg-surface shadow-soft">
            {isHttpUrl(supplier.companyPhoto) && !logoFailed ? (
              <Image
                src={supplier.companyPhoto as string}
                alt={`${supplier.name} logo`}
                fill
                sizes="64px"
                className="object-contain"
                onError={() => setLogoFailed(true)}
              />
            ) : (
              <span aria-hidden="true" className="text-lg font-semibold text-brand">
                {initials}
              </span>
            )}
          </div>
          <div className="ml-4 min-w-0">
            <h3 className="break-words text-xl font-semibold text-text-primary">{supplier.name}</h3>
            {supplier.location ? <p className="mt-1 text-sm text-text-secondary">{supplier.location}</p> : null}
            <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
              <div className="flex items-center gap-1 text-amber-400">
                {Array.from({ length: 5 }, (_, index) => (
                  <Star
                    key={`${supplier.id}-star-${index + 1}`}
                    className={cn(
                      "h-4 w-4",
                      index < Math.round(supplier.rating) ? "fill-current" : "text-border-strong",
                    )}
                  />
                ))}
              </div>
              <span className="text-sm font-semibold text-text-primary">{supplier.rating.toFixed(1)}</span>
              <span className="whitespace-nowrap text-sm text-text-secondary">
                ({numericFormatter.format(supplier.reviewCount)} ratings)
              </span>
            </div>
          </div>
        </div>

        {hasFeatures ? (
          <div className="mb-6 space-y-3">
            {supplier.productCount > 0 ? (
              <div className="flex items-center text-sm text-text-secondary">
                <CheckCircle className="mr-2 h-4 w-4 text-success" aria-hidden="true" />
                <span>
                  {numericFormatter.format(supplier.productCount)}{" "}
                  {supplier.productCount === 1 ? "Product" : "Products"} Available
                </span>
              </div>
            ) : null}
            {shipmentLabel ? (
              <div className="flex items-center text-sm text-text-secondary">
                <Truck className="mr-2 h-4 w-4 text-brand" aria-hidden="true" />
                <span>{shipmentLabel}</span>
              </div>
            ) : null}
          </div>
        ) : null}

        {/* The about box sits right above the actions (mt-auto) and reserves two lines, so boxes line up across a row. */}
        {about ? (
          <div className="mt-auto mb-5 rounded-[1.1rem] border border-border-soft bg-surface p-4">
            <div className="text-sm font-semibold text-text-primary">About this vendor</div>
            <SupplierAboutText text={about} className="mt-2 min-h-12 text-sm leading-6 text-text-secondary" />
          </div>
        ) : null}

        <div className={cn("flex items-center gap-3", !about && "mt-auto")}>
          <Link
            href={`/products?vendors=${supplier.id}`}
            className="flex-1 rounded-full bg-brand px-4 py-2.5 text-center font-medium text-white shadow-soft transition-all hover:-translate-y-0.5 hover:bg-brand-strong"
          >
            View Catalog
          </Link>
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
                  "inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-border-strong transition-colors hover:bg-accent",
                  supplier.isFavorite ? "text-rose-500 hover:text-rose-600" : "text-text-muted hover:text-rose-500",
                )}
                aria-label={supplier.isFavorite ? "Remove from favorites" : "Save to favorites"}
              >
                <Heart className={cn("h-5 w-5", supplier.isFavorite ? "fill-current" : "")} />
              </button>
            }
          />
          {supplier.email && (
            <a
              href={`mailto:${supplier.email}`}
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-border-strong text-text-secondary transition-colors hover:bg-accent hover:text-brand"
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
