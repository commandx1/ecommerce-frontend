"use client"

import { ArrowRight, Heart } from "lucide-react"
import Link from "next/link"
import PageSectionContainer from "@/components/layout/PageSectionContainer"
import SectionHeading from "@/components/layout/SectionHeading"
import productsData from "@/data/products.json"
import ProductImageWithFallback from "@/features/products/listing/components/ProductImageWithFallback"

interface RelatedProductsProps {
  currentProductId: number
}

const RelatedProducts = ({ currentProductId }: RelatedProductsProps) => {
  // Get related products (exclude current product, limit to 4)
  const relatedProducts = productsData.filter((p) => p.id !== currentProductId).slice(0, 4)
  return (
    <PageSectionContainer as="section" className="bg-surface-muted/45 py-12">
      <SectionHeading
        title="Related Products"
        className="mb-8"
        actions={
          <Link
            href="/categories/imaging-equipment"
            className="flex items-center font-medium text-brand hover:underline"
          >
            View All Imaging Equipment
            <ArrowRight className="ml-1 w-4 h-4" />
          </Link>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {relatedProducts.map((product) => (
          <div
            key={product.id}
            className="group overflow-hidden rounded-[1.75rem] border border-border-soft bg-surface-elevated transition-shadow hover:shadow-panel"
          >
            <Link href={`/products/${product.id}`} className="block">
              <div className="relative h-48 overflow-hidden border-b border-border-soft bg-surface-muted">
                <ProductImageWithFallback
                  className="object-contain p-4 group-hover:scale-105 transition-transform duration-300"
                  src={product.mainImage}
                  alt={product.alt}
                  fill
                  sizes="(min-width: 1024px) 25vw, 50vw"
                />
              </div>
            </Link>
            <div className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="rounded-full bg-surface-muted px-2.5 py-1 text-sm text-text-secondary">
                  {product.category}
                </span>
                <button
                  type="button"
                  className="text-text-muted transition-colors hover:text-danger"
                  aria-label="Add to favorites"
                >
                  <Heart className="w-5 h-5" fill="none" stroke="currentColor" />
                </button>
              </div>
              <Link href={`/products/${product.id}`} className="block">
                <h3 className="mb-2 text-lg font-semibold text-text-primary hover:underline">{product.title}</h3>
                <p className="mb-3 text-sm text-text-secondary">
                  {product.longDescription || product.description?.paragraphs?.[0] || ""}
                </p>
              </Link>
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-2xl font-bold text-brand">{product.price}</span>
                  {product.originalPrice && (
                    <span className="ml-2 text-sm text-text-muted line-through">{product.originalPrice}</span>
                  )}
                </div>
                <Link
                  href={`/products/${product.id}`}
                  className="inline-block rounded-full bg-brand px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-brand-strong"
                >
                  View Details
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </PageSectionContainer>
  )
}

export default RelatedProducts
