import { getFullImageUrl } from "@/lib/api/products"
import type { ProductCardData } from "./ProductCard"

// Structurally compatible with both `APIProduct` (listing search results) and
// `FavoriteProductItem` (favorites endpoint) without casts - the listing type's fields are
// non-nullable, the favorites type's are nullable, and every field below accepts either.
export interface ProductCardSource {
  productId: string | number
  productName: string
  brand?: string | null
  coverPhotoPath?: string | null
  price: number | null
  oldPrice?: number | null
  overallStar?: number | null
  reviewCount?: number | null
  stock?: number | null
}

export const adaptProductCardData = (p: ProductCardSource): ProductCardData => ({
  id: p.productId,
  name: p.productName,
  brand: p.brand ?? undefined,
  imageSrc: p.coverPhotoPath ? getFullImageUrl(p.coverPhotoPath) : "/dentypro-product-placeholder.png",
  price: p.price ?? 0,
  oldPrice: p.oldPrice != null && p.price != null && p.oldPrice > p.price ? p.oldPrice : undefined,
  overallStar: p.overallStar ?? undefined,
  reviewCount: p.reviewCount ?? undefined,
  stock: p.stock ?? undefined,
  href: `/products/${p.productId}`,
  favoriteProductId: String(p.productId),
})
