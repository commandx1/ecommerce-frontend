"use client"

import Link from "next/link"
import PageSectionContainer from "@/components/layout/PageSectionContainer"
import recentlyViewedData from "@/data/recently-viewed.json"
import ProductImageWithFallback from "@/features/products/listing/components/ProductImageWithFallback"

const RecentlyViewed = () => {
  return (
    <section className="bg-canvas py-12">
      <PageSectionContainer as="div">
        <h2 className="mb-8 text-3xl font-semibold text-text-primary">Recently Viewed</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          {recentlyViewedData.map((product) => (
            <Link
              key={product.id}
              href={`/products/${product.id}`}
              className="block cursor-pointer rounded-[1.4rem] border border-border-soft bg-surface-elevated p-4 transition-shadow hover:shadow-soft"
            >
              <div className="relative mb-3 h-32 overflow-hidden rounded-xl border border-border-soft bg-surface-muted">
                <ProductImageWithFallback
                  className="object-contain p-2"
                  src={product.image}
                  alt={product.alt}
                  fill
                  sizes="(min-width: 1024px) 14vw, 40vw"
                />
              </div>
              <h3 className="mb-1 text-sm font-semibold text-text-primary hover:underline">{product.title}</h3>
              <p className="mb-2 text-xs text-text-secondary">{product.description}</p>
              <div className="font-bold text-brand">{product.price}</div>
            </Link>
          ))}
        </div>
      </PageSectionContainer>
    </section>
  )
}

export default RecentlyViewed
