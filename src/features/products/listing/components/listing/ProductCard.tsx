"use client"

import { Minus, Plus, ShoppingCart, Star } from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import { SpotlightCard } from "@/components/ui/spotlight-card"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
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

const PILL =
  "inline-flex h-7 items-center gap-1.5 rounded-full px-3 text-[0.68rem] font-semibold tracking-[0.04em] shadow-sm ring-1 ring-black/5 backdrop-blur"

/**
 * Listing card in the same visual language as the category tiles: the photo sits in a rounded
 * "mat", every status (brand, stock, saving, favourite) lives as a pill over the photo, and the
 * body is just name, rating, price and one action row. The title link is stretched over the
 * card; the stepper and cart button sit above it (z-10) so they stay clickable.
 */
const ProductCard = ({ data }: ProductCardProps) => {
  const discount =
    data.oldPrice && data.oldPrice > data.price ? Math.round((1 - data.price / data.oldPrice) * 100) : null
  const { addToCart, pendingProductId } = useAddToCartFromCard()
  const productId = String(data.id)
  const isOutOfStock = data.stock !== undefined && data.stock <= 0
  // A local const (unlike `data.overallStar`) keeps its narrowed, non-undefined type inside the
  // .map() closure below.
  const overallStar = data.overallStar
  const isPending = pendingProductId === productId
  const [quantity, setQuantity] = useState(1)
  const maxQuantity = data.stock !== undefined && data.stock > 0 ? data.stock : 999
  const setClamped = (v: number) => setQuantity(Math.min(maxQuantity, Math.max(1, v)))
  const disabled = isPending || isOutOfStock

  return (
    <SpotlightCard
      radius={28}
      className="group h-full rounded-[1.75rem] shadow-soft transition-[transform,box-shadow] duration-200 ease-out hover:-translate-y-0.5 hover:shadow-panel"
    >
      {/* overflow-hidden on inner div so glow pseudo-elements aren't clipped */}
      <div className="relative isolate flex h-full flex-col overflow-hidden rounded-[1.75rem] bg-surface-elevated p-2">
        <div className="relative aspect-[4/3] overflow-hidden rounded-[1.25rem] bg-[#F5F7FA]">
          <ProductImageWithFallback
            src={data.imageSrc}
            alt={data.name}
            fill
            sizes="(min-width: 1280px) 25vw, (min-width: 768px) 50vw, 100vw"
            className="object-contain p-6 transition-transform duration-500 ease-out group-hover:scale-[1.04]"
          />

          {data.brand && (
            <span className={`${PILL} absolute left-3 top-3 z-10 bg-white/85 uppercase text-[#0F172A]`}>
              {data.brand}
            </span>
          )}

          {data.favoriteProductId && (
            <div className="absolute right-3 top-3 z-10">
              <FavoriteProductButton productId={data.favoriteProductId} className="h-9 w-9 shadow-sm" />
            </div>
          )}

          {data.stock !== undefined && (
            <span
              className={`${PILL} absolute bottom-3 left-3 z-10 ${
                data.stock > 0 ? "bg-white/85 text-success" : "bg-[#0F172A]/80 text-white"
              }`}
            >
              <span
                aria-hidden
                className={`h-1.5 w-1.5 rounded-full ${data.stock > 0 ? "bg-success" : "bg-white/70"}`}
              />
              {data.stock > 0 ? "In Stock" : "Out of Stock"}
            </span>
          )}

          {discount && (
            <span className={`${PILL} absolute bottom-3 right-3 z-10 bg-brand text-white`}>Save {discount}%</span>
          )}
        </div>

        <div className="flex flex-1 flex-col px-3 pb-3 pt-4">
          <h3 className="line-clamp-2 min-h-[2.6rem] text-[0.95rem] font-semibold leading-[1.3rem] text-text-primary transition-colors duration-200 group-hover:text-brand">
            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  href={data.href}
                  // MITIGATION, not a root fix - do not remove without re-measuring. A soft
                  // navigation to /products/[id] intermittently committed an EMPTY segment; the
                  // route is `force-dynamic`, so its prefetch only caches the loading shell anyway,
                  // and disabling it made the failure disappear (1/108 runs -> 0/324). See skeleton.md.
                  prefetch={false}
                  className="outline-none after:absolute after:inset-0 after:rounded-[1.75rem] after:content-['']"
                >
                  {data.name}
                </Link>
              </TooltipTrigger>
              <TooltipContent side="top" align="start">
                {data.name}
              </TooltipContent>
            </Tooltip>
          </h3>

          {overallStar !== undefined && (
            <div className="mt-2 flex items-center gap-2">
              <div aria-hidden className="flex text-warning">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`h-3.5 w-3.5 ${star <= Math.floor(overallStar) ? "fill-current" : "text-border-strong"}`}
                  />
                ))}
              </div>
              <span className="text-xs tabular-nums text-text-secondary">
                {overallStar.toFixed(1)} ({data.reviewCount ?? 0} reviews)
              </span>
            </div>
          )}

          <div className="mt-auto pt-4">
            <div className="flex items-baseline gap-2">
              <span className="font-display text-2xl tabular-nums tracking-[-0.02em] text-text-primary">
                {formatCurrency(data.price)}
              </span>
              {data.oldPrice && data.oldPrice > data.price ? (
                <span className="text-sm tabular-nums text-text-muted line-through">
                  {formatCurrency(data.oldPrice)}
                </span>
              ) : null}
            </div>

            <div className="relative z-10 mt-3 flex items-center gap-2">
              <div className="flex h-10 shrink-0 items-center rounded-full border border-border-soft bg-surface">
                <button
                  type="button"
                  aria-label="Decrease quantity"
                  disabled={quantity <= 1 || disabled}
                  onClick={() => setClamped(quantity - 1)}
                  className="flex h-full w-9 items-center justify-center rounded-l-full text-text-secondary transition-colors duration-150 hover:text-brand disabled:opacity-30"
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
                  disabled={disabled}
                  onChange={(e) => setClamped(Number(e.target.value))}
                  onBlur={() => {
                    if (!Number.isFinite(quantity) || quantity < 1) setQuantity(1)
                  }}
                  className="h-full w-8 bg-transparent text-center text-sm font-semibold tabular-nums text-text-primary outline-none [appearance:textfield] focus-visible:text-brand [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                />
                <button
                  type="button"
                  aria-label="Increase quantity"
                  disabled={quantity >= maxQuantity || disabled}
                  onClick={() => setClamped(quantity + 1)}
                  className="flex h-full w-9 items-center justify-center rounded-r-full text-text-secondary transition-colors duration-150 hover:text-brand disabled:opacity-30"
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
                disabled={disabled}
                aria-busy={isPending}
                // `min-w-0` let this flex-1 button shrink below its label's width on narrow
                // cards, truncating "Add to Cart" to "Add t...". Dropping it keeps flex-1's fill
                // behaviour (button still stretches over the row's spare width) while the label's
                // own width becomes the floor, so the text is never clipped.
                className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-full bg-brand px-4 text-sm font-semibold text-white transition-colors duration-200 hover:bg-brand-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {!isOutOfStock && <ShoppingCart aria-hidden className="h-4 w-4 shrink-0" />}
                <span className="whitespace-nowrap">
                  {isOutOfStock ? "Out of Stock" : isPending ? "Adding..." : "Add to Cart"}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </SpotlightCard>
  )
}

export default ProductCard
