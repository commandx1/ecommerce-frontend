import { ArrowRight } from "lucide-react"
import Link from "next/link"
import PageSectionContainer from "@/components/layout/PageSectionContainer"
import ProductCard, { type ProductCardData } from "@/features/products/listing/components/listing/ProductCard"
import type { HomeProductItem } from "@/features/home/types"

interface HomeTrendingProductsSectionProps {
  products: ReadonlyArray<HomeProductItem>
}

const parsePrice = (s: string) => parseFloat(s.replace(/[$,]/g, "")) || 0

const adaptHomeProduct = (p: HomeProductItem): ProductCardData => ({
  id: p.id,
  name: p.title,
  brand: p.category,
  imageSrc: p.image,
  price: parsePrice(p.price),
  oldPrice: p.originalPrice ? parsePrice(p.originalPrice) : undefined,
  stock: 1,
  href: `/products/${p.id}`,
})

export default function HomeTrendingProductsSection({ products }: HomeTrendingProductsSectionProps) {
  return (
    <PageSectionContainer as="section" className="relative py-6 lg:py-18">
      <div className="rounded-4xl border border-border-soft/80 bg-surface-elevated/75 p-6 shadow-panel backdrop-blur-xl sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="font-display text-3xl leading-tight text-text-primary sm:text-4xl">
              Trending products this week
            </h2>
            <p className="mt-2 max-w-[58ch] text-sm leading-relaxed text-text-secondary sm:text-base">
              Pricing, category tags, and quick-access product details are visible immediately to keep buying friction
              low.
            </p>
          </div>
          <Link
            href="/products"
            className="inline-flex min-h-11 items-center gap-2 rounded-full border border-border-strong/75 bg-surface px-5 py-3 text-sm font-semibold text-text-primary transition-colors hover:border-brand/45 hover:text-brand"
          >
            View Full Catalog
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.id} data={adaptHomeProduct(product)} />
          ))}
        </div>
      </div>
    </PageSectionContainer>
  )
}
