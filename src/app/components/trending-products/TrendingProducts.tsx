import productsData from "@/data/trending-products.json"
import ProductCard from "./ProductCard"

const TrendingProducts = () => {
  return (
    <section id="featured-products" className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-12">
          <div>
            <h2 className="text-4xl font-bold text-steel-blue mb-4">Trending Products</h2>
            <p className="text-xl text-gray-600">Most popular items among dental professionals this month</p>
          </div>
          <button
            type="button"
            className="bg-steel-blue text-white px-6 py-3 rounded-lg hover:bg-opacity-90 font-semibold transition-colors"
          >
            View All Products
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {productsData.map((product) => (
            <ProductCard key={product.id} {...product} href={`/products/${product.id}`} />
          ))}
        </div>
      </div>
    </section>
  )
}

export default TrendingProducts
