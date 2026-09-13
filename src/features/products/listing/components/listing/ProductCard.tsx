"use client"

import { Minus, Plus, Star } from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import { SpotlightCard } from "@/components/ui/spotlight-card"
import FavoriteProductButton from "@/features/products/favorites/FavoriteProductButton"
import { useAddToCartFromCard } from "@/features/products/listing/hooks/useAddToCartFromCard"
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
  favoriteProductId?: string
}

interface ProductCardProps {
  data: ProductCardData
}

const ProductCard = ({ data }: ProductCardProps) => {
  const discount =
    data.oldPrice && data.oldPrice > data.price ? Math.round((1 - data.price / data.oldPrice) * 100) : null
  const { addToCart, pendingProductId } = useAddToCartFromCard()
  const productId = String(data.id)
  const isOutOfStock = data.stock !== undefined && data.stock <= 0
  const isPending = pendingProductId === productId
  const [quantity, setQuantity] = useState(1)
  const maxQuantity = data.stock !== undefined && data.stock > 0 ? data.stock : 999
  const setClamped = (v: number) => setQuantity(Math.min(maxQuantity, Math.max(1, v)))

  return (
    <SpotlightCard
      radius={28}
      className="group rounded-[1.75rem] shadow-soft transition-all hover:-translate-y-1 hover:shadow-panel"
    >
      {/* overflow-hidden on inner div so glow pseudo-elements aren't clipped */}
      <div className="relative isolate flex h-full flex-col overflow-hidden rounded-[1.75rem] bg-surface-elevated">
        <div className="relative h-44 bg-surface-muted sm:h-56 md:h-64">
          <ProductImageWithFallback
            src={data.imageSrc}
            alt={data.name}
            fill
            className="object-contain p-4 transition-transform duration-500 group-hover:scale-105 sm:p-6"
          />
          {data.favoriteProductId && (
            <div className="absolute right-2.5 top-2.5 z-10 sm:right-4 sm:top-4">
              <FavoriteProductButton productId={data.favoriteProductId} />
            </div>
          )}
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

        <div className="flex flex-1 flex-col p-4 sm:p-5">
          <div className="mb-3 sm:mb-4">
            {data.brand && (
              <span className="rounded-full border border-border-soft bg-surface px-2.5 py-0.5 text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-text-muted sm:px-3 sm:py-1 sm:text-[0.72rem] sm:tracking-[0.18em]">
                {data.brand}
              </span>
            )}
            <h3 className="mt-2 mb-1.5 text-base font-semibold text-text-primary transition-colors group-hover:text-brand sm:mt-3 sm:mb-2 sm:text-lg md:text-xl">
              <Link href={data.href} className="after:absolute after:inset-0 after:content-['']">
                {data.name}
              </Link>
            </h3>
          </div>

          {data.overallStar !== undefined && (
            <div className="mb-2 flex items-center">
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
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
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

            <div className="relative z-10 flex items-center gap-2">
              <div className="flex h-9 shrink-0 items-center rounded-full border border-border-strong bg-surface">
                <button
                  type="button"
                  aria-label="Decrease quantity"
                  disabled={quantity <= 1 || isPending || isOutOfStock}
                  onClick={() => setClamped(quantity - 1)}
                  className="flex h-full w-7 items-center justify-center rounded-l-full text-text-secondary transition-colors hover:text-brand disabled:opacity-30"
                >
                  <Minus className="h-3.5 w-3.5" />
                </button>
                <input
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={maxQuantity}
                  value={quantity}
                  aria-label={`Quantity for ${data.name}`}
                  disabled={isPending || isOutOfStock}
                  onChange={(e) => setClamped(Number(e.target.value))}
                  onBlur={() => {
                    if (!Number.isFinite(quantity) || quantity < 1) setQuantity(1)
                  }}
                  className="h-full w-8 border-x border-border-strong bg-transparent text-center text-xs font-semibold text-text-primary outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                />
                <button
                  type="button"
                  aria-label="Increase quantity"
                  disabled={quantity >= maxQuantity || isPending || isOutOfStock}
                  onClick={() => setClamped(quantity + 1)}
                  className="flex h-full w-7 items-center justify-center rounded-r-full text-text-secondary transition-colors hover:text-brand disabled:opacity-30"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
              <button
                type="button"
                onClick={async () => {
                  const ok = await addToCart(productId, data.name, quantity)
                  if (ok) setQuantity(1)
                }}
                disabled={isPending || isOutOfStock}
                aria-busy={isPending}
                className="h-9 min-w-0 flex-1 rounded-full bg-brand text-xs font-bold text-white shadow-soft transition-all hover:-translate-y-0.5 hover:bg-brand-strong disabled:cursor-not-allowed disabled:opacity-60 sm:text-sm"
              >
                {isOutOfStock ? "Out of Stock" : isPending ? "Adding..." : "Add to Cart"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </SpotlightCard>
  )
}

export default ProductCard
