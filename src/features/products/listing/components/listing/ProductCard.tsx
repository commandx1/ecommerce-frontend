"use client"

import { Eye, Heart, Scale, Star, Truck } from "lucide-react"
import Link from "next/link"
import { SpotlightCard } from "@/components/ui/spotlight-card"
import ProductImageWithFallback from "../ProductImageWithFallback"

export interface ProductCardData {
  id: number | string
  name: string
  brand?: string | null
  imageSrc: string
  price: number
  oldPrice?: number | null
  overallStar?: number
  reviewCount?: number
  stock?: number
  href: string
}

interface ProductCardProps {
  data: ProductCardData
}

const ProductCard = ({ data }: ProductCardProps) => {
  const discount = data.oldPrice && data.oldPrice > data.price
    ? Math.round((1 - data.price / data.oldPrice) * 100)
    : null

  return (
    <SpotlightCard radius={28} className="group rounded-[1.75rem] shadow-soft transition-all hover:-translate-y-1 hover:shadow-panel">
      {/* overflow-hidden on inner div so glow pseudo-elements aren't clipped */}
      <div className="flex flex-col overflow-hidden rounded-[1.75rem] bg-surface-elevated">
        <div className="relative h-64 bg-surface-muted">
          <ProductImageWithFallback
            src={data.imageSrc}
            alt={data.name}
            fill
            className="object-contain p-6 transition-transform duration-500 group-hover:scale-105"
          />
          <button
            type="button"
            className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full border border-border-soft bg-surface-elevated/90 text-text-muted shadow-soft backdrop-blur-sm transition-colors hover:text-danger"
            aria-label="Add to favorites"
          >
            <Heart className="h-5 w-5" />
          </button>
          {data.stock !== undefined && (
            <div className="absolute bottom-4 left-4">
              <div
                className={`flex items-center rounded-full border px-3 py-1 text-[0.7rem] font-bold uppercase tracking-[0.16em] shadow-soft backdrop-blur-sm ${
                  data.stock > 0
                    ? "border-success/25 bg-surface-elevated/95 text-success"
                    : "border-border-soft bg-surface-elevated/95 text-text-muted"
                }`}
              >
                <div className={`mr-2 h-2 w-2 rounded-full ${data.stock > 0 ? "bg-success" : "bg-text-muted"}`} />
                {data.stock > 0 ? "In Stock" : "Out of Stock"}
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-1 flex-col p-6">
          <div className="mb-4">
            {data.brand && (
              <span className="rounded-full border border-border-soft bg-surface px-3 py-1 text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-text-muted">
                {data.brand}
              </span>
            )}
            <h3 className="mt-3 mb-2 text-xl font-semibold text-text-primary transition-colors group-hover:text-brand">
              <Link href={data.href}>{data.name}</Link>
            </h3>
            <p className="line-clamp-2 text-sm leading-6 text-text-secondary">
              High-quality product from {data.brand ?? "verified supplier"} with clinical-grade procurement support.
            </p>
          </div>

          {data.overallStar !== undefined && (
            <div className="mb-4 flex items-center">
              <div className="mr-2 flex text-warning">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`h-4 w-4 ${star <= Math.floor(data.overallStar!) ? "fill-current" : "text-border-strong"}`}
                  />
                ))}
              </div>
              <span className="text-sm font-medium text-text-secondary">
                {data.overallStar} ({data.reviewCount ?? 0} reviews)
              </span>
            </div>
          )}

          <div className="mt-auto">
            <div className="mb-4 flex items-center justify-between gap-4">
              <div>
                <span className="text-3xl font-semibold text-brand">${data.price.toFixed(2)}</span>
                {data.oldPrice && data.oldPrice > data.price ? (
                  <span className="ml-2 text-sm text-text-muted line-through">${data.oldPrice.toFixed(2)}</span>
                ) : null}
              </div>
              {discount && (
                <div className="rounded-full bg-success/15 px-3 py-1 text-sm font-bold text-success">
                  Save {discount}%
                </div>
              )}
            </div>

            <div className="mb-4 flex items-center rounded-2xl border border-border-soft bg-surface px-3 py-2 text-xs text-text-secondary">
              <Truck className="mr-2 h-3.5 w-3.5 text-brand" />
              <span>Free shipping available</span>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                className="flex-1 rounded-full bg-brand py-3 text-sm font-bold text-white shadow-soft transition-all hover:-translate-y-0.5 hover:bg-brand-strong"
              >
                Add to Cart
              </button>
              <Link
                href={data.href}
                className="flex h-11 w-11 items-center justify-center rounded-full border border-border-strong text-brand transition-colors hover:bg-accent"
              >
                <Eye className="h-5 w-5" />
              </Link>
              <button
                type="button"
                className="flex h-11 w-11 items-center justify-center rounded-full border border-border-soft text-text-muted transition-colors hover:border-brand/35 hover:text-brand"
              >
                <Scale className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </SpotlightCard>
  )
}

export default ProductCard
