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
    <section className="bg-white py-8">
      <PageSectionContainer as="div">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
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
