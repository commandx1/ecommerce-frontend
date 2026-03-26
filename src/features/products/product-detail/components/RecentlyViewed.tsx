"use client"

import Link from "next/link"
import ProductImageWithFallback from "@/features/products/listing/components/ProductImageWithFallback"
import recentlyViewedData from "@/data/recently-viewed.json"

const RecentlyViewed = () => {
  return (
    <section id="recently-viewed" className="bg-white py-12">
      <div className="app-container mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-steel-blue mb-8">Recently Viewed</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          {recentlyViewedData.map((product) => (
            <Link
              key={product.id}
              href={`/products/${product.id}`}
              className="bg-light-mint-gray rounded-xl p-4 hover:shadow-md transition-shadow cursor-pointer block"
            >
              <div className="relative h-32 overflow-hidden bg-white rounded-lg mb-3">
                <ProductImageWithFallback
                  className="object-contain p-2"
                  src={product.image}
                  alt={product.alt}
                  fill
                  sizes="(min-width: 1024px) 14vw, 40vw"
                />
              </div>
              <h3 className="font-semibold text-steel-blue text-sm mb-1 hover:underline">{product.title}</h3>
              <p className="text-gray-600 text-xs mb-2">{product.description}</p>
              <div className="text-steel-blue font-bold">{product.price}</div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}

export default RecentlyViewed
