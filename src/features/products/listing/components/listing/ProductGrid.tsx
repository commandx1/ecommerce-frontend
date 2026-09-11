import type { APIProduct } from "../ProductListingClient"
import { adaptProductCardData } from "./adaptProductCardData"
import ProductCard from "./ProductCard"

interface ProductGridProps {
  products: APIProduct[]
}

const ProductGrid = ({ products }: ProductGridProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
      {products.map((product) => (
        <ProductCard key={product.productId} data={adaptProductCardData(product)} />
      ))}
    </div>
  )
}

export default ProductGrid
