"use client"

import PageSectionContainer from "@/components/layout/PageSectionContainer"
import type { ProductHeroViewModel, SupplierViewModel } from "../types"
import ProductHeroDetails from "./ProductHeroDetails"
import ProductHeroGallery from "./ProductHeroGallery"

interface ProductHeroProps {
  product: ProductHeroViewModel
  selectedSupplier?: SupplierViewModel | null
}

const ProductHero = ({ product, selectedSupplier }: ProductHeroProps) => {
  return (
    <section className="bg-canvas py-8 md:py-10">
      <PageSectionContainer as="div">
        <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:gap-12">
          <ProductHeroGallery
            title={product.title}
            sku={product.sku}
            mainImage={product.mainImage}
            thumbnailImages={product.thumbnailImages}
            badge={product.badge}
          />
          <ProductHeroDetails product={product} selectedSupplier={selectedSupplier} />
        </div>
      </PageSectionContainer>
    </section>
  )
}

export default ProductHero
