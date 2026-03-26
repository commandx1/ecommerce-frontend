import Link from "next/link"
import PageSectionContainer from "@/components/layout/PageSectionContainer"
import productsData from "@/data/trending-products.json"
import ProductCard from "@/features/home/components/ProductCard"
import SectionHeader from "@/features/home/components/SectionHeader"

export default function TrendingProducts() {
  return (
    <section className="py-16 bg-white">
      <PageSectionContainer as="div">
        <div className="mb-12">
          <SectionHeader
            title="Trending Products"
            description="Most popular items among dental professionals this month"
            actions={
              <Link
                href="/products"
                className="bg-steel-blue text-white px-6 py-3 rounded-lg hover:bg-opacity-90 font-semibold transition-colors"
              >
                View All Products
              </Link>
            }
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {productsData.map((product) => (
            <ProductCard key={product.id} {...product} href={`/products/${product.id}`} />
          ))}
        </div>
      </PageSectionContainer>
    </section>
  )
}
