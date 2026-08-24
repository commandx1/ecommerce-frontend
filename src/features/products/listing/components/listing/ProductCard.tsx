"use client"

import { Eye, Heart, Scale, Star, Truck } from "lucide-react"
import Link from "next/link"
import { SpotlightCard } from "@/components/ui/spotlight-card"
import formatCurrency from "@/lib/helpers/formatCurrency"
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
  const discount =
    data.oldPrice && data.oldPrice > data.price ? Math.round((1 - data.price / data.oldPrice) * 100) : null

  return (
    <SpotlightCard
      radius={28}
      className="group rounded-[1.75rem] shadow-soft transition-all hover:-translate-y-1 hover:shadow-panel"
    >
      {/* overflow-hidden on inner div so glow pseudo-elements aren't clipped */}
      <div className="flex flex-col overflow-hidden rounded-[1.75rem] bg-surface-elevated">
        <div className="relative h-44 bg-surface-muted sm:h-56 md:h-64">
          <ProductImageWithFallback
            src={data.imageSrc}
            alt={data.name}
            fill
            className="object-contain p-4 transition-transform duration-500 group-hover:scale-105 sm:p-6"
          />
          <button
            type="button"
            className="absolute right-2.5 top-2.5 flex h-8 w-8 items-center justify-center rounded-full border border-border-soft bg-surface-elevated/90 text-text-muted shadow-soft backdrop-blur-sm transition-colors hover:text-danger sm:right-4 sm:top-4 sm:h-10 sm:w-10"
            aria-label="Add to favorites"
          >
            <Heart className="h-4 w-4 sm:h-5 sm:w-5" />
          </button>
          {data.stock !== undefined && (
            <div className="absolute bottom-2.5 left-2.5 sm:bottom-4 sm:left-4">
              <div
                className={`flex items-center rounded-full border px-2.5 py-0.5 text-[0.6rem] font-bold uppercase tracking-[0.14em] shadow-soft backdrop-blur-sm sm:px-3 sm:py-1 sm:text-[0.7rem] sm:tracking-[0.16em] ${
                  data.stock > 0
                    ? "border-success/25 bg-surface-elevated/95 text-success"
                    : "border-border-soft bg-surface-elevated/95 text-text-muted"
                }`}
              >
                <div
                  className={`mr-1.5 h-1.5 w-1.5 rounded-full sm:mr-2 sm:h-2 sm:w-2 ${data.stock > 0 ? "bg-success" : "bg-text-muted"}`}
                />
                {data.stock > 0 ? "In Stock" : "Out of Stock"}
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-1 flex-col p-4 sm:p-6">
          <div className="mb-3 sm:mb-4">
            {data.brand && (
              <span className="rounded-full border border-border-soft bg-surface px-2.5 py-0.5 text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-text-muted sm:px-3 sm:py-1 sm:text-[0.72rem] sm:tracking-[0.18em]">
                {data.brand}
              </span>
            )}
            <h3 className="mt-2 mb-1.5 text-base font-semibold text-text-primary transition-colors group-hover:text-brand sm:mt-3 sm:mb-2 sm:text-lg md:text-xl">
              <Link href={data.href}>{data.name}</Link>
            </h3>
            <p className="line-clamp-2 text-xs leading-5 text-text-secondary sm:text-sm sm:leading-6">
              High-quality product from {data.brand ?? "verified supplier"} with clinical-grade procurement support.
            </p>
          </div>

          {data.overallStar !== undefined && (
            <div className="mb-3 flex items-center sm:mb-4">
              <div className="mr-2 flex text-warning">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${star <= Math.floor(data.overallStar!) ? "fill-current" : "text-border-strong"}`}
                  />
                ))}
              </div>
              <span className="text-xs font-medium text-text-secondary sm:text-sm">
                {data.overallStar.toFixed(1)} ({data.reviewCount ?? 0} reviews)
              </span>
            </div>
          )}

          <div className="mt-auto">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2 sm:mb-4 sm:gap-4">
              <div>
                <span className="text-xl font-semibold text-brand sm:text-2xl md:text-3xl">
                  {formatCurrency(data.price)}
                </span>
                {data.oldPrice && data.oldPrice > data.price ? (
                  <span className="ml-2 text-xs text-text-muted line-through sm:text-sm">
                    {formatCurrency(data.oldPrice)}
                  </span>
                ) : null}
              </div>
              {discount && (
                <div className="rounded-full bg-success/15 px-2.5 py-0.5 text-xs font-bold text-success sm:px-3 sm:py-1 sm:text-sm">
                  Save {discount}%
                </div>
              )}
            </div>

            <div className="mb-3 flex items-center rounded-2xl border border-border-soft bg-surface px-2.5 py-1.5 text-[0.7rem] text-text-secondary sm:mb-4 sm:px-3 sm:py-2 sm:text-xs">
              <Truck className="mr-2 h-3 w-3 shrink-0 text-brand sm:h-3.5 sm:w-3.5" />
              <span>Free shipping available</span>
            </div>

            <div className="flex gap-1.5 sm:gap-2">
              <button
                type="button"
                className="flex-1 rounded-full bg-brand py-2.5 text-xs font-bold text-white shadow-soft transition-all hover:-translate-y-0.5 hover:bg-brand-strong sm:py-3 sm:text-sm"
              >
                Add to Cart
              </button>
              <Link
                href={data.href}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border-strong text-brand transition-colors hover:bg-accent sm:h-11 sm:w-11"
              >
                <Eye className="h-4 w-4 sm:h-5 sm:w-5" />
              </Link>
              <button
                type="button"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border-soft text-text-muted transition-colors hover:border-brand/35 hover:text-brand sm:h-11 sm:w-11"
              >
                <Scale className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </SpotlightCard>
  )
}

export default ProductCard
