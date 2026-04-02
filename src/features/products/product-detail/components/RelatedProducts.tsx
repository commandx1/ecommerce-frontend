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
    <PageSectionContainer as="section" className="bg-gray-50 py-12">
      <SectionHeading
        title="Related Products"
        className="mb-8"
        actions={
          <Link
            href="/categories/imaging-equipment"
            className="text-steel-blue hover:underline font-medium flex items-center"
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
            className="bg-white rounded-2xl overflow-hidden hover:shadow-lg transition-shadow group"
          >
            <Link href={`/products/${product.id}`} className="block">
              <div className="relative h-48 overflow-hidden bg-gray-50">
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
                <span className="text-sm text-gray-600 bg-gray-50 px-2 py-1 rounded">{product.category}</span>
                <button
                  type="button"
                  className="text-gray-400 hover:text-red-500 transition-colors"
                  aria-label="Add to favorites"
                >
                  <Heart className="w-5 h-5" fill="none" stroke="currentColor" />
                </button>
              </div>
              <Link href={`/products/${product.id}`} className="block">
                <h3 className="text-lg font-semibold text-steel-blue mb-2 hover:underline">{product.title}</h3>
                <p className="text-sm text-gray-600 mb-3">
                  {product.longDescription || product.description?.paragraphs?.[0] || ""}
                </p>
              </Link>
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-2xl font-bold text-steel-blue">{product.price}</span>
                  {product.originalPrice && (
                    <span className="text-sm text-gray-500 line-through ml-2">{product.originalPrice}</span>
                  )}
                </div>
                <Link
                  href={`/products/${product.id}`}
                  className="bg-steel-blue text-white px-4 py-2 rounded-lg hover:bg-opacity-90 text-sm font-medium transition-colors inline-block"
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
